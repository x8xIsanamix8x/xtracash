"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AccountBalanceWalletRounded, CheckCircleRounded, CheckRounded, CloseRounded, ContentCopyRounded, InfoOutlined, SavingsRounded } from "@mui/icons-material";
import { Alert, Box, Button, Checkbox, Dialog, FormControlLabel, IconButton, MenuItem, Slider, Slide, Stack, TextField, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";
import { createPurchase, getMarketplaceHours, getMarketplaceLimit, getMarketplacePaymentData, getProductPlan, getPurchases, getPurchase, getPurchaseContract, payC2p, reportInitialPayment, requestC2pOtp, signPurchase, MarketplaceServiceError } from "../services/marketplace";
import { createCopyAllText, createInstructionRows } from "../../installments/paymentInstructions";
import { getMarketplacePaymentMethods, hasInitialPaymentDestination, isValidC2pOtp, isValidInitialPayment, parseC2pOtpResponse, parsePurchaseDestination, type MarketplacePaymentMethod } from "../paymentPresentation";
import { MarketplaceProductImage } from "./MarketplaceProductImage";
import { getSourceBanks } from "../../installments/services/installments";
import type { SourceBank } from "../../installments/types";
import { findActiveMarketplacePurchaseForProduct, marketplacePurchaseProductId } from "../purchaseAvailability";
import { getInitialPlanReason, mergeMarketplaceInitialOptions, parseMarketplaceInitialOptions, parseMarketplaceQuotedInitialOption, sameInitialPercentage, type MarketplaceInitialOption } from "../planOptions";
import { isConfirmedMarketplacePurchaseStage } from "../purchaseManagement";

const blue = "#2751E6";
const surface = "#F0EFFF";
const INITIAL_PERCENTAGES = Array.from({ length: 8 }, (_, index) => 30 + index * 10);
// Core publica las respuestas de compra como esquemas abiertos; se mantiene este
// único límite dinámico mientras se valida cada campo usado en la vista.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;
type Stage = "plan" | "review" | "payment" | "pay" | "report" | "c2p" | "status" | "contract" | "signed";
const SlideUp = forwardRef(function SlideUp(props: TransitionProps & { children: React.ReactElement }, ref: React.Ref<unknown>) { return <Slide direction="up" ref={ref} {...props} />; });
const get = (value: unknown, key: string): AnyRecord => value && typeof value === "object" ? (value as AnyRecord)[key] ?? {} : {};
function purchaseItems(data: unknown): AnyRecord[] {
  if (Array.isArray(data)) return data as AnyRecord[];
  const items = get(data, "items");
  if (Array.isArray(items)) return items as AnyRecord[];
  const content = get(data, "content");
  return Array.isArray(content) ? content as AnyRecord[] : [];
}
async function getPurchaseWithPaymentDestination(id: string, signal?: AbortSignal) {
  const result = await getPurchase(id, signal);
  if (result.data.etapa !== "PAGAR_INICIAL") return result;
  const currentDestination = parsePurchaseDestination(result.data.pagarA);
  if (hasInitialPaymentDestination(currentDestination, "mobile")
    && hasInitialPaymentDestination(currentDestination, "transfer")) return result;

  // Prefer the purchase-specific destination. The documented no-consumptionId
  // endpoint supplements missing fields with the authenticated company's data.
  try {
    const paymentData = await getMarketplacePaymentData(signal);
    if (!parsePurchaseDestination(paymentData.data)) return result;
    return {
      ...result,
      data: {
        ...result.data,
        pagarA: { ...paymentData.data, ...get(result.data, "pagarA") },
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    return result;
  }
}
function fmt(value: unknown, currency = "USDT") { if (value === undefined || value === null || value === "") return "—"; const n = Number(value); return Number.isFinite(n) ? `${currency} ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}` : `${currency} ${String(value)}`; }
function estimatedDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "Fecha estimada";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-VE", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date);
}
function EstimatedPaymentTimeline({ items }: Readonly<{ items: AnyRecord[] }>) {
  if (!items.length) return null;
  return <Box component="section" aria-label="Calendario estimado de cuotas" sx={{ mt: 1.25, p: 1.4, border: "1px solid #D9D9E1", borderRadius: "18px", bgcolor: "#fff" }}>
    <Stack direction="row" sx={{ mb: 1.1, alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
      <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>Calendario estimado</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: "0.72rem" }}>Sujeto a confirmación</Typography>
    </Stack>
    <Stack component="ol" direction="row" spacing={0} sx={{ m: 0, p: 0, listStyle: "none", overflowX: "auto", overscrollBehaviorX: "contain", scrollSnapType: "x mandatory", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D9D9E1", borderRadius: 99 } }}>
      {items.map((item, index) => <Stack component="li" key={`${item.numero ?? index}-${item.vence ?? index}`} direction="row" sx={{ flex: "0 0 auto", alignItems: "center", scrollSnapAlign: "start" }}>
        <Stack sx={{ width: 116, minHeight: 90, px: 1, py: 1, alignItems: "center", justifyContent: "center", gap: 0.35, border: "1px solid #D9D9E1", borderRadius: "14px", bgcolor: "#F7F7FF", textAlign: "center" }}>
          <Typography sx={{ color: blue, fontSize: "0.68rem", fontWeight: 800 }}>CUOTA {String(item.numero ?? index + 1).padStart(2, "0")}</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{estimatedDate(item.vence)}</Typography>
          <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, whiteSpace: "nowrap" }}>{fmt(get(item, "monto").usdt)}</Typography>
        </Stack>
        {index < items.length - 1 && <Box aria-hidden="true" sx={{ width: 18, height: 2, bgcolor: "#B9C5FF" }} />}
      </Stack>)}
    </Stack>
  </Box>;
}
function venezuelaDate() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ""; return `${value("year")}-${value("month")}-${value("day")}`; }
function errorCode(error: unknown) { return error instanceof MarketplaceServiceError ? String(get(error.body, "diagnostic").code ?? get(error.body, "code") ?? "") : ""; }
function formatError(error: unknown) { if (error instanceof Error && error.message === "c2p_otp_not_requested") return "El banco no confirmó la solicitud de OTP. Verifica los datos e inténtalo nuevamente."; if (error instanceof Error && error.message === "purchase_product_mismatch") return "Esta compra no corresponde al producto seleccionado. Vuelve a Mis compras para abrirla desde allí."; if (error instanceof MarketplaceServiceError) { const code = errorCode(error); if (code === "C2P_RECHAZADO") return "El banco rechazó el cobro C2P. No se realizó el pago; revisa los datos o solicita un nuevo OTP."; if (code === "C2P_OTP_FALLIDO") return "El banco no pudo generar el OTP. Puedes volver a solicitarlo."; if (code === "COMPRA_ABIERTA") return "Ya tienes una compra abierta. Estamos recuperando su estado."; if (code === "MONTO_NO_CUADRA") return "El monto del plan cambió. Actualiza el plan antes de continuar."; if (code === "FUERA_DE_HORARIO") return "El pago inicial solo se puede reportar dentro del horario de atención."; if (code === "COMPRA_VENCIDA") return "Esta compra venció. Actualiza su estado para ver las opciones disponibles."; if (code === "REFERENCIA_USADA") return "Esta referencia ya fue reportada. Verifica el estado de la compra antes de volver a intentar."; if (code === "CUPO_NO_DISPONIBLE" || code === "CUPO_INSUFICIENTE") return "El cupo cambió y ya no permite continuar con esta compra."; if (error.status === 403) return "Esta operación no está habilitada en este momento."; if (error.status === 409) return "La operación no puede continuar con el estado actual."; } return "No pudimos completar la operación. Revisa tu conexión e inténtalo nuevamente."; }
function setAttemptedC2p(id: string, attempted: boolean) { try { const key = `marketplace:c2p-attempt:${id}`; if (attempted) localStorage.setItem(key, "1"); else localStorage.removeItem(key); } catch { /* El estado del servidor sigue siendo la fuente de verdad. */ } }
function hasAttemptedC2p(id: string) { try { return localStorage.getItem(`marketplace:c2p-attempt:${id}`) === "1"; } catch { return false; } }

function InitialPaymentInstructions({ destination, amountBs, method }: Readonly<{ destination: NonNullable<ReturnType<typeof parsePurchaseDestination>>; amountBs: string; method: "mobile" | "transfer" }>) {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const rows = createInstructionRows(destination, amountBs, method).filter((row) => row.displayValue.trim() !== "");
  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError(false);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => current === key ? null : current), 1600);
    } catch { setCopied(null); setCopyError(true); }
  };
  return <Box sx={{ p: 1.5, borderRadius: "16px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
    <Typography sx={{ mb: 1, fontWeight: 800 }}>{method === "mobile" ? "Datos para Pago Móvil" : "Datos para transferencia"}</Typography>
    <Typography sx={{ mb: 1, color: "text.secondary", fontSize: "0.86rem", lineHeight: 1.4 }}>Realiza el pago desde tu banco con estos datos. Al terminar, vuelve aquí para reportarlo.</Typography>
    <Stack divider={<Box sx={{ borderBottom: "1px solid #E1E1E8" }} />} sx={{ border: "1px solid #D9D9E1", borderRadius: "14px", overflow: "hidden", bgcolor: surface }}>
      {rows.map((row) => <Stack key={row.key} direction="row" sx={{ minHeight: 58, alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 1.5, py: 0.9 }}>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ color: "text.secondary", fontSize: "0.78rem", lineHeight: 1.2 }}>{row.label}</Typography><Typography sx={{ overflowWrap: "anywhere", fontWeight: row.key === "amount" ? 800 : 500 }}>{row.displayValue}</Typography></Box>
        <IconButton aria-label={`Copiar ${row.label}`} onClick={() => void copy(row.key, row.copyValue)} size="small" sx={{ color: blue, flexShrink: 0 }}>{copied === row.key ? <CheckRounded fontSize="small" /> : <ContentCopyRounded fontSize="small" />}</IconButton>
      </Stack>)}
    </Stack>
    {copyError && <Typography role="status" sx={{ mt: 0.8, color: "error.main", fontSize: "0.82rem" }}>No se pudieron copiar los datos. Puedes seleccionarlos y copiarlos manualmente.</Typography>}
    <Button fullWidth startIcon={copied === "all" ? <CheckRounded /> : <ContentCopyRounded />} onClick={() => void copy("all", createCopyAllText(rows))} sx={{ mt: 1, minHeight: 46, borderRadius: "12px", bgcolor: "#F8F8FA", color: blue, fontWeight: 700, textTransform: "none" }}>{copied === "all" ? "Datos copiados" : "Copiar todos los datos"}</Button>
  </Box>;
}

