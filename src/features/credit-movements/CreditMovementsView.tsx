"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NotificationsNoneRounded,
  SearchRounded,
  ReplayRounded,
  TuneRounded,
} from "@mui/icons-material";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { AppBackButton } from "@/components/AppBackButton";
import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import { getProfilePersonalInfo, ProfileServiceError } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import {
  CreditMovementsState,
  type CreditMovementsViewStatus,
} from "./components/CreditMovementsState";
import { MovementFilterDialog } from "./components/MovementFilterDialog";
import { MovementList } from "./components/MovementList";
import {
  createMovementGroups,
  getMovementFilterLabel,
} from "./presentation";
import {
  CreditMovementsServiceError,
  getCreditMovements,
} from "./services/creditMovements";
import type {
  CreditMovement,
  CreditMovementFilters,
  CreditMovementQuery,
  CreditMovementsPage,
} from "./types";
import { canAccessMarketplace } from "../home/marketplaceAccess";

const PAGE_SIZE = 20;
const initialFilters: CreditMovementFilters = {
  type: "all",
  status: "all",
};

function createQuery(
  filters: CreditMovementFilters,
  page: number,
  searchQuery?: string,
): CreditMovementQuery {
  return {
    ...(filters.type === "all" ? {} : { type: filters.type }),
    ...(filters.status === "all" ? {} : { status: filters.status }),
    ...(searchQuery?.trim() ? { q: searchQuery.trim() } : {}),
    page,
    size: PAGE_SIZE,
  };
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es-VE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function movementMatchesSearch(
  movement: CreditMovement,
  normalizedSearch: string,
): boolean {
  if (!normalizedSearch) return true;

  return [
    movement.label,
    movement.counterparty,
    movement.beneficiaryName,
    movement.bankReference,
    movement.statusDetail,
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => normalizeSearchText(value).includes(normalizedSearch));
}

function mergeMovements(
  current: readonly CreditMovement[],
  next: readonly CreditMovement[],
): readonly CreditMovement[] {
  const ids = new Set(current.map((movement) => movement.id));
  const merged = [...current];
  next.forEach((movement) => {
    if (!ids.has(movement.id)) {
      ids.add(movement.id);
      merged.push(movement);
    }
  });
  return merged;
}

export function CreditMovementsView({ variant = "standard" }: Readonly<{ variant?: "standard" | "marketplace" }>) {
  const router = useRouter();
  const isMarketplace = variant === "marketplace";
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<CreditMovementsPage | null>(null);
  const requestRef = useRef<{
    controller: AbortController;
    id: number;
  } | null>(null);
  const requestIdRef = useRef(0);
  const lastServerSearchRef = useRef("");
  const [status, setStatus] = useState<CreditMovementsViewStatus>("loading");
  const [data, setData] = useState<CreditMovementsPage | null>(null);
  const [filters, setFilters] = useState<CreditMovementFilters>(initialFilters);
  const [pendingFilters, setPendingFilters] = useState<CreditMovementFilters>(
    initialFilters,
  );
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [paginationExhausted, setPaginationExhausted] = useState(false);
  const [announcement, setAnnouncement] = useState("Cargando movimientos.");
  const [marketplaceAccess, setMarketplaceAccess] = useState<"checking" | "allowed" | "denied">(isMarketplace ? "checking" : "allowed");

  const requestPage = useCallback((
    page: number,
    nextFilters: CreditMovementFilters,
    mode: "replace" | "append",
    searchQuery = "",
  ) => {
    requestRef.current?.controller.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    requestRef.current = { controller, id: requestId };

    void getCreditMovements(createQuery(nextFilters, page, searchQuery), controller.signal)
      .then((nextPage) => {
        if (requestRef.current?.id !== requestId) return;

        const current = dataRef.current;
        const nextData = mode === "replace" || current === null
          ? nextPage
          : {
            ...nextPage,
            movements: mergeMovements(current.movements, nextPage.movements),
          };
        const appendedNoNewMovements = mode === "append"
          && current !== null
          && nextData.movements.length === current.movements.length;
        dataRef.current = nextData;
        setData(nextData);
        setStatus("ready");
        setLoadMoreError(false);
        setPaginationExhausted(
          nextPage.movements.length === 0 || appendedNoNewMovements,
        );
        const visibleCount = nextData.movements.length;
        setAnnouncement(
          `${visibleCount} de ${nextPage.total} ${nextPage.total === 1 ? "movimiento disponible" : "movimientos disponibles"}.`,
        );
      })
      .catch((error: unknown) => {
        if (requestRef.current?.id !== requestId) return;
        if (
          error instanceof CreditMovementsServiceError
          && error.type === "aborted"
        ) {
          return;
        }

        if (
          error instanceof CreditMovementsServiceError
          && error.type === "unauthenticated"
        ) {
          dataRef.current = null;
          setData(null);
          router.replace(sessionExpiredUrl);
          return;
        }

        if (mode === "append") {
          setLoadMoreError(true);
          setAnnouncement("No pudimos cargar más movimientos.");
          return;
        }

        dataRef.current = null;
        setData(null);
        setStatus("error");
        setAnnouncement("No pudimos cargar tus movimientos.");
      })
      .finally(() => {
        if (requestRef.current?.id === requestId) {
          requestRef.current = null;
          setIsLoadingMore(false);
        }
      });
  }, [router]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true });
    });
    if (!isMarketplace) requestPage(0, initialFilters, "replace");

    return () => {
      window.cancelAnimationFrame(animationFrame);
      requestRef.current?.controller.abort();
      requestRef.current = null;
    };
  }, [isMarketplace, requestPage]);

  useEffect(() => {
    if (!isMarketplace) return;
    const controller = new AbortController();
    void getProfilePersonalInfo(controller.signal)
      .then(({ email }) => {
        if (controller.signal.aborted) return;
        if (!canAccessMarketplace(email)) {
          setMarketplaceAccess("denied");
          router.replace("/home");
          return;
        }
        setMarketplaceAccess("allowed");
        requestPage(0, initialFilters, "replace");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ProfileServiceError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }
        setMarketplaceAccess("denied");
      });
    return () => controller.abort();
  }, [isMarketplace, requestPage, router]);

  useEffect(() => {
    if (!isMarketplace || marketplaceAccess !== "allowed") return;
    const normalizedQuery = search.trim();
    if (normalizedQuery === lastServerSearchRef.current) return;
    const timeout = window.setTimeout(() => {
      lastServerSearchRef.current = normalizedQuery;
      dataRef.current = null;
      requestPage(0, filters, "replace", normalizedQuery);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [filters, isMarketplace, marketplaceAccess, requestPage, search]);

  const normalizedSearch = normalizeSearchText(search);
  const filteredMovements = useMemo(
    () => (data?.movements ?? []).filter((movement) => (
      movementMatchesSearch(movement, normalizedSearch)
    )),
    [data, normalizedSearch],
  );
  const groups = useMemo(
    () => createMovementGroups(filteredMovements),
    [filteredMovements],
  );
  const isFiltered = filters.type !== "all"
    || filters.status !== "all"
    || Boolean(normalizedSearch);
  const hasMore = data !== null
    && data.movements.length < data.total
    && !paginationExhausted;

  const retry = () => {
    dataRef.current = null;
    setData(null);
    setStatus("loading");
    setPaginationExhausted(false);
    setAnnouncement("Cargando movimientos.");
    requestPage(0, filters, "replace");
  };

  const openFilter = () => {
    setPendingFilters(filters);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    if (
      pendingFilters.type === filters.type
      && pendingFilters.status === filters.status
    ) {
      return;
    }

    setFilters(pendingFilters);
    dataRef.current = null;
    setData(null);
    setStatus("loading");
    setIsLoadingMore(false);
    setLoadMoreError(false);
    setPaginationExhausted(false);
    setAnnouncement(
      `Consultando movimientos. Filtro ${getMovementFilterLabel(pendingFilters)}.`,
    );
    requestPage(0, pendingFilters, "replace", search);
  };

  const loadMore = useCallback(() => {
    if (!data || !hasMore || isLoadingMore || requestRef.current) return;
    setIsLoadingMore(true);
    setLoadMoreError(false);
    setAnnouncement("Cargando más movimientos.");
    requestPage(data.page + 1, filters, "append", search);
  }, [data, filters, hasMore, isLoadingMore, requestPage, search]);

  useEffect(() => {
    if (
      status !== "ready"
      || !hasMore
      || isLoadingMore
      || loadMoreError
    ) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    }, { rootMargin: "160px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore, loadMoreError, status]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: isMarketplace ? "#F0EFFF" : "background.default",
        pt: isMarketplace ? "calc(10px + env(safe-area-inset-top))" : "calc(16px + env(safe-area-inset-top))",
        pb: isMarketplace ? "calc(96px + env(safe-area-inset-bottom))" : "calc(88px + env(safe-area-inset-bottom))",
      }}
    >
      <Container maxWidth={isMarketplace ? false : "md"} sx={isMarketplace ? { px: { xs: 2, sm: 3 }, maxWidth: 560 } : undefined}>
        <Stack spacing={isMarketplace ? 1.5 : 3} sx={{ width: "100%", maxWidth: isMarketplace ? 560 : 760, mx: "auto" }}>
          <Stack
            component="header"
            direction="row"
            sx={{ minHeight: isMarketplace ? 54 : 56, alignItems: "center", justifyContent: "space-between", position: "relative" }}
          >
            {isMarketplace ? <Image src="/entry/isotipo-impulsa.png" alt="Impulsa" width={28} height={28} style={{ objectFit: "contain" }} /> : <Box sx={{ position: "absolute", left: 0, top: 4, zIndex: 1 }}><AppBackButton href="/home" label="Volver al inicio" /></Box>}
            <Typography
              component="h1"
              ref={titleRef}
              tabIndex={-1}
                variant={isMarketplace ? "h6" : "h4"}
              sx={{
                width: isMarketplace ? "auto" : "100%",
                flex: isMarketplace ? 1 : undefined,
                color: "secondary.main",
                fontSize: isMarketplace ? "1.1rem" : { xs: "2rem", sm: "2.25rem" },
                fontWeight: isMarketplace ? 700 : 500,
                textAlign: "center",
                outline: "none",
                borderRadius: 1,
                "&:focus-visible": {
                  outline: `3px solid ${themeTokens.color.focus}`,
                  outlineOffset: 3,
                },
              }}
            >
              {isMarketplace ? "Mis consumos" : "Mis consumos"}
            </Typography>
            {isMarketplace ? <IconButton aria-label="Notificaciones" size="small" sx={{ color: "primary.main" }}><NotificationsNoneRounded /></IconButton> : <Box sx={{ width: 40 }} />}
          </Stack>

          {isMarketplace && marketplaceAccess !== "allowed" ? <Box sx={{ minHeight: "50vh" }} /> : null}

          {status === "ready" && data ? (
            <>
              <Box component="section" aria-labelledby="recent-movements-title">
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mb: 1, alignItems: "stretch" }}
                >
                  <TextField
                    fullWidth
                    onChange={(event) => {
                      setSearch(event.target.value);
                    }}
                    placeholder={isMarketplace ? "Buscar consumo" : "Buscar consumo"}
                    slotProps={{
                      input: {
                        startAdornment: <SearchRounded color="primary" />,
                        sx: isMarketplace ? { bgcolor: "#fff", borderRadius: "12px", height: 46 } : undefined,
                      },
                    }}
                    value={search}
                  />
                  <Button
                    onClick={openFilter}
                    startIcon={isMarketplace ? undefined : <TuneRounded />}
                    sx={isMarketplace ? { minWidth: 58, width: 58, bgcolor: "#fff", color: "primary.main", borderRadius: "12px" } : { minWidth: { sm: 132 }, flexShrink: 0 }}
                    type="button"
                    variant={isMarketplace ? "outlined" : "contained"}
                    aria-label="Filtrar movimientos"
                  >
                    {isMarketplace ? <TuneRounded /> : "Filtrar"}
                  </Button>
                </Stack>
                {!isMarketplace && <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mb: 2, overflowX: "auto" }}
                >
                  {([
                    ["all", "Todos"],
                    ["CONSUMO", "Consumos"],
                    ["REPORTE_PAGO", "Pagos"],
                  ] as const).map(([type, label]) => (
                    <Button
                      key={type}
                      onClick={() => {
                        const nextFilters = { ...filters, type: type === "all" ? "all" : type } as CreditMovementFilters;
                        setFilters(nextFilters);
                        setPendingFilters(nextFilters);
                        setStatus("loading");
                        requestPage(0, nextFilters, "replace");
                      }}
                      sx={{ minWidth: 112, flex: 1, whiteSpace: "nowrap" }}
                      type="button"
                      variant={filters.type === type ? "contained" : "outlined"}
                    >
                      {label}
                    </Button>
                  ))}
                </Stack>}
                <MovementList groups={groups} isFiltered={isFiltered} variant={variant} />

                {hasMore && (
                  <Box
                    aria-hidden="true"
                    ref={sentinelRef}
                    sx={{ width: "100%", height: "1px" }}
                  />
                )}
                {isLoadingMore && (
                  <Stack
                    aria-live="polite"
                    role="status"
                    spacing={1}
                    sx={{ mt: 2, alignItems: "center" }}
                  >
                    <CircularProgress size={24} />
                    <Typography color="text.secondary" variant="body2">
                      Cargando más movimientos…
                    </Typography>
                  </Stack>
                )}
                {loadMoreError && hasMore && (
                  <Stack spacing={1.5} sx={{ mt: 2, alignItems: "center" }}>
                    <Alert severity="error" sx={{ width: "100%" }}>
                      No pudimos cargar más movimientos. Puedes intentarlo nuevamente.
                    </Alert>
                    <Button
                      onClick={loadMore}
                      startIcon={<ReplayRounded />}
                      type="button"
                      variant="outlined"
                    >
                      Reintentar
                    </Button>
                  </Stack>
                )}
              </Box>
            </>
          ) : (
            <CreditMovementsState
              onRetry={retry}
              status={status === "ready" ? "error" : status}
            />
          )}
        </Stack>
      </Container>

      <Box
        aria-live="polite"
        role="status"
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          p: 0,
          m: "-1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announcement}
      </Box>
      <AppBottomNavigation activeItem="movements" variant={variant} />
      <MovementFilterDialog
        onApply={applyFilters}
        onChange={setPendingFilters}
        onClose={() => setIsFilterOpen(false)}
        open={isFilterOpen}
        pendingFilters={pendingFilters}
        variant={variant}
      />
    </Box>
  );
}
