"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button, Snackbar } from "@mui/material";

import {
  canRegisterServiceWorker,
  detectIosSafari,
  getInstallAvailability,
  type InstallAvailability,
} from "./runtime";
import { useOnlineStatus } from "./useOnlineStatus";

type BeforeInstallPromptEvent = Event & Readonly<{
  prompt: () => Promise<void>;
  userChoice: Promise<Readonly<{ outcome: "accepted" | "dismissed" }>>;
}>;

type PwaContextValue = Readonly<{
  installAvailability: InstallAvailability;
  requestInstall: () => Promise<void>;
}>;

const PwaContext = createContext<PwaContextValue | null>(null);

const subscribeToClientEnvironment = (onStoreChange: () => void) => {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", onStoreChange);
  window.addEventListener("appinstalled", onStoreChange);

  return () => {
    displayMode.removeEventListener("change", onStoreChange);
    window.removeEventListener("appinstalled", onStoreChange);
  };
};

const getStandaloneSnapshot = () => (
  window.matchMedia("(display-mode: standalone)").matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
);

const getIosSafariSnapshot = () => detectIosSafari(
  navigator.userAgent,
  navigator.platform,
  navigator.maxTouchPoints,
);

export function usePwaInstall(): PwaContextValue {
  const value = useContext(PwaContext);
  if (value === null) throw new Error("usePwaInstall must be used within PwaProvider");
  return value;
}

type PwaProviderProps = Readonly<{ children: ReactNode }>;

export function PwaProvider({ children }: PwaProviderProps) {
  const isOnline = useOnlineStatus();
  const isStandalone = useSyncExternalStore(
    subscribeToClientEnvironment,
    getStandaloneSnapshot,
    () => false,
  );
  const isIosSafari = useSyncExternalStore(
    subscribeToClientEnvironment,
    getIosSafariSnapshot,
    () => false,
  );
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const reloadForUpdateRef = useRef(false);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!canRegisterServiceWorker({
      hostname: window.location.hostname,
      isProduction: process.env.NODE_ENV === "production",
      isSecureContext: window.isSecureContext,
      serviceWorkerSupported: "serviceWorker" in navigator,
    })) {
      return;
    }

    let disposed = false;
    let registration: ServiceWorkerRegistration | null = null;
    let installingWorker: ServiceWorker | null = null;

    const inspectWaitingWorker = () => {
      if (!disposed && registration?.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
      }
    };
    const handleInstallingState = () => {
      if (installingWorker?.state === "installed") inspectWaitingWorker();
    };
    const handleUpdateFound = () => {
      installingWorker?.removeEventListener("statechange", handleInstallingState);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener("statechange", handleInstallingState);
    };
    const handleControllerChange = () => {
      if (reloadForUpdateRef.current) window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    void navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then((nextRegistration) => {
        if (disposed) return;
        registration = nextRegistration;
        registration.addEventListener("updatefound", handleUpdateFound);
        inspectWaitingWorker();
        void registration.update();
      })
      .catch(() => {
        // La aplicación web continúa operativa si el navegador rechaza el registro.
      });

    return () => {
      disposed = true;
      installingWorker?.removeEventListener("statechange", handleInstallingState);
      registration?.removeEventListener("updatefound", handleUpdateFound);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  const installAvailability = getInstallAvailability({
    isIosSafari,
    isStandalone,
    promptAvailable: installPrompt !== null,
  });

  const requestInstall = useCallback(async () => {
    if (installPrompt === null) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const applyUpdate = () => {
    if (waitingWorker === null) return;
    reloadForUpdateRef.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  const contextValue = useMemo(() => ({
    installAvailability,
    requestInstall,
  }), [installAvailability, requestInstall]);

  return (
    <PwaContext.Provider value={contextValue}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        message="Sin conexión. Algunas funciones no están disponibles."
        open={!isOnline}
        slotProps={{ content: { "aria-live": "polite", role: "status" } }}
        sx={{ mt: "env(safe-area-inset-top)" }}
      />
      <Snackbar
        action={(
          <Button color="inherit" onClick={applyUpdate} size="small">
            Actualizar
          </Button>
        )}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        message="Hay una nueva versión disponible."
        open={isOnline && waitingWorker !== null}
        slotProps={{ content: { "aria-live": "polite", role: "status" } }}
        sx={{ mt: "env(safe-area-inset-top)" }}
      />
    </PwaContext.Provider>
  );
}
