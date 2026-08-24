"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBackRounded,
  ReplayRounded,
  TuneRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import {
  CreditMovementsState,
  type CreditMovementsViewStatus,
} from "./components/CreditMovementsState";
import { MovementFilterDialog } from "./components/MovementFilterDialog";
import { MovementList } from "./components/MovementList";
import { MovementsSummaryCard } from "./components/MovementsSummaryCard";
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

const PAGE_SIZE = 20;
const initialFilters: CreditMovementFilters = {
  type: "all",
  status: "all",
};

function createQuery(
  filters: CreditMovementFilters,
  page: number,
): CreditMovementQuery {
  return {
    ...(filters.type === "all" ? {} : { type: filters.type }),
    ...(filters.status === "all" ? {} : { status: filters.status }),
    page,
    size: PAGE_SIZE,
  };
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

export function CreditMovementsView() {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<CreditMovementsPage | null>(null);
  const requestRef = useRef<{
    controller: AbortController;
    id: number;
  } | null>(null);
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<CreditMovementsViewStatus>("loading");
  const [data, setData] = useState<CreditMovementsPage | null>(null);
  const [filters, setFilters] = useState<CreditMovementFilters>(initialFilters);
  const [pendingFilters, setPendingFilters] = useState<CreditMovementFilters>(
    initialFilters,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [paginationExhausted, setPaginationExhausted] = useState(false);
  const [announcement, setAnnouncement] = useState("Cargando movimientos.");

  const requestPage = useCallback((
    page: number,
    nextFilters: CreditMovementFilters,
    mode: "replace" | "append",
  ) => {
    requestRef.current?.controller.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    requestRef.current = { controller, id: requestId };

    void getCreditMovements(createQuery(nextFilters, page), controller.signal)
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
    requestPage(0, initialFilters, "replace");

    return () => {
      window.cancelAnimationFrame(animationFrame);
      requestRef.current?.controller.abort();
      requestRef.current = null;
    };
  }, [requestPage]);

  const groups = useMemo(
    () => createMovementGroups(data?.movements ?? []),
    [data],
  );
  const filterLabel = getMovementFilterLabel(filters);
  const isFiltered = filters.type !== "all" || filters.status !== "all";
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
    requestPage(0, pendingFilters, "replace");
  };

  const loadMore = useCallback(() => {
    if (!data || !hasMore || isLoadingMore || requestRef.current) return;
    setIsLoadingMore(true);
    setLoadMoreError(false);
    setAnnouncement("Cargando más movimientos.");
    requestPage(data.page + 1, filters, "append");
  }, [data, filters, hasMore, isLoadingMore, requestPage]);

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
        bgcolor: "background.default",
        pt: "calc(16px + env(safe-area-inset-top))",
        pb: "calc(64px + env(safe-area-inset-bottom))",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ width: "100%", maxWidth: 760, mx: "auto" }}>
          <Stack
            component="header"
            direction="row"
            spacing={1}
            sx={{ minHeight: 48, alignItems: "center" }}
          >
            <IconButton
              aria-label="Volver al inicio"
              color="primary"
              component={Link}
              href="/home"
            >
              <ArrowBackRounded />
            </IconButton>
            <Typography
              component="h1"
              ref={titleRef}
              tabIndex={-1}
              variant="h4"
              sx={{
                flex: 1,
                color: "secondary.main",
                fontWeight: 700,
                outline: "none",
                borderRadius: 1,
                "&:focus-visible": {
                  outline: `3px solid ${themeTokens.color.focus}`,
                  outlineOffset: 3,
                },
              }}
            >
              Movimientos
            </Typography>
            <Typography
              noWrap
              sx={{
                color: themeTokens.color.brandLogo,
                display: { xs: "none", sm: "block" },
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Impúlsate Móvil
            </Typography>
          </Stack>

          {status === "ready" && data ? (
            <>
              <MovementsSummaryCard data={data} />
              <Box component="section" aria-labelledby="recent-movements-title">
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}
                >
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography
                      component="h2"
                      id="recent-movements-title"
                      variant="h5"
                      sx={{ color: "secondary.main", fontWeight: 700 }}
                    >
                      Movimientos recientes
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Filtro: {filterLabel}
                    </Typography>
                  </Stack>
                  <Button
                    aria-label={`Filtrar movimientos. Filtro activo: ${filterLabel}`}
                    onClick={openFilter}
                    startIcon={<TuneRounded />}
                    sx={{ flexShrink: 0 }}
                    type="button"
                    variant={isFiltered ? "contained" : "outlined"}
                  >
                    Filtrar
                  </Button>
                </Stack>
                <MovementList groups={groups} isFiltered={isFiltered} />

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
      <AppBottomNavigation activeItem="movements" />
      <MovementFilterDialog
        onApply={applyFilters}
        onChange={setPendingFilters}
        onClose={() => setIsFilterOpen(false)}
        open={isFilterOpen}
        pendingFilters={pendingFilters}
      />
    </Box>
  );
}