function FlowHeader({ title, onClose }: { title: string; onClose: () => void }) { return <Stack direction="row" sx={{ minHeight: 48, alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}><IconButton aria-label="Cerrar" onClick={onClose} sx={{ width: 42, height: 42, border: "1.5px solid #171717" }}><CloseRounded /></IconButton><Typography id="purchase-flow-title" component="h2" sx={{ fontWeight: 700 }}>{title}</Typography><Box sx={{ width: 42 }} /></Stack>; }
function Primary({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) { return <Button fullWidth variant="contained" onClick={onClick} disabled={disabled} sx={{ position: "sticky", bottom: 0, zIndex: 1, minHeight: 56, flexShrink: 0, borderRadius: "99px", bgcolor: blue, fontSize: "1rem", fontWeight: 800, "&:hover": { bgcolor: blue } }}>{children}</Button>; }

function SignatureCaptureDialog({ open, onClose, onSave }: Readonly<{ open: boolean; onClose: () => void; onSave: (signature: string) => void }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(bounds.width * scale);
    canvas.height = Math.round(bounds.height * scale);
    const context = canvas.getContext("2d");
    if (context) { context.scale(scale, scale); context.lineWidth = 3; context.lineCap = "round"; context.lineJoin = "round"; context.strokeStyle = blue; }
    setHasInk(false);
  }, [open]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true;
    const context = event.currentTarget.getContext("2d"); const p = point(event);
    context?.beginPath(); context?.moveTo(p.x, p.y); setHasInk(true);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    event.preventDefault(); const p = point(event); const context = event.currentTarget.getContext("2d");
    context?.lineTo(p.x, p.y); context?.stroke();
  };
  const stop = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current; const context = canvas?.getContext("2d");
    if (canvas && context) { const scale = window.devicePixelRatio || 1; context.clearRect(0, 0, canvas.width / scale, canvas.height / scale); }
    setHasInk(false);
  };
  const save = () => { if (canvasRef.current && hasInk) onSave(canvasRef.current.toDataURL("image/png")); };
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="signature-capture-title" slotProps={{ paper: { sx: { m: 2, p: 2.5, borderRadius: "22px" } } }}>
    <Typography id="signature-capture-title" component="h2" sx={{ fontSize: "1.2rem", fontWeight: 800 }}>Firma con tu dedo o mouse</Typography>
    <Typography sx={{ mt: 0.6, color: "text.secondary", fontSize: "0.9rem" }}>Dibuja tu firma en el recuadro. Si no queda como esperas, puedes borrarla y repetir.</Typography>
    <Box component="canvas" ref={canvasRef} aria-label="Área para dibujar la firma" onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop} sx={{ display: "block", mt: 2, width: "100%", height: 210, border: "1px solid #D9D9E1", borderRadius: "16px", bgcolor: "#F4F3FB", touchAction: "none", cursor: "crosshair" }} />
    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
      <Button onClick={clear} disabled={!hasInk}>Borrar</Button>
      <Box sx={{ flex: 1 }} />
      <Button onClick={onClose}>Cancelar</Button>
      <Button variant="contained" onClick={save} disabled={!hasInk} sx={{ bgcolor: blue, fontWeight: 700 }}>Usar firma</Button>
    </Stack>
  </Dialog>;
}

function OffHoursNotice({ isOpen, nextOpening }: Readonly<{ isOpen: boolean | undefined; nextOpening?: unknown }>) {
  const openingDate = typeof nextOpening === "string" ? new Date(nextOpening) : null;
  const openingLabel = openingDate && Number.isFinite(openingDate.getTime())
    ? new Intl.DateTimeFormat("es-VE", { timeZone: "America/Caracas", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(openingDate)
    : null;
  return <Box role="status" sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, p: 1.5, border: "1px solid #B8E4F2", borderRadius: "14px", bgcolor: "#E7F7FC", color: "#174A63" }}>
    <InfoOutlined sx={{ mt: "2px", flexShrink: 0, color: "#168FC1" }} fontSize="small" />
    <Box>
      <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.45, fontWeight: 700 }}>{isOpen === false ? "Fuera del horario de atención" : "Verificando el horario de atención"}</Typography>
      <Typography sx={{ mt: 0.25, fontSize: "0.88rem", lineHeight: 1.45 }}>
        {isOpen === false ? "Puedes iniciar la compra ahora; el pago inicial estará disponible cuando abra el servicio." : "Consulta el estado de la compra en un momento para habilitar el pago inicial."}
      </Typography>
      {openingLabel && <Typography sx={{ mt: 0.6, fontSize: "0.88rem", lineHeight: 1.4, fontWeight: 700 }}>Próxima apertura: {openingLabel}</Typography>}
    </Box>
  </Box>;
}

