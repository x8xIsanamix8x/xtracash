"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import type { PaymentSelection } from "./paymentOptions";
import {
  getConsumptionDetail,
  getInstallments,
  getPaymentData,
  InstallmentsServiceError,
} from "./services/installments";
import type { InstallmentsServiceErrorType } from "./services/installments";
import type {
  ConsumptionDetail,
  InstallmentsOverview,
  PaymentData,
} from "./types";

type CacheEntry =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "ready"; data: unknown }>
  | Readonly<{ status: "error"; error: InstallmentsServiceErrorType }>;

export type CachedResource<T> =
  | Readonly<{ status: "loading"; retry: () => void }>
  | Readonly<{ status: "ready"; data: T; retry: () => void }>
  | Readonly<{ status: "error"; error: InstallmentsServiceErrorType; retry: () => void }>;

type Fetcher = (signal: AbortSignal) => Promise<unknown>;

type InstallmentsContextValue = Readonly<{
  entries: Readonly<Record<string, CacheEntry>>;
  load: (key: string, fetcher: Fetcher) => void;
  invalidate: () => void;
  paymentSelections: Readonly<Record<string, PaymentSelection>>;
  setPaymentSelection: (consumptionId: string, selection: PaymentSelection) => void;
}>;

const InstallmentsContext = createContext<InstallmentsContextValue | null>(null);

const overviewKey = "overview";
const detailKey = (consumptionId: string) => `detail:${consumptionId}`;
const paymentDataKey = (consumptionId: string) => `payment-data:${consumptionId}`;

/**
 * Caché en memoria de Mis cuotas y de los detalles visitados. Vive en el layout de
 * `/installments`, así que navegar entre lista, detalle y reporte no repite llamadas.
 * Tras un reporte exitoso se llama `invalidate()` y todo se vuelve a pedir.
 */
export function InstallmentsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const [entries, setEntries] = useState<Record<string, CacheEntry>>({});
  const [paymentSelections, setPaymentSelections] =
    useState<Record<string, PaymentSelection>>({});
  const inflightRef = useRef(new Map<string, AbortController>());

  const load = useCallback((key: string, fetcher: Fetcher) => {
    if (inflightRef.current.has(key)) return;

    const controller = new AbortController();
    inflightRef.current.set(key, controller);
    setEntries((current) => ({ ...current, [key]: { status: "loading" } }));

    fetcher(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setEntries((current) => ({ ...current, [key]: { status: "ready", data } }));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const type = error instanceof InstallmentsServiceError ? error.type : "server";
        if (type === "aborted") return;
        if (type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }
        setEntries((current) => ({ ...current, [key]: { status: "error", error: type } }));
      })
      .finally(() => {
        if (inflightRef.current.get(key) === controller) {
          inflightRef.current.delete(key);
        }
      });
  }, [router]);

  const invalidate = useCallback(() => {
    for (const controller of inflightRef.current.values()) controller.abort();
    inflightRef.current.clear();
    setEntries({});
  }, []);

  const setPaymentSelection = useCallback(
    (consumptionId: string, selection: PaymentSelection) => {
      setPaymentSelections((current) => ({ ...current, [consumptionId]: selection }));
    },
    [],
  );

  useEffect(() => {
    const inflight = inflightRef.current;
    return () => {
      for (const controller of inflight.values()) controller.abort();
      inflight.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ entries, load, invalidate, paymentSelections, setPaymentSelection }),
    [entries, load, invalidate, paymentSelections, setPaymentSelection],
  );

  return (
    <InstallmentsContext.Provider value={value}>
      {children}
    </InstallmentsContext.Provider>
  );
}

function useInstallmentsContext() {
  const context = useContext(InstallmentsContext);
  if (!context) {
    throw new Error("useInstallments* debe usarse dentro de <InstallmentsProvider>.");
  }
  return context;
}

/** `fetcher` debe ser estable (módulo o `useCallback`). */
function useCachedResource<T>(key: string, fetcher: Fetcher): CachedResource<T> {
  const { entries, load } = useInstallmentsContext();
  const entry = entries[key];
  const retry = useCallback(() => load(key, fetcher), [fetcher, key, load]);

  useEffect(() => {
    if (!entry) retry();
  }, [entry, retry]);

  if (!entry || entry.status === "loading") return { status: "loading", retry };
  if (entry.status === "error") return { status: "error", error: entry.error, retry };
  return { status: "ready", data: entry.data as T, retry };
}

export function useInstallmentsOverview(): CachedResource<InstallmentsOverview> {
  return useCachedResource<InstallmentsOverview>(overviewKey, getInstallments);
}

export function useConsumptionDetail(consumptionId: string): CachedResource<ConsumptionDetail> {
  const fetcher = useCallback(
    (signal: AbortSignal) => getConsumptionDetail(consumptionId, signal),
    [consumptionId],
  );
  return useCachedResource<ConsumptionDetail>(detailKey(consumptionId), fetcher);
}

/** Datos de pago y cotización a HOY. Con otra fecha, el reporte pide `getPaymentData` directo. */
export function usePaymentData(consumptionId: string): CachedResource<PaymentData> {
  const fetcher = useCallback(
    (signal: AbortSignal) => getPaymentData(consumptionId, null, signal),
    [consumptionId],
  );
  return useCachedResource<PaymentData>(paymentDataKey(consumptionId), fetcher);
}

export function useInstallmentsCache() {
  const { invalidate, paymentSelections, setPaymentSelection } = useInstallmentsContext();
  return { invalidate, paymentSelections, setPaymentSelection };
}
