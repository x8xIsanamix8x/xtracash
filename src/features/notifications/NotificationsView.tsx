"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AccountBalanceWalletRounded,
  AccessTimeRounded,
  CheckCircleOutlineRounded,
  EventAvailableRounded,
  MarkEmailReadRounded,
  NotificationsActiveRounded,
  NotificationsOffRounded,
  PaymentRounded,
  ReplayRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { APP_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { AppBackButton } from "@/components/AppBackButton";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import type { NotificationItem, NotificationsPage } from "./types";
import {
  getUnreadCount,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationsServiceError,
} from "./services/notifications";

const PAGE_SIZE = 20;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(new Date(value)).replace(/\./g, "");
}

function formatAmount(value: string): string {
  return `Bs. ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}`;
}

function getNotificationIcon(notification: NotificationItem) {
  const hint = `${notification.type ?? ""} ${notification.subject}`.toLocaleLowerCase("es-VE");
  if (hint.includes("vencid") || hint.includes("mora")) return WarningAmberRounded;
  if (hint.includes("pago") || hint.includes("reporte")) return PaymentRounded;
  if (hint.includes("financiamiento") || hint.includes("solicitud")) return AccountBalanceWalletRounded;
  if (hint.includes("próximo") || hint.includes("proximo") || hint.includes("día de pago")) return EventAvailableRounded;
  if (hint.includes("viernes")) return NotificationsActiveRounded;
  return NotificationsActiveRounded;
}

function sortNewestFirst(items: readonly NotificationItem[]) {
  return [...items].sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
}