export function PurchasePlanFlow({ productId, productName, productImageUrl, productSubtitle, initialPurchaseId }: Readonly<{ productId: string; productName: string; productImageUrl?: string; productSubtitle?: string; initialPurchaseId?: string }>) {
  const [open, setOpen] = useState(Boolean(initialPurchaseId));
  const [stage, setStage] = useState<Stage>("plan");
  const [plan, setPlan] = useState<AnyRecord | null>(null);
  const [initialOptions, setInitialOptions] = useState<MarketplaceInitialOption[]>([]);
  const [selectedInitialPercentage, setSelectedInitialPercentage] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [planQuoteError, setPlanQuoteError] = useState<string | null>(null);
  const [planQuoteNotice, setPlanQuoteNotice] = useState<string | null>(null);
  const [automaticInitialApplied, setAutomaticInitialApplied] = useState(false);
  const [marketplaceLimit, setMarketplaceLimit] = useState<AnyRecord | null>(null);
  const [purchase, setPurchase] = useState<AnyRecord | null>(null);
  const [purchaseListChecked, setPurchaseListChecked] = useState(false);
  const [purchaseListUnavailable, setPurchaseListUnavailable] = useState(false);
  const [method, setMethod] = useState<MarketplacePaymentMethod | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState<AnyRecord | null>(null);
  const [sourceBanks, setSourceBanks] = useState<readonly SourceBank[]>([]);
  const [bankListUnavailable, setBankListUnavailable] = useState(false);
  const [acceptContract, setAcceptContract] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signaturePendingConfirmation, setSignaturePendingConfirmation] = useState(false);
  const [bank, setBank] = useState(""); const [phone, setPhone] = useState(""); const [documentId, setDocumentId] = useState(""); const [reference, setReference] = useState(""); const [date, setDate] = useState(venezuelaDate); const [reportedAmountBs, setReportedAmountBs] = useState(""); const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false); const [c2pAttempted, setC2pAttempted] = useState(false);
  const operationLock = useRef(false);
  const planQuoteController = useRef<AbortController | null>(null);
  const planQuoteRequestId = useRef(0);

  useEffect(() => { if (!open) return; const c = new AbortController();
    void Promise.allSettled([getProductPlan(productId, "30", c.signal), getMarketplaceHours(c.signal), getPurchases(c.signal), getSourceBanks(c.signal), getMarketplaceLimit(c.signal)]).then(async ([p, h, all, banks, limit]) => {
      if (c.signal.aborted) return;
      if (p.status === "rejected") { setPlanQuoteError(formatError(p.reason)); }
      else {
        setPlan(p.value.data);
        const rawOptions = get(p.value.data, "opcionesInicial");
        const options = rawOptions === undefined ? [] : parseMarketplaceInitialOptions(rawOptions);
        const quote = parseMarketplaceQuotedInitialOption(get(p.value.data, "plan"));
        if (!options || !quote || !sameInitialPercentage(quote.porcentaje, "30")) {
          setInitialOptions([]);
          setSelectedInitialPercentage("30");
          setPlanQuoteError("No pudimos obtener una cotización válida para la inicial del 30%. Vuelve a intentarlo.");
        } else {
          setInitialOptions(mergeMarketplaceInitialOptions(options, quote));
          setSelectedInitialPercentage("30");
        }
      }
      if (h.status === "fulfilled") setHours(h.value.data);
      if (banks.status === "fulfilled") { setSourceBanks(banks.value); setBankListUnavailable(false); }
      else { setSourceBanks([]); setBankListUnavailable(true); }
      if (limit.status === "fulfilled") setMarketplaceLimit(limit.value.data);
      else setMarketplaceLimit(null);
      if (all.status === "rejected") { setPurchaseListUnavailable(true); setPurchaseListChecked(true); }
      if (initialPurchaseId) {
        const current = await getPurchaseWithPaymentDestination(initialPurchaseId, c.signal);
        if (c.signal.aborted) return;
        if (marketplacePurchaseProductId(current.data) !== productId) throw new Error("purchase_product_mismatch");
        setPurchase(current.data);
        setC2pAttempted(hasAttemptedC2p(initialPurchaseId));
        setStage(current.data.etapa === "PAGAR_INICIAL" ? "payment" : isConfirmedMarketplacePurchaseStage(current.data.etapa) ? "signed" : "status");
        return;
      }
      if (all.status === "rejected") return;
      const list = purchaseItems(all.value.data);
      const opened = findActiveMarketplacePurchaseForProduct(list, productId);
      setPurchaseListChecked(true);
      if (typeof opened?.id === "string" && opened.id) { const current = await getPurchaseWithPaymentDestination(opened.id, c.signal); if (!c.signal.aborted) { setPurchase(current.data); setC2pAttempted(hasAttemptedC2p(opened.id)); } }
      else setPurchase(null);
    }).catch((e: unknown) => { if (!c.signal.aborted) setError(formatError(e)); }).finally(() => { if (!c.signal.aborted) { setBusy(false); setPlanLoading(false); } });
    return () => { c.abort(); planQuoteController.current?.abort(); };
  }, [open, productId, initialPurchaseId]);

  const close = () => { planQuoteController.current?.abort(); setOpen(false); setStage("plan"); setPurchase(null); setMethod(""); setPurchaseListChecked(false); setPurchaseListUnavailable(false); setPlan(null); setInitialOptions([]); setSelectedInitialPercentage(""); setPlanQuoteError(null); setPlanQuoteNotice(null); setSignaturePendingConfirmation(false); setError(null); };
  const requestPlanQuote = async (percentage?: string, automatic = false) => {
    planQuoteController.current?.abort();
    const controller = new AbortController();
    planQuoteController.current = controller;
    const requestId = ++planQuoteRequestId.current;
    setPlanLoading(true); setPlanQuoteError(null); setPlanQuoteNotice(null);
    try {
      const result = await getProductPlan(productId, percentage ?? null, controller.signal);
      if (controller.signal.aborted || requestId !== planQuoteRequestId.current) return;
      const rawOptions = get(result.data, "opcionesInicial");
      let options = rawOptions === undefined ? [] : parseMarketplaceInitialOptions(rawOptions);
      setPlan(result.data);
      if (!options) {
        setInitialOptions([]); setPlanQuoteError("No pudimos interpretar las opciones de inicial del servicio. Vuelve a intentarlo.");
        return;
      }
      const quote = parseMarketplaceQuotedInitialOption(get(result.data, "plan"));
      if (!quote || (percentage && !sameInitialPercentage(quote.porcentaje, percentage))) {
        setInitialOptions([]);
        setPlanQuoteError("El servicio no devolvió una cotización vigente para el porcentaje seleccionado. Reintenta.");
        return;
      }
      options = mergeMarketplaceInitialOptions(options, quote);
      setInitialOptions(options);
      const planPercentage = get(result.data, "plan").inicialPorcentaje;
      const selected = options.find((option) => sameInitialPercentage(option.porcentaje, planPercentage));
      setSelectedInitialPercentage(selected?.porcentaje ?? "");
      setAutomaticInitialApplied(automatic);
      if (!selected) setPlanQuoteError("El servicio no devolvió una inicial disponible para esta cotización.");
      if (percentage && selected && !sameInitialPercentage(planPercentage, percentage)) {
        setPlanQuoteNotice("El backend ajustó la cotización. Revisa los nuevos montos antes de iniciar la compra.");
      }
    } catch (quoteError) {
      if (controller.signal.aborted || requestId !== planQuoteRequestId.current) return;
      setPlan(null); setPlanQuoteError(formatError(quoteError));
    } finally {
      if (!controller.signal.aborted && requestId === planQuoteRequestId.current) setPlanLoading(false);
    }
  };
  const resumePurchase = () => {
    if (!purchase) return;
    setStage(purchase.etapa === "PAGAR_INICIAL" ? "payment" : isConfirmedMarketplacePurchaseStage(purchase.etapa) ? "signed" : "status");
  };
  const withBusy = async (fn: () => Promise<void>) => {
    if (operationLock.current) return;
    operationLock.current = true; setBusy(true); setError(null);
    try { await fn(); }
    catch (e) {
      if (errorCode(e) === "C2P_RECHAZADO" && purchase?.id) {
        setAttemptedC2p(String(purchase.id), false); setC2pAttempted(false); setOtpSent(false); setOtp(""); setError(formatError(e));
      } else {
        setError(c2pAttempted || (purchase?.id && hasAttemptedC2p(String(purchase.id))) ? "No podemos confirmar el resultado del cobro. No lo reintentes; actualiza el estado de compra." : formatError(e));
      }
    }
    finally { operationLock.current = false; setBusy(false); }
  };
  const create = () => withBusy(async () => {
    const p = get(plan, "plan");
    const initial = get(p, "pagoInicial");
    const selectedOption = initialOptions.find((option) => sameInitialPercentage(option.porcentaje, selectedInitialPercentage));
    const quoteMatchesSelection = sameInitialPercentage(p.inicialPorcentaje, selectedInitialPercentage);
    if (planLoading || planQuoteError || !selectedOption || !quoteMatchesSelection || p.valida === false || p.alcanzaCupo === false || plan?.cupoUsable === false) throw new Error("plan_not_current");
    const amount = Number(initial.usdt ?? p.pagoInicialUsdt);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("plan_missing");
    try {
      const result = await createPurchase(productId, amount);
      let id = result.data.id ?? result.data.compraId;
      if (!id) {
        const listed = await getPurchases(); const items = purchaseItems(listed.data);
        id = items.find((item: AnyRecord) => item?.producto?.id === productId && item?.etapa === "PAGAR_INICIAL")?.id;
      }
      if (!id) throw new Error("purchase_created_without_id");
      const current = await getPurchaseWithPaymentDestination(String(id)); setPurchase(current.data); setStage(current.data.etapa === "PAGAR_INICIAL" ? "payment" : isConfirmedMarketplacePurchaseStage(current.data.etapa) ? "signed" : "status");
    }
    catch (e) {
      const info = e instanceof MarketplaceServiceError ? get(e.body, "diagnostic") : {};
      if (info.code === "MONTO_NO_CUADRA" || info.code === "CUPO_INSUFICIENTE" || info.code === "CUPO_NO_DISPONIBLE") {
        await requestPlanQuote(selectedInitialPercentage);
        setPlanQuoteNotice("El precio o el cupo cambiaron. Verifica la cotización actualizada antes de continuar.");
        return;
      }
      if (info.code !== "COMPRA_ABIERTA") throw e;
      const listed = await getPurchases(); const items = purchaseItems(listed.data);
      const existing = findActiveMarketplacePurchaseForProduct(items, productId);
      if (!existing) throw e;
      if (typeof existing.id !== "string" || !existing.id) throw e;
      const current = await getPurchaseWithPaymentDestination(existing.id); setPurchase(current.data); setC2pAttempted(hasAttemptedC2p(existing.id));
    }
  });
  const refreshPurchase = async () => { if (purchase?.id) { const updated = await getPurchaseWithPaymentDestination(purchase.id); setPurchase(updated.data); setSignaturePendingConfirmation(false); setStage(updated.data.etapa === "PAGAR_INICIAL" ? "payment" : isConfirmedMarketplacePurchaseStage(updated.data.etapa) ? "signed" : "status"); if (updated.data.etapa !== "PAGAR_INICIAL") { setAttemptedC2p(purchase.id, false); setC2pAttempted(false); } else if (hasAttemptedC2p(purchase.id)) setC2pAttempted(true); } };
  const downloadContract = () => withBusy(async () => {
    if (!purchase?.id) throw new Error("purchase_missing");
    const { data } = await getPurchaseContract(purchase.id);
    if (!data.base64 || !data.contentType) throw new Error("contract_invalid");
    const bytes = Uint8Array.from(atob(data.base64), (character) => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: data.contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url;
    link.download = /^[\w.-]+$/.test(data.nombreArchivo ?? "") ? data.nombreArchivo : "contrato-compra.docx";
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const submitReport = () => withBusy(async () => {
    if (!purchase?.id) return;
    const amountBs = reportedAmountBs;
    const destination = parsePurchaseDestination(purchase.pagarA);
    if (!isValidInitialPayment({ method: activeMethod, bank, phone, documentId, reference, date, amountBs, destination, sourceBanks, paymentEnabled })) throw new Error("initial_payment_invalid");
    await reportInitialPayment(purchase.id, { metodo: activeMethod === "mobile" ? "PAGO_MOVIL" : "TRANSFERENCIA", bancoOrigen: bank, telefonoOrigen: phone.replace(/\D/g, ""), ...(documentId.trim() ? { documentoPagador: documentId.trim() } : {}), referencia: reference.trim(), fechaPago: date, montoBs: Number(reportedAmountBs) });
    await refreshPurchase();
  });
  const sendOtp = () => withBusy(async () => {
    if (!purchase?.id) throw new Error("purchase_missing");
    const response = await requestC2pOtp(purchase.id, { bancoOrigen: bank, telefonoOrigen: phone.replace(/\D/g, ""), ...(documentId.trim() ? { documentoPagador: documentId.trim() } : {}) });
    const result = parseC2pOtpResponse(response.data);
    if (!result) throw new Error("c2p_otp_not_requested");
    setOtp(result.otp);
    setOtpSent(true);
  });
  const charge = () => withBusy(async () => {
    if (!purchase?.id || c2pAttempted || !isValidC2pOtp(otp)) throw new Error("c2p_result_must_be_checked");
    setC2pAttempted(true); setAttemptedC2p(purchase.id, true);
    await payC2p(purchase.id, { bancoOrigen: bank, telefonoOrigen: phone.replace(/\D/g, ""), ...(documentId.trim() ? { documentoPagador: documentId.trim() } : {}), otp });
    // /c2p returns a purchase (approved or under review), never an OTP result.
    // Re-read the canonical state because 202 can mean the bank result is uncertain.
    await refreshPurchase();
  });
  const confirmSignature = () => withBusy(async () => {
    if (!purchase?.id || !acceptContract || !acceptTerms || !signatureDataUrl) throw new Error("signature_incomplete");
    // The contract only accepts firmado:true. The typed name and acknowledgements
    // are interaction/UI evidence; Core does not persist them as a signature artifact.
    await signPurchase(purchase.id);
    setSignaturePendingConfirmation(true);
    setStage("status");
    try {
      const updated = await getPurchase(purchase.id);
      setPurchase(updated.data);
      setSignaturePendingConfirmation(false);
      setStage(isConfirmedMarketplacePurchaseStage(updated.data.etapa) ? "signed" : "status");
    } catch {
      setError("La firma se envió, pero no pudimos confirmar el estado de la compra. Actualízalo antes de volver a firmar.");
    }
  });

  const p = get(plan, "plan"); const initial = get(p, "pagoInicial"); const initialBs = get(purchase, "pagoInicial").bs ?? initial.bs;
  const selectedOption = initialOptions.find((option) => sameInitialPercentage(option.porcentaje, selectedInitialPercentage));
  const quoteIsCurrent = Boolean(selectedOption && sameInitialPercentage(p.inicialPorcentaje, selectedInitialPercentage));
  const planValid = p.valida !== false && p.alcanzaCupo !== false && plan?.alcanzaCupo !== false && plan?.cupoUsable !== false;
  const insufficientLimit = p.motivo === "CUPO_INSUFICIENTE" || p.alcanzaCupo === false || plan?.alcanzaCupo === false;
  const limitState = String(marketplaceLimit?.estado ?? "").toUpperCase();
  const limitBlocked = limitState === "BLOQUEADA" || limitState === "SUSPENDIDA";
  const initialSelectorDisabled = planLoading || busy || Boolean(purchase) || !purchaseListChecked || !initialOptions.length || limitBlocked;
  const canUseAutomaticInitial = insufficientLimit && !limitBlocked && limitState === "ABIERTA" && !purchase && !purchaseListUnavailable;
  const fullyPaid = sameInitialPercentage(p.inicialPorcentaje, "100") || Number(get(p, "aFinanciar").usdt) === 0;
  const availableUsdt = get(plan, "disponible").usdt ?? marketplaceLimit?.disponible?.usdt;
  const totalInitial = get(p, "pagoInicial");
  const horarioOpen = hours?.abierto ?? hours?.estaAbierto;
  const paymentEnabled = horarioOpen === true;
  const phoneValid = /^04(12|14|16|22|24|26)\d{7}$/.test(phone.replace(/\D/g, ""));
  const documentValid = !documentId || /^[VEPJGCvepjgc]-?[0-9]{1,9}$/.test(documentId);
  const bankValid = sourceBanks.some((sourceBank) => sourceBank.code === bank);
  const purchaseDestination = purchase ? parsePurchaseDestination(purchase.pagarA) : null;
  const availableMethods = getMarketplacePaymentMethods();
  const activeMethod: MarketplacePaymentMethod = method && availableMethods.includes(method) ? method : availableMethods[0] ?? "mobile";
  return <>
    <Button fullWidth variant="contained" onClick={() => { setBusy(true); setPlanLoading(true); setPlanQuoteError(null); setPlanQuoteNotice(null); setAutomaticInitialApplied(false); setInitialOptions([]); setSelectedInitialPercentage(""); setMarketplaceLimit(null); setError(null); setSignaturePendingConfirmation(false); setPurchase(null); setMethod(""); setPurchaseListChecked(false); setPurchaseListUnavailable(false); setPlan(null); setStage("plan"); setOpen(true); }} sx={{ position: "fixed", zIndex: (theme) => theme.zIndex.appBar, left: "50%", bottom: "calc(14px + env(safe-area-inset-bottom))", transform: "translateX(-50%)", width: "min(calc(100% - 48px), 440px)", minHeight: 58, borderRadius: "99px", bgcolor: blue, fontWeight: 800, "&:hover": { bgcolor: blue } }}>Ir a plan de compra</Button>
    <Dialog open={open} onClose={close} aria-labelledby="purchase-flow-title" fullWidth maxWidth="sm" scroll="paper" slots={{ transition: SlideUp }} slotProps={{ backdrop: { sx: { bgcolor: "rgba(0,0,0,.76)" } }, container: { sx: { alignItems: "flex-end", pb: "max(8px, env(safe-area-inset-bottom))" } } }} sx={{ "& .MuiDialog-paper": { width: "calc(100% - 24px)", maxWidth: 548, height: stage === "plan" ? "min(62dvh, 650px)" : "min(92dvh, 850px)", maxHeight: "calc(100dvh - 28px - env(safe-area-inset-top))", m: 0, overflow: "hidden", borderRadius: "24px", bgcolor: surface, color: "#171717" } }}>
      <Stack sx={{ height: "100%", minHeight: 0, overflowY: "auto", px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2.5, gap: 1.4 }}>
        <FlowHeader title={stage === "plan" ? "Plan de cuotas" : stage === "review" ? "Revisar compra" : stage === "payment" ? "Plan de compra" : stage === "pay" || stage === "report" || stage === "c2p" ? "Realizar pago" : stage === "contract" ? "Firma digital" : stage === "signed" ? "Compra confirmada" : "Estado de compra"} onClose={close} />
        {error && <Alert severity="error" action={!signaturePendingConfirmation ? <Button color="inherit" size="small" onClick={() => void withBusy(refreshPurchase)}>Actualizar</Button> : undefined}>{error}</Alert>}
        {busy && <Typography role="status">Consultando información…</Typography>}
        {stage === "plan" && planQuoteError && <Alert severity="error" action={<Button color="inherit" size="small" disabled={planLoading} onClick={() => void requestPlanQuote(selectedInitialPercentage || "30")}>{planLoading ? "Actualizando…" : "Reintentar cotización"}</Button>}>{planQuoteError}</Alert>}
        {stage === "plan" && planQuoteNotice && <Alert severity="info">{planQuoteNotice}</Alert>}
        {stage === "plan" && plan && <>
          {(!p || plan.plan === null) ? <Alert severity="info">Este producto no tiene un plan de financiamiento disponible.</Alert> : <>
            <Typography component="h3" sx={{ mt: 1.8, fontSize: "1.45rem", fontWeight: 800 }}>Elige tu inicial</Typography>
            <Stack direction="row" sx={{ width: "100%", boxSizing: "border-box", minHeight: 82, alignItems: "center", gap: 1.4, px: 1.5, py: 1.2, border: "1px solid #D9D9E1", borderRadius: "22px", bgcolor: "white" }}>
              <Box sx={{ width: 52, height: 52, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#F0EFFF", color: blue }}><SavingsRounded sx={{ fontSize: 28 }} /></Box>
              <Typography sx={{ flex: 1, minWidth: 0, fontSize: "1.05rem", fontWeight: 700 }}>Total a pagar</Typography>
              <Typography sx={{ fontSize: "1.5rem", lineHeight: 1, fontWeight: 800 }}>{get(plan, "precio").usdt != null ? new Intl.NumberFormat("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(get(plan, "precio").usdt)) : "—"} <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 700 }}>USDT</Box></Typography>
            </Stack>
            {availableUsdt != null && <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>Disponible vigente: <Box component="span" sx={{ color: "#171717", fontWeight: 700 }}>{fmt(availableUsdt)}</Box></Typography>}
            <Box sx={{ width: "100%", minWidth: 0, mt: 2.1 }}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>% de inicial</Typography>
              {initialOptions.length > 0 && <>
                <Stack direction="row" sx={{ mt: 1.3, justifyContent: "space-between", gap: 1 }}>
                  {[30, 60, 100].map((percentage) => {
                    const option = initialOptions.find((candidate) => sameInitialPercentage(candidate.porcentaje, String(percentage)));
                    const chosen = sameInitialPercentage(selectedInitialPercentage, String(percentage));
                    return <Box key={percentage} sx={{ flex: 1, textAlign: percentage === 30 ? "left" : percentage === 100 ? "right" : "center", color: chosen ? "#171717" : "#777" }}>
                      <Typography sx={{ fontSize: "1rem", lineHeight: 1.2, fontWeight: chosen ? 800 : 600 }}>{percentage}%</Typography>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: chosen ? 700 : 500 }}>{option ? fmt(option.inicial.usdt) : ""}</Typography>
                    </Box>;
                  })}
                </Stack>
                <Slider aria-label="Porcentaje de inicial" aria-valuetext={`${selectedInitialPercentage}%`} min={30} max={100} step={10} marks={INITIAL_PERCENTAGES.map((value) => ({ value, "aria-label": `${value}%` }))} value={Number(selectedInitialPercentage || 30)} disabled={initialSelectorDisabled} onChange={(_, value) => { setSelectedInitialPercentage(String(value)); setAutomaticInitialApplied(false); setPlanQuoteError(null); }} onChangeCommitted={(_, value) => void requestPlanQuote(String(value))} sx={{ mt: 1.4, mx: 1.5, width: "calc(100% - 24px)", px: 0, color: "#171717", "& .MuiSlider-rail": { height: 8, bgcolor: "#D7D7D7", opacity: 1 }, "& .MuiSlider-track": { height: 8, border: 0 }, "& .MuiSlider-thumb": { width: 24, height: 24, boxShadow: "none" }, "& .MuiSlider-mark": { width: 5, height: 5, borderRadius: "50%", bgcolor: "#fff", opacity: 1 } }} />
              </>}
              <Typography sx={{ mt: 0.35, color: "text.secondary", fontSize: "0.9rem" }}>Inicial seleccionada: <Box component="span" sx={{ color: "#171717", fontWeight: 800 }}>{selectedInitialPercentage || 30}%</Box>. Desliza en pasos de 10%.</Typography>
            </Box>
            <Stack direction="row" sx={{ mt: 3, justifyContent: "space-between", gap: 1.5 }}>
              <Box><Typography sx={{ fontWeight: 700 }}>Hoy pagas</Typography><Typography sx={{ mt: 0.35, color: "text.secondary", fontWeight: 600 }}>{quoteIsCurrent ? `Luego ${fullyPaid ? "sin cuotas" : `${p.cuotas ?? "—"} cuotas`}${!fullyPaid && p.frecuencia ? ` · ${p.frecuencia}` : ""}` : "Actualizando el plan…"}</Typography></Box>
              <Box sx={{ textAlign: "right" }}><Typography sx={{ fontWeight: 800 }}>{quoteIsCurrent ? fmt(get(p, "pagoInicial").usdt) : "—"}</Typography>{quoteIsCurrent && !fullyPaid && <Typography sx={{ mt: 0.35, color: "text.secondary", fontWeight: 700 }}>{fmt(get(p, "montoCuota").usdt)}</Typography>}</Box>
            </Stack>
            {quoteIsCurrent && (get(p, "servicioLegal").usdt != null || get(p, "servicioAdministrativo").usdt != null) && <details style={{ marginTop: 16 }}><summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Ver desglose del pago inicial</summary>{get(p, "servicioLegal").usdt != null && <Typography sx={{ mt: 1, fontSize: "0.88rem" }}>Servicio legal: {fmt(get(p, "servicioLegal").usdt)}</Typography>}{get(p, "servicioAdministrativo").usdt != null && <Typography sx={{ mt: 0.5, fontSize: "0.88rem" }}>Servicio administrativo: {fmt(get(p, "servicioAdministrativo").usdt)}</Typography>}</details>}
            {quoteIsCurrent && get(p, "aFinanciar").usdt != null && <Typography sx={{ mt: 1.2, fontSize: "0.86rem", color: "text.secondary" }}>Monto financiado: {fmt(get(p, "aFinanciar").usdt)}</Typography>}
            {quoteIsCurrent && !planLoading && !planValid && <Alert severity="warning">{getInitialPlanReason(p.motivo) ?? (limitBlocked ? "Tu cupo está bloqueado o suspendido. Contacta a soporte para conocer cómo continuar." : "El plan no está disponible para esta inicial.")}</Alert>}
            {planLoading && <Typography role="status" aria-live="polite" sx={{ color: "text.secondary", fontSize: "0.9rem" }}>Actualizando la cotización…</Typography>}
            {quoteIsCurrent && totalInitial.usdt != null && <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>El pago de hoy incluye los servicios aplicables: {fmt(totalInitial.usdt)}</Typography>}
            {quoteIsCurrent && fullyPaid && <Alert severity="info" sx={{ mt: 1 }}>Con esta opción no se genera financiamiento ni cuotas.</Alert>}
            {quoteIsCurrent && !fullyPaid && Array.isArray(p.calendario) && <EstimatedPaymentTimeline items={p.calendario} />}
            {horarioOpen === false && <OffHoursNotice isOpen={false} nextOpening={hours?.proximaApertura} />}
          </>}
          {automaticInitialApplied && <Alert severity="success">Se aplicó la inicial automática calculada por el backend. Revisa el monto y el porcentaje antes de iniciar la compra.</Alert>}
          {canUseAutomaticInitial && <Button variant="outlined" disabled={planLoading || busy} onClick={() => void requestPlanQuote(undefined, true)} sx={{ minHeight: 48, borderRadius: "13px", borderColor: blue, color: blue, fontWeight: 800 }}>Usar inicial automática</Button>}
          {purchaseListUnavailable && <Alert severity="warning">No pudimos consultar tus compras activas. Cierra este plan y vuelve a abrirlo para intentarlo nuevamente.</Alert>}
          {purchase ? <Box sx={{ p: 1.5, border: "1px solid #C7D3FF", borderRadius: "16px", bgcolor: "#F7F8FF" }}>
            <Typography sx={{ fontWeight: 800 }}>Tienes una compra pendiente</Typography>
            <Typography sx={{ mt: 0.35, mb: 1.2, color: "text.secondary", fontSize: "0.9rem" }}>Revisa este plan y elige cuándo quieres retomar tu compra.</Typography>
            <Button fullWidth variant="contained" disabled={busy} onClick={resumePurchase} sx={{ minHeight: 50, borderRadius: "13px", bgcolor: blue, fontWeight: 800, "&:hover": { bgcolor: blue } }}>Continuar compra</Button>
          </Box> : p && <Primary disabled={busy || planLoading || Boolean(planQuoteError) || !quoteIsCurrent || !planValid || !purchaseListChecked || purchaseListUnavailable || !initialOptions.length || limitBlocked} onClick={() => setStage("review")}>Continuar</Primary>}
        </>}
        {stage === "review" && plan && <>
          <Typography component="h3" sx={{ fontSize: "1.35rem", fontWeight: 800 }}>Revisa tu compra</Typography>
          <Box sx={{ p: 1.4, border: "1px solid #D9D9E1", borderRadius: "20px", bgcolor: "white" }}>
            <Typography sx={{ mb: 1, fontWeight: 800 }}>Condiciones y plan de cuotas</Typography>
            <Stack divider={<Box sx={{ borderBottom: "1px solid #D9D9E1" }} />} sx={{ border: "1px solid #D9D9E1", borderRadius: "18px", overflow: "hidden", bgcolor: "white" }}>
              {[["Inicial", get(p, "inicial").usdt], ["Cuotas", !fullyPaid && p.cuotas != null ? `${p.cuotas} de ${fmt(get(p, "montoCuota").usdt)}` : null], ["Servicio legal", get(p, "servicioLegal").usdt], ["Gastos administrativos", get(p, "servicioAdministrativo").usdt], ["Total", get(plan, "precio").usdt]].filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => <Stack key={String(label)} direction="row" sx={{ minHeight: 50, px: 1.7, alignItems: "center", justifyContent: "space-between", gap: 1.2 }}><Typography sx={{ color: label === "Total" ? "#171717" : "#777", fontWeight: label === "Total" ? 700 : 500 }}>{label}</Typography><Typography sx={{ textAlign: "right", fontSize: label === "Total" ? "1.2rem" : "1rem", fontWeight: label === "Total" ? 800 : 500 }}>{label === "Cuotas" ? value : fmt(value)}</Typography></Stack>)}
            </Stack>
          </Box>
          <Box sx={{ flex: 1, minHeight: 80 }} />
          <Primary disabled={busy || planLoading || !quoteIsCurrent || !planValid} onClick={() => void create()}>Pagar</Primary>
          <Button disabled={busy} onClick={() => setStage("plan")}>Volver</Button>
        </>}
        {stage === "payment" && purchase && <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, p: 1.2, borderRadius: "20px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
            <Box sx={{ width: 76, height: 76, flexShrink: 0, overflow: "hidden", borderRadius: "14px", bgcolor: "#F2F2F7" }}><MarketplaceProductImage url={productImageUrl} productId={productId} alt="" /></Box>
            <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: "1.08rem", lineHeight: 1.25, fontWeight: 800 }}>{get(purchase, "producto").nombre ?? productName}</Typography>{productSubtitle && <Typography sx={{ mt: 0.3, fontSize: "0.92rem", lineHeight: 1.3 }}>{productSubtitle}</Typography>}<Typography sx={{ mt: 0.25, fontSize: "0.88rem", color: "text.secondary" }}>Compra #{String(purchase.id).slice(0, 8)}</Typography></Box>
          </Box>
          <Typography sx={{ mt: 1, fontSize: "0.95rem" }}>Selecciona una forma de pagar la inicial</Typography>
          <Box sx={{ p: 1.5, borderRadius: "20px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
            <TextField select fullWidth label="Tipo de pago" value={method} onChange={(event) => setMethod(event.target.value as MarketplacePaymentMethod)}>
              <MenuItem value="" disabled>Seleccionar tipo de pago</MenuItem>
              <MenuItem value="mobile">Pago móvil</MenuItem><MenuItem value="transfer">Transferencia</MenuItem><MenuItem value="c2p">C2P</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ flex: 1, minHeight: 80 }} />
          <Primary disabled={!method || busy} onClick={() => { if (method) setStage("pay"); }}>Continuar</Primary>
          <Button disabled={busy} onClick={() => setStage("status")}>Volver al estado de compra</Button>
        </>}
        {(stage === "pay" || stage === "report") && purchase && <>
          <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.25rem" }}>Pagar inicial</Typography>
          {purchase.motivoRechazo && <Alert severity="error">Pago rechazado: {purchase.motivoRechazo}. Revisa los datos antes de volver a reportarlo.</Alert>}
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: blue, color: "white" }}><Typography>Monto congelado</Typography><Typography sx={{ fontSize: "1.5rem", fontWeight: 700 }}>{fmt(initialBs, "Bs.")}</Typography></Box>
          {stage === "pay" && <>
          <Button onClick={() => setStage("payment")} sx={{ alignSelf: "flex-start" }}>Cambiar método</Button>
          {!paymentEnabled && <OffHoursNotice isOpen={horarioOpen} nextOpening={hours?.proximaApertura} />}
          {activeMethod !== "c2p" && hasInitialPaymentDestination(purchaseDestination, activeMethod) && <InitialPaymentInstructions destination={purchaseDestination!} amountBs={String(initialBs ?? "0")} method={activeMethod} />}
          {activeMethod !== "c2p" && !hasInitialPaymentDestination(purchaseDestination, activeMethod) && <Alert severity="warning">No recibimos todos los datos de destino para este método. Verifica la configuración bancaria de la empresa o inténtalo más tarde.</Alert>}
          {activeMethod !== "c2p" && <Primary disabled={busy || !paymentEnabled || !hasInitialPaymentDestination(purchaseDestination, activeMethod)} onClick={() => { setReportedAmountBs(String(initialBs ?? "")); setStage("report"); }}>Listo - Ya pagué</Primary>}
          {bankListUnavailable && activeMethod === "c2p" && <Alert severity="warning">No se pudo cargar el directorio de bancos. Cierra y vuelve a abrir este flujo para intentarlo nuevamente.</Alert>}
          {activeMethod === "c2p" && <>
            <Alert severity="info">C2P realiza el cobro desde Impúlsate. Solicita el OTP al banco y confirma el pago una sola vez.</Alert>
            <TextField select label="Banco del pagador" value={bank} onChange={(e) => setBank(e.target.value)} error={!bankValid && Boolean(bank)} helperText={!bankValid && Boolean(bank) ? "Selecciona un banco del directorio." : ""}>
              <MenuItem value="" disabled>Selecciona tu banco</MenuItem>
              {sourceBanks.map((sourceBank) => <MenuItem key={sourceBank.code} value={sourceBank.code}>{sourceBank.name}</MenuItem>)}
            </TextField>
            <TextField label="Teléfono afiliado a C2P" value={phone} onChange={(e) => setPhone(e.target.value)} error={Boolean(phone) && !phoneValid} helperText={Boolean(phone) && !phoneValid ? "Usa un móvil venezolano válido, por ejemplo 04141122556." : ""} />
            <TextField label="Documento del pagador (opcional)" value={documentId} onChange={(e) => setDocumentId(e.target.value)} error={!documentValid} helperText={!documentValid ? "Formato esperado: V12345678." : "Si paga el titular de la cuenta, puedes dejarlo vacío."} />
            {!otpSent ? <Primary disabled={busy || !bankValid || !phoneValid || !documentValid || !paymentEnabled} onClick={() => void sendOtp()}>Solicitar OTP</Primary> : <>
              <TextField label="Código OTP (4 a 8 dígitos)" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} error={Boolean(otp) && !isValidC2pOtp(otp)} helperText={Boolean(otp) && !isValidC2pOtp(otp) ? "Ingresa entre 4 y 8 dígitos." : "Ingresa la clave enviada por tu banco o proporcionada por el servicio."} slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }} />
              <Alert severity="warning">Al confirmar se intentará cobrar el pago inicial. Si el resultado es incierto, no vuelvas a enviar el cobro; actualiza el estado de compra.</Alert>
              {c2pAttempted && <><Alert severity="info">Este intento no se repetirá desde la pantalla. Actualiza el estado para comprobar el resultado.</Alert><Button disabled={busy} onClick={() => void withBusy(refreshPurchase)}>Actualizar estado de compra</Button></>}
              <Primary disabled={busy || !isValidC2pOtp(otp) || c2pAttempted || !paymentEnabled} onClick={() => void charge()}>Confirmar cobro</Primary>
            </>}
          </>}
          </>}
          {stage === "report" && activeMethod !== "c2p" && <>
            <Button onClick={() => setStage("pay")} sx={{ alignSelf: "flex-start" }}>Volver a instrucciones</Button>
            {!paymentEnabled && <OffHoursNotice isOpen={horarioOpen} nextOpening={hours?.proximaApertura} />}
            <Typography sx={{ fontWeight: 700 }}>Reporta el pago realizado</Typography>
            <TextField label="Monto realmente pagado (Bs.)" type="number" value={reportedAmountBs} onChange={(e) => setReportedAmountBs(e.target.value)} error={Boolean(reportedAmountBs) && (!/^\d+(?:\.\d{1,2})?$/.test(reportedAmountBs) || Number(reportedAmountBs) <= 0)} helperText={activeMethod === "mobile" ? "Si difiere del monto de la inicial, el reporte quedará en revisión." : "La transferencia será revisada por el equipo. Ingresa el monto que enviaste."} slotProps={{ htmlInput: { min: 0.01, step: 0.01, inputMode: "decimal" } }} />
            <TextField select label="Banco desde el que pagaste" value={bank} onChange={(e) => setBank(e.target.value)} error={Boolean(bank) && !bankValid} helperText={Boolean(bank) && !bankValid ? "Selecciona un banco del directorio." : ""}><MenuItem value="" disabled>Selecciona el banco de origen</MenuItem>{sourceBanks.map((sourceBank) => <MenuItem key={sourceBank.code} value={sourceBank.code}>{sourceBank.name}</MenuItem>)}</TextField>
            <TextField label="Teléfono de origen" placeholder="04141122556" value={phone} onChange={(e) => setPhone(e.target.value)} error={Boolean(phone) && !phoneValid} helperText={Boolean(phone) && !phoneValid ? "Usa un móvil venezolano válido." : ""} />
            <TextField label="Documento del pagador (opcional)" value={documentId} onChange={(e) => setDocumentId(e.target.value)} error={!documentValid} helperText={!documentValid ? "Formato esperado: V12345678." : ""} />
            <TextField label="Referencia (4 a 20 dígitos)" value={reference} onChange={(e) => setReference(e.target.value.replace(/\D/g, "").slice(0, 20))} error={Boolean(reference) && !/^\d{4,20}$/.test(reference)} helperText={Boolean(reference) && !/^\d{4,20}$/.test(reference) ? "Ingresa de 4 a 20 dígitos." : ""} />
            <TextField label="Fecha de pago" type="date" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Alert severity="info">El contrato de pago inicial no recibe comprobante. El envío quedará sujeto al estado que confirme el backend.</Alert>
            {bankListUnavailable && <Alert severity="warning">No se pudo cargar el directorio de bancos. Cierra y vuelve a abrir este flujo para intentarlo nuevamente.</Alert>}
            <Primary disabled={busy || !isValidInitialPayment({ method: activeMethod, bank, phone, documentId, reference, date, amountBs: reportedAmountBs, destination: purchaseDestination, sourceBanks, paymentEnabled })} onClick={() => void submitReport()}>Enviar reporte de inicial</Primary>
          </>}
        </>}
        {stage === "status" && purchase && signaturePendingConfirmation && <>
          <Box sx={{ p: 2.5, borderRadius: "20px", bgcolor: "white", textAlign: "center", border: "1px solid #D9D9E1" }}>
            <AccountBalanceWalletRounded sx={{ color: blue, fontSize: 52 }} />
            <Typography component="h3" sx={{ mt: 0.5, fontSize: "1.25rem", fontWeight: 800 }}>Verificando la compra</Typography>
            <Typography sx={{ mt: 0.5 }}>La firma se envió. Estamos consultando el estado confirmado por el servicio.</Typography>
          </Box>
          <Alert severity="info">No vuelvas a firmar todavía. Actualiza el estado para verificar el resultado.</Alert>
          <Primary disabled={busy} onClick={() => void withBusy(refreshPurchase)}>Actualizar estado</Primary>
        </>}
        {stage === "status" && purchase && !signaturePendingConfirmation && <>
          <Box sx={{ p: 2.5, borderRadius: "20px", bgcolor: "white", textAlign: "center", border: "1px solid #D9D9E1" }}>
            {purchase.etapa === "ESPERANDO_FIRMAS" ? <CheckCircleRounded sx={{ color: "#06D986", fontSize: 62 }} /> : <AccountBalanceWalletRounded sx={{ color: blue, fontSize: 42 }} />}
            <Typography component="h3" sx={{ mt: 0.5, fontSize: "1.25rem", fontWeight: 800 }}>{purchase.etapa === "VALIDANDO_PAGO" ? String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "TRANSFERENCIA" ? "Pago pendiente de aprobación" : String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "PAGO_MOVIL" ? "Pago móvil en revisión" : String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "C2P" ? "Verificando pago C2P" : "Verificando pago" : purchase.etapa === "PAGAR_CUOTAS" ? "Compra confirmada" : purchase.etapa === "VENCIDA" ? "Compra vencida" : purchase.etapa === "ESPERANDO_FIRMAS" ? "¡Pago inicial aprobado!" : purchase.motivoRechazo ? "Pago rechazado" : purchase.estado ?? "Estado de compra"}</Typography>
            <Typography sx={{ mt: 0.5 }}>{purchase.motivoRechazo ?? (purchase.etapa === "ESPERANDO_FIRMAS" ? "Tu pago fue validado correctamente. Revisa y firma el contrato para activar el financiamiento." : purchase.etapa === "VALIDANDO_PAGO" && String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "TRANSFERENCIA" ? "La transferencia debe ser revisada y aprobada por la empresa." : purchase.etapa === "VALIDANDO_PAGO" && String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "PAGO_MOVIL" ? "El pago móvil no pudo confirmarse automáticamente y será revisado. Actualiza para consultar el resultado." : purchase.etapa === "VALIDANDO_PAGO" ? "Estamos confirmando el resultado con el banco. Actualiza el estado para consultar el resultado; no repitas un cobro C2P." : `Etapa: ${purchase.etapa ?? "No disponible"}`)}</Typography>
          </Box>
          {purchase.etapa === "ESPERANDO_FIRMAS" && !signaturePendingConfirmation && <>
            <Box sx={{ p: 1.6, borderRadius: "16px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
              <Typography sx={{ fontWeight: 800 }}>{get(purchase, "producto").nombre ?? productName}</Typography>
              <Stack divider={<Box sx={{ borderBottom: "1px solid #E2E2E8" }} />} sx={{ mt: 1 }}>
                {[["Precio", get(purchase, "precio")], ["Pago inicial", get(purchase, "pagoInicial").usdt], ["Monto financiado", get(purchase, "aFinanciar")], ["Cuotas", purchase.cuotas]].filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => <Stack key={String(label)} direction="row" sx={{ justifyContent: "space-between", gap: 1, py: 0.9 }}><Typography color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 700 }}>{label === "Cuotas" ? value : fmt(value)}</Typography></Stack>)}
              </Stack>
            </Box>
            <Primary disabled={busy} onClick={() => { setAcceptContract(false); setAcceptTerms(false); setSignatureDataUrl(""); setStage("contract"); }}>Revisar y firmar contrato</Primary>
            <Button disabled={busy} onClick={() => void downloadContract()}>Descargar contrato</Button>
          </>}
          {purchase.etapa === "PAGAR_CUOTAS" && purchase.consumoId && <Button component={Link} href={`/marketplace/cuotas/${encodeURIComponent(purchase.consumoId)}`} variant="contained" sx={{ bgcolor: blue }}>Ir a mis cuotas</Button>}
          {(purchase.etapa === "PAGAR_CUOTAS" || purchase.etapa === "PAGADA") && <Button component={Link} href={`/marketplace/compras/${encodeURIComponent(purchase.id)}`} variant="outlined" sx={{ borderColor: blue, color: blue, fontWeight: 700 }}>Ver detalle de la compra</Button>}
          <Button onClick={() => void withBusy(refreshPurchase)}>Actualizar estado</Button>
        </>}
        {stage === "contract" && purchase && <>
          <Typography component="h3" sx={{ fontSize: "1.2rem", fontWeight: 800 }}>Revisa y firma tu contrato</Typography>
          <Alert severity="info">Al confirmar la firma se activa el financiamiento y comienza el calendario de cuotas. Puedes descargar el contrato para revisarlo antes de continuar.</Alert>
          <Box sx={{ p: 1.6, borderRadius: "18px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
            <Typography sx={{ mb: 1, fontWeight: 800 }}>Condiciones de compra</Typography>
            <Stack divider={<Box sx={{ borderBottom: "1px solid #E2E2E8" }} />}>
              {[["Producto", get(purchase, "producto").nombre ?? productName], ["Precio", purchase.precio], ["Pago inicial", get(purchase, "pagoInicial").usdt], ["Monto financiado", purchase.aFinanciar], ["Número de cuotas", purchase.cuotas], ["Servicio legal", purchase.servicioLegal], ["Servicio administrativo", purchase.servicioAdministrativo]].filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => <Stack key={String(label)} direction="row" sx={{ justifyContent: "space-between", gap: 1, py: 0.85 }}><Typography color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 700, textAlign: "right" }}>{label === "Número de cuotas" ? value : label === "Producto" ? value : fmt(value)}</Typography></Stack>)}
            </Stack>
            <Button fullWidth disabled={busy} onClick={() => void downloadContract()} sx={{ mt: 1 }}>Descargar contrato para revisar</Button>
          </Box>
          <Box sx={{ p: 1.2, borderRadius: "16px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
            <FormControlLabel control={<Checkbox checked={acceptContract} onChange={(event) => setAcceptContract(event.target.checked)} sx={{ color: blue, "&.Mui-checked": { color: blue } }} />} label="Confirmo que revisé y acepto las condiciones del contrato." />
            <FormControlLabel control={<Checkbox checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} sx={{ color: blue, "&.Mui-checked": { color: blue } }} />} label="Acepto los términos y condiciones de esta compra." />
          </Box>
          <Box sx={{ p: 1.4, borderRadius: "16px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
            <Typography sx={{ fontWeight: 700 }}>Firma del cliente</Typography>
            {signatureDataUrl ? <Box component="img" src={signatureDataUrl} alt="Vista previa de la firma dibujada" sx={{ display: "block", width: "100%", height: 110, objectFit: "contain", my: 0.5 }} /> : <Typography sx={{ py: 2, color: "text.secondary", fontSize: "0.9rem" }}>Dibuja tu firma usando el dedo en pantalla táctil o el mouse.</Typography>}
            <Button fullWidth variant="outlined" onClick={() => setSignatureDialogOpen(true)} sx={{ minHeight: 46, borderRadius: "12px", borderColor: blue, color: blue }}>{signatureDataUrl ? "Volver a dibujar" : "Dibujar firma"}</Button>
            <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: "0.78rem" }}>La firma dibujada se conserva solo en esta pantalla. Core registra la confirmación, pero no almacena el trazo como artefacto de firma.</Typography>
          </Box>
          <Primary disabled={busy || !acceptContract || !acceptTerms || !signatureDataUrl} onClick={() => void confirmSignature()}>Firmar contrato y confirmar</Primary>
          <Button disabled={busy} onClick={() => setStage("status")}>Volver</Button>
        </>}
        {stage === "signed" && purchase && <>
          <Box sx={{ p: 2.5, borderRadius: "20px", bgcolor: "white", textAlign: "center", border: "1px solid #D9D9E1" }}>
            <CheckCircleRounded sx={{ color: "#06D986", fontSize: 72 }} />
            <Typography component="h3" sx={{ fontSize: "1.35rem", fontWeight: 800 }}>¡Compra confirmada!</Typography>
            <Typography sx={{ mt: 0.5, fontWeight: 700 }}>Firma registrada correctamente.</Typography>
            <Typography sx={{ mt: 0.8 }}>Gracias por tu compra. Nuestro equipo se pondrá en contacto contigo a la brevedad para coordinar la instalación.</Typography>
          </Box>
          <Box sx={{ p: 1.6, borderRadius: "16px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
            <Typography sx={{ fontWeight: 800 }}>{get(purchase, "producto").nombre ?? productName}</Typography>
            <Stack divider={<Box sx={{ borderBottom: "1px solid #E2E2E8" }} />} sx={{ mt: 0.5 }}>
              {[["Precio", purchase.precio], ["Pago inicial", get(purchase, "pagoInicial").usdt], ["Monto financiado", purchase.aFinanciar], ["Cuotas", purchase.cuotas]].filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => <Stack key={String(label)} direction="row" sx={{ justifyContent: "space-between", gap: 1, py: 0.75 }}><Typography color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 700, textAlign: "right" }}>{label === "Cuotas" ? value : fmt(value)}</Typography></Stack>)}
            </Stack>
          </Box>
          {purchase.consumoId && <Button component={Link} href={`/marketplace/cuotas/${encodeURIComponent(purchase.consumoId)}`} variant="contained" sx={{ minHeight: 54, bgcolor: blue, fontWeight: 800 }}>Ir a mis cuotas</Button>}
          <Button component={Link} href={`/marketplace/compras/${encodeURIComponent(purchase.id)}`} variant={purchase.consumoId ? "outlined" : "contained"} sx={{ minHeight: 52, borderColor: blue, bgcolor: purchase.consumoId ? "transparent" : blue, color: purchase.consumoId ? blue : "white", fontWeight: 800 }}>Ver detalles de mi compra</Button>
          <Button disabled={busy} onClick={() => void downloadContract()}>Descargar contrato</Button>
        </>}
      </Stack>
    </Dialog>
    <SignatureCaptureDialog open={signatureDialogOpen} onClose={() => setSignatureDialogOpen(false)} onSave={(signature) => { setSignatureDataUrl(signature); setSignatureDialogOpen(false); }} />
  </>;
}