export function NotificationsView() {
  const router = useRouter();
  const mainRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<NotificationsPage | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [busyRead, setBusyRead] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [paginationExhausted, setPaginationExhausted] = useState(false);
  const [readError, setReadError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [announcement, setAnnouncement] = useState("Cargando notificaciones.");

  const loadFirstPage = useCallback((signal: AbortSignal) => {
    void getNotifications(0, PAGE_SIZE, signal)
      .then((page) => {
        if (signal.aborted) return;
        setData({ ...page, items: sortNewestFirst(page.items) });
        setPaginationExhausted(page.items.length === 0);
        setUnreadTotal(page.items.filter((item) => !item.isRead).length);
        setStatus("ready");
        setAnnouncement(page.items.length
          ? `${page.total} ${page.total === 1 ? "notificación disponible" : "notificaciones disponibles"}.`
          : "No tienes notificaciones.");
      })
      .catch((error: unknown) => {
        if (signal.aborted || (error instanceof NotificationsServiceError && error.type === "aborted")) return;
        if (error instanceof NotificationsServiceError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }
        setData(null);
        setStatus("error");
        setAnnouncement("No pudimos cargar tus notificaciones.");
      });
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    const animationFrame = window.requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
    loadFirstPage(controller.signal);
    void getUnreadCount(controller.signal)
      .then(setUnreadTotal)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof NotificationsServiceError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
        }
      });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      controller.abort();
    };
  }, [loadFirstPage, router]);

  const unreadCount = useMemo(
    () => data?.items.some((item) => !item.isRead) ? Math.max(unreadTotal, data.items.filter((item) => !item.isRead).length) : unreadTotal,
    [data, unreadTotal],
  );

  const openNotification = (notification: NotificationItem) => {
    mainRef.current?.scrollTo({ top: 0 });
    setSelected(notification);
    setReadError(false);
    if (notification.isRead) return;
    setBusyRead(true);
    void markNotificationRead(notification.id)
      .then(() => {
        setData((current) => current ? {
          ...current,
          items: current.items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item),
        } : current);
        setSelected((current) => current?.id === notification.id ? { ...current, isRead: true } : current);
        setUnreadTotal((current) => Math.max(0, current - 1));
        setAnnouncement("Notificación marcada como leída.");
      })
      .catch((error: unknown) => {
        if (error instanceof NotificationsServiceError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }
        setReadError(true);
      })
      .finally(() => setBusyRead(false));
  };

  const markAllRead = () => {
    if (busyRead || unreadCount === 0) return;
    setBusyRead(true);
    setReadError(false);
    void markAllNotificationsRead()
      .then(() => {
        setData((current) => current ? {
          ...current,
          items: current.items.map((item) => ({ ...item, isRead: true })),
        } : current);
        setSelected((current) => current ? { ...current, isRead: true } : current);
        setUnreadTotal(0);
        setAnnouncement("Todas las notificaciones están marcadas como leídas.");
      })
      .catch((error: unknown) => {
        if (error instanceof NotificationsServiceError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }
        setReadError(true);
      })
      .finally(() => setBusyRead(false));
  };

  const loadMore = () => {
    if (!data || busyRead || isLoadingMore || paginationExhausted || data.items.length >= data.total) return;
    setLoadMoreError(false);
    setIsLoadingMore(true);
    const controller = new AbortController();
    void getNotifications(data.page + 1, PAGE_SIZE, controller.signal)
      .then((nextPage) => {
        const newItems = nextPage.items.filter((next) => !data.items.some((item) => item.id === next.id));
        setPaginationExhausted(nextPage.items.length === 0 || newItems.length === 0);
        setData((current) => current ? {
          ...nextPage,
          items: sortNewestFirst([...current.items, ...newItems]),
        } : nextPage);
      })
      .catch((error: unknown) => {
        if (error instanceof NotificationsServiceError && error.type === "unauthenticated") router.replace(sessionExpiredUrl);
        else setLoadMoreError(true);
      })
      .finally(() => setIsLoadingMore(false));
  };

  const retry = () => {
    setStatus("loading");
    loadFirstPage(new AbortController().signal);
  };
  const isDetail = selected !== null;

  return (
    <Box
      component="main"
      ref={mainRef}
      sx={{
        height: "100dvh",
        minHeight: 0,
        boxSizing: "border-box",
        overflowY: "auto",
        overscrollBehaviorY: "contain",
        bgcolor: "background.default",
        pt: "calc(16px + env(safe-area-inset-top))",
        pb: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 32}px + env(safe-area-inset-bottom))`,
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={2.5} sx={{ width: "100%", maxWidth: 760, mx: "auto" }}>
          <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", position: "relative", justifyContent: "center" }}>
            {isDetail ? (
              <Box sx={{ position: "absolute", left: 0, top: 4, zIndex: 1 }}>
                <AppBackButton label="Volver a notificaciones" onClick={() => { setSelected(null); setReadError(false); }} />
              </Box>
            ) : (
              <Box sx={{ position: "absolute", left: 0, top: 4, zIndex: 1 }}>
                <AppBackButton href="/home" label="Volver al inicio" />
              </Box>
            )}
            <Typography
              component="h1"
              ref={titleRef}
              tabIndex={-1}
              sx={{ color: "secondary.main", fontSize: { xs: "1.65rem", sm: "2rem" }, fontWeight: 700, textAlign: "center", outline: "none" }}
            >
              {isDetail ? "Detalle de notificación" : "Notificaciones"}
            </Typography>
            {!isDetail && unreadCount > 0 && (
              <IconButton aria-label="Marcar todas como leídas" disabled={busyRead} onClick={markAllRead} sx={{ position: "absolute", right: 0, color: "primary.main" }}>
                <MarkEmailReadRounded />
              </IconButton>
            )}
          </Stack>

          {isDetail && selected ? (
            <Card component="article" variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 4 }, "&:last-child": { pb: { xs: 2.5, sm: 4 } } }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", color: "primary.main", bgcolor: "rgba(60, 68, 209, 0.10)" }}>
                      {(() => { const Icon = getNotificationIcon(selected); return <Icon />; })()}
                    </Box>
                    <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                      <Typography component="h2" variant="h5" sx={{ color: "secondary.main", fontWeight: 700, overflowWrap: "anywhere" }}>{selected.subject}</Typography>
                      <Typography color="text.secondary" variant="body2">{formatDateTime(selected.occurredAt)}</Typography>
                    </Stack>
                  </Stack>
                  <Divider />
                  {selected.amountBs && (
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "secondary.main" }}>
                      <PaymentRounded color="primary" fontSize="small" />
                      <Typography sx={{ fontWeight: 700 }}>{formatAmount(selected.amountBs)}</Typography>
                    </Stack>
                  )}
                  <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.65, overflowWrap: "anywhere" }}>{selected.message}</Typography>
                  {selected.operationId && (
                    <Typography color="text.secondary" variant="body2">Operación: {selected.operationId}</Typography>
                  )}
                  {busyRead && <Stack direction="row" spacing={1} role="status" aria-live="polite" sx={{ alignItems: "center" }}><CircularProgress size={18} /><Typography color="text.secondary" variant="body2">Actualizando estado de lectura…</Typography></Stack>}
                  {readError && <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => openNotification(selected)}>Reintentar</Button>}>No pudimos actualizar el estado de lectura. Puedes volver a intentarlo.</Alert>}
                </Stack>
              </CardContent>
            </Card>
          ) : status === "loading" ? (
            <Stack aria-busy="true" aria-label="Cargando notificaciones" role="status" spacing={1.5}>
              {[0, 1, 2].map((item) => <Skeleton key={item} height={112} variant="rounded" />)}
            </Stack>
          ) : status === "error" ? (
            <Card variant="outlined" sx={{ minHeight: 340, borderRadius: 2, display: "grid", placeItems: "center" }}>
              <Stack spacing={2} sx={{ maxWidth: 430, alignItems: "center", textAlign: "center", p: 3 }}>
                <NotificationsOffRounded color="error" sx={{ fontSize: 52 }} />
                <Typography component="h2" variant="h5" sx={{ color: "secondary.main", fontWeight: 700 }}>No pudimos cargar tus notificaciones</Typography>
                <Typography color="text.secondary">Inténtalo nuevamente para consultar los avisos de tu financiamiento.</Typography>
                <Button onClick={retry} startIcon={<ReplayRounded />} variant="contained">Reintentar</Button>
              </Stack>
            </Card>
          ) : data?.items.length === 0 ? (
            <Card variant="outlined" sx={{ minHeight: 340, borderRadius: 2, display: "grid", placeItems: "center" }}>
              <Stack spacing={2} sx={{ maxWidth: 430, alignItems: "center", textAlign: "center", p: 3 }}>
                <Box sx={{ width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center", color: "primary.main", bgcolor: "rgba(60, 68, 209, 0.10)" }}><NotificationsOffRounded sx={{ fontSize: 38 }} /></Box>
                <Typography component="h2" variant="h5" sx={{ color: "secondary.main", fontWeight: 700 }}>Notificaciones</Typography>
                <Typography color="text.secondary">No tienes notificaciones disponibles por ahora.</Typography>
              </Stack>
            </Card>
          ) : (
            <Stack component="section" aria-label="Historial de notificaciones" spacing={1.5}>
              {unreadCount > 0 && (
                <Typography color="text.secondary" variant="body2" sx={{ alignSelf: "flex-end" }}>
                  {unreadCount} {unreadCount === 1 ? "sin leer" : "sin leer"}
                </Typography>
              )}
              {data?.items.map((notification) => {
                const Icon = getNotificationIcon(notification);
                return (
                  <Card key={notification.id} sx={{ borderRadius: 2, bgcolor: notification.isRead ? "background.paper" : "rgba(60, 68, 209, 0.06)", border: "1px solid", borderColor: notification.isRead ? "rgba(2, 0, 77, 0.08)" : "rgba(60, 68, 209, 0.24)", boxShadow: "none" }}>
                    <CardActionArea aria-label={`${notification.subject}, ${notification.isRead ? "leída" : "no leída"}`} onClick={() => openNotification(notification)}>
                      <CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, "&:last-child": { pb: { xs: 1.75, sm: 2.25 } } }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                          <Box sx={{ position: "relative", width: 48, height: 48, flexShrink: 0, borderRadius: 2, display: "grid", placeItems: "center", color: "common.white", bgcolor: themeTokens.color.brandDeep }}>
                            <Icon />
                            {!notification.isRead && <Box aria-hidden="true" sx={{ position: "absolute", width: 10, height: 10, top: -3, right: -3, borderRadius: "50%", bgcolor: "primary.main", border: "2px solid white" }} />}
                          </Box>
                          <Stack spacing={0.525} sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                              <Typography component="h2" sx={{ color: "secondary.main", fontWeight: notification.isRead ? 600 : 700, lineHeight: 1.35, overflowWrap: "anywhere" }}>{notification.subject}</Typography>
                              {notification.amountBs && <Typography sx={{ color: "text.primary", fontWeight: 700, whiteSpace: "nowrap", textAlign: "right" }}>{formatAmount(notification.amountBs)}</Typography>}
                            </Stack>
                            <Typography color="text.secondary" sx={{ display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, lineHeight: 1.4 }}>{notification.message}</Typography>
                            <Stack direction="row" spacing={0.6} sx={{ alignItems: "center", mt: 0.25 }}>
                              {notification.isRead ? <CheckCircleOutlineRounded sx={{ fontSize: 15, color: "text.secondary" }} /> : <AccessTimeRounded sx={{ fontSize: 15, color: "primary.main" }} />}
                              <Typography color="text.secondary" variant="caption">{formatDateTime(notification.occurredAt)}</Typography>
                              <Typography color={notification.isRead ? "text.secondary" : "primary.main"} variant="caption" sx={{ ml: "auto !important", fontWeight: notification.isRead ? 400 : 700 }}>{notification.isRead ? "Leída" : "No leída"}</Typography>
                            </Stack>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );
              })}
              {data && !paginationExhausted && data.items.length < data.total && (
                <Button disabled={busyRead || isLoadingMore} onClick={loadMore} variant="outlined" sx={{ alignSelf: "center", mt: 1 }}>
                  {isLoadingMore ? "Cargando…" : "Ver notificaciones anteriores"}
                </Button>
              )}
              {loadMoreError && <Alert severity="error" action={<Button color="inherit" size="small" onClick={loadMore}>Reintentar</Button>}>No pudimos cargar el historial.</Alert>}
            </Stack>
          )}
        </Stack>
      </Container>
      <Box aria-live="polite" role="status" sx={{ position: "absolute", width: 1, height: 1, p: 0, m: "-1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}>{announcement}</Box>
      <AppBottomNavigation activeItem="home" />
    </Box>
  );
}
