"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AccountBalanceWalletRounded, CheckRounded, CloseRounded, ContentCopyRounded, InfoOutlined, LocalAtmRounded, LocalOfferRounded, RequestQuoteRounded, SavingsRounded } from "@mui/icons-material";
import { Alert, Box, Button, Dialog, IconButton, MenuItem, Slide, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";
import { createPurchase, getMarketplaceHours, getProductPlan, getPurchases, getPurchase, getPurchaseContract, payC2p, reportInitialPayment, requestC2pOtp, MarketplaceServiceError } from "../services/marketplace";
import { createCopyAllText, createInstructionRows } from "../../installments/paymentInstructions";
import { getMarketplacePaymentMethods, isValidC2pOtp, isValidInitialPayment, parsePurchaseDestination, type MarketplacePaymentMethod } from "../paymentPresentation";
import { MarketplaceProductImage } from "./MarketplaceProductImage";
import { getSourceBanks } from "../../installments/services/installments";
import type { SourceBank } from "../../installments/types";
import { isActiveMarketplacePurchase, marketplacePurchaseProductId } from "../purchaseAvailability";

const blue = "#2751E6";
const surface = "#F0EFFF";
// Core publica las respuestas de compra como esquemas abiertos; se mantiene este
// único límite dinámico mientras se valida cada campo usado en la vista.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;
type Stage = "plan" | "payment" | "report" | "c2p" | "status";
const SlideUp = forwardRef(function SlideUp(props: TransitionProps & { children: React.ReactElement }, ref: React.Ref<unknown>) { return <Slide direction="up" ref={ref} {...props} />; });
const get = (value: unknown, key: string): AnyRecord => value && typeof value === "object" ? (value as AnyRecord)[key] ?? {} : {};
function purchaseItems(data: unknown): AnyRecord[] {
  if (Array.isArray(data)) return data as AnyRecord[];
  const items = get(data, "items");
  if (Array.isArray(items)) return items as AnyRecord[];
  const content = get(data, "content");
  return Array.isArray(content) ? content as AnyRecord[] : [];
}
function fmt(value: unknown, currency = "USDT") { if (value === undefined || value === null || value === "") return "—"; const n = Number(value); return Number.isFinite(n) ? `${currency} ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}` : `${currency} ${String(value)}`; }
function venezuelaDate() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ""; return `${value("year")}-${value("month")}-${value("day")}`; }
function errorCode(error: unknown) { return error instanceof MarketplaceServiceError ? String(get(error.body, "diagnostic").code ?? get(error.body, "code") ?? "") : ""; }
function formatError(error: unknown) { if (error instanceof MarketplaceServiceError) { const code = errorCode(error); if (code === "C2P_RECHAZADO") return "El banco rechazó el cobro C2P. No se realizó el pago; revisa los datos o solicita un nuevo OTP."; if (code === "C2P_OTP_FALLIDO") return "El banco no pudo generar el OTP. Puedes volver a solicitarlo."; if (code === "COMPRA_ABIERTA") return "Ya tienes una compra abierta. Estamos recuperando su estado."; if (code === "MONTO_NO_CUADRA") return "El monto del plan cambió. Actualiza el plan antes de continuar."; if (code === "FUERA_DE_HORARIO") return "El pago inicial solo se puede reportar dentro del horario de atención."; if (code === "COMPRA_VENCIDA") return "Esta compra venció. Actualiza su estado para ver las opciones disponibles."; if (code === "REFERENCIA_USADA") return "Esta referencia ya fue reportada. Verifica el estado de la compra antes de volver a intentar."; if (code === "CUPO_NO_DISPONIBLE" || code === "CUPO_INSUFICIENTE") return "El cupo cambió y ya no permite continuar con esta compra."; if (error.status === 403) return "Esta operación no está habilitada en este momento."; if (error.status === 409) return "La operación no puede continuar con el estado actual."; } return "No pudimos completar la operación. Revisa tu conexión e inténtalo nuevamente."; }
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
function Primary({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) { return <Button fullWidth variant="contained" onClick={onClick} disabled={disabled} sx={{ minHeight: 56, flexShrink: 0, borderRadius: "14px", bgcolor: blue, fontSize: "1rem", fontWeight: 800, "&:hover": { bgcolor: blue } }}>{children}</Button>; }

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

function PlanAmountCard({ title, amount, note, icon }: Readonly<{ title: string; amount: unknown; note?: string; icon: React.ReactNode }>) {
  if (amount === undefined || amount === null || amount === "") return null;
  return <Box sx={{ minWidth: 0, minHeight: 144, p: 1.45, border: "1px solid #D9D9E1", borderRadius: "16px", bgcolor: "#fff", display: "flex", flexDirection: "column" }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
      <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, lineHeight: 1.25 }}>{title}</Typography>
      <Box sx={{ width: 38, height: 38, flexShrink: 0, display: "grid", placeItems: "center", color: blue, bgcolor: "#F0EFFF", borderRadius: "50%" }}>{icon}</Box>
    </Stack>
    <Box sx={{ mt: "auto", pt: 1.2 }}>
      {note && <Typography sx={{ mb: 0.65, color: "#888", fontSize: "0.82rem", lineHeight: 1.25, fontWeight: 600 }}>{note}</Typography>}
      <Typography sx={{ color: blue, fontSize: "1.18rem", lineHeight: 1.2, fontWeight: 800, overflowWrap: "anywhere" }}>{fmt(amount)}</Typography>
    </Box>
  </Box>;
}

function PlanValueCard({ title, value, icon }: Readonly<{ title: string; value: AnyRecord; icon: React.ReactNode }>) {
  const amount = value?.usdt;
  if (amount === undefined || amount === null || amount === "") return null;
  return <Box sx={{ minHeight: 108, p: 1.45, border: "1px solid #D9D9E1", borderRadius: "16px", bgcolor: "white" }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
      <Typography sx={{ fontSize: "0.92rem", fontWeight: 600 }}>{title}</Typography>
      <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", color: blue, bgcolor: "#F0EFFF", borderRadius: "50%" }}>{icon}</Box>
    </Stack>
    <Typography sx={{ mt: 1, color: blue, fontSize: "1.18rem", lineHeight: 1.2, fontWeight: 800 }}>{fmt(amount)}</Typography>
  </Box>;
}

export function PurchasePlanFlow({ productId, productName, productImageUrl, productSubtitle }: Readonly<{ productId: string; productName: string; productImageUrl?: string; productSubtitle?: string }>) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("plan");
  const [plan, setPlan] = useState<AnyRecord | null>(null);
  const [purchase, setPurchase] = useState<AnyRecord | null>(null);
  const [blockingPurchase, setBlockingPurchase] = useState<AnyRecord | null>(null);
  const [purchaseListChecked, setPurchaseListChecked] = useState(false);
  const [purchaseListUnavailable, setPurchaseListUnavailable] = useState(false);
  const [method, setMethod] = useState<MarketplacePaymentMethod>("mobile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState<AnyRecord | null>(null);
  const [sourceBanks, setSourceBanks] = useState<readonly SourceBank[]>([]);
  const [bankListUnavailable, setBankListUnavailable] = useState(false);
  const [bank, setBank] = useState(""); const [phone, setPhone] = useState(""); const [documentId, setDocumentId] = useState(""); const [reference, setReference] = useState(""); const [date, setDate] = useState(venezuelaDate); const [reportedAmountBs, setReportedAmountBs] = useState(""); const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false); const [c2pAttempted, setC2pAttempted] = useState(false);
  const operationLock = useRef(false);

  useEffect(() => { if (!open) return; const c = new AbortController();
    void Promise.allSettled([getProductPlan(productId, c.signal), getMarketplaceHours(c.signal), getPurchases(c.signal), getSourceBanks(c.signal)]).then(async ([p, h, all, banks]) => {
      if (c.signal.aborted) return;
      if (p.status === "rejected") { setError(formatError(p.reason)); return; }
      setPlan(p.value.data);
      if (h.status === "fulfilled") setHours(h.value.data);
      if (banks.status === "fulfilled") { setSourceBanks(banks.value); setBankListUnavailable(false); }
      else { setSourceBanks([]); setBankListUnavailable(true); }
      if (all.status === "rejected") { setPurchaseListUnavailable(true); setPurchaseListChecked(true); return; }
      const list = purchaseItems(all.value.data);
      const openedPurchases = list.filter(isActiveMarketplacePurchase);
      const opened = openedPurchases.find((item: AnyRecord) => marketplacePurchaseProductId(item) === productId);
      const competing = openedPurchases.find((item: AnyRecord) => marketplacePurchaseProductId(item) !== productId);
      setBlockingPurchase(opened ? null : competing ?? null);
      setPurchaseListChecked(true);
      if (opened?.id) { const current = await getPurchase(opened.id, c.signal); if (!c.signal.aborted) { setPurchase(current.data); setC2pAttempted(hasAttemptedC2p(String(opened.id))); } }
      else setPurchase(null);
    }).catch((e: unknown) => { if (!c.signal.aborted) setError(formatError(e)); }).finally(() => { if (!c.signal.aborted) setBusy(false); });
    return () => c.abort();
  }, [open, productId]);

  const close = () => { setOpen(false); setStage("plan"); setPurchase(null); setBlockingPurchase(null); setPurchaseListChecked(false); setPurchaseListUnavailable(false); setPlan(null); setError(null); };
  const resumePurchase = () => {
    if (!purchase) return;
    setStage(purchase.etapa === "PAGAR_INICIAL" ? "payment" : "status");
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
      const current = await getPurchase(String(id)); setPurchase(current.data); setStage(current.data.etapa === "PAGAR_INICIAL" ? "payment" : "status");
    }
    catch (e) {
      const info = e instanceof MarketplaceServiceError ? get(e.body, "diagnostic") : {};
      if (info.code !== "COMPRA_ABIERTA") throw e;
      const listed = await getPurchases(); const items = purchaseItems(listed.data);
      const existing = items.find((item: AnyRecord) => isActiveMarketplacePurchase(item) && item?.id);
      if (!existing) throw e;
      if (marketplacePurchaseProductId(existing) !== productId) {
        setBlockingPurchase(existing); setPurchase(null); setPurchaseListChecked(true); setStage("plan"); return;
      }
      const current = await getPurchase(existing.id); setPurchase(current.data); setC2pAttempted(hasAttemptedC2p(String(existing.id)));
    }
  });
  const refreshPurchase = async () => { if (purchase?.id) { const updated = await getPurchase(purchase.id); setPurchase(updated.data); setStage(updated.data.etapa === "PAGAR_INICIAL" ? "payment" : "status"); if (updated.data.etapa !== "PAGAR_INICIAL") { setAttemptedC2p(purchase.id, false); setC2pAttempted(false); } else if (hasAttemptedC2p(purchase.id)) setC2pAttempted(true); } };
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
    if (typeof response.data.otp === "string" && response.data.otp) setOtp(response.data.otp);
    setOtpSent(true);
  });
  const charge = () => withBusy(async () => {
    if (!purchase?.id || c2pAttempted || !isValidC2pOtp(otp)) throw new Error("c2p_result_must_be_checked");
    setC2pAttempted(true); setAttemptedC2p(purchase.id, true);
    await payC2p(purchase.id, { bancoOrigen: bank, telefonoOrigen: phone.replace(/\D/g, ""), ...(documentId.trim() ? { documentoPagador: documentId.trim() } : {}), otp });
    await refreshPurchase();
  });

  const p = get(plan, "plan"); const initial = get(p, "pagoInicial"); const initialBs = get(purchase, "pagoInicial").bs ?? initial.bs;
  const horarioOpen = hours?.abierto ?? hours?.estaAbierto;
  const paymentEnabled = horarioOpen === true;
  const phoneValid = /^04(12|14|16|22|24|26)\d{7}$/.test(phone.replace(/\D/g, ""));
  const documentValid = !documentId || /^[VEPJGCvepjgc]-?[0-9]{1,9}$/.test(documentId);
  const bankValid = sourceBanks.some((sourceBank) => sourceBank.code === bank);
  const purchaseDestination = purchase ? parsePurchaseDestination(purchase.pagarA) : null;
  const availableMethods = getMarketplacePaymentMethods();
  const activeMethod = availableMethods.includes(method) ? method : availableMethods[0];
  return <>
    <Button fullWidth variant="contained" onClick={() => { setBusy(true); setError(null); setPurchase(null); setBlockingPurchase(null); setPurchaseListChecked(false); setPurchaseListUnavailable(false); setPlan(null); setStage("plan"); setOpen(true); }} sx={{ position: "fixed", zIndex: (theme) => theme.zIndex.appBar, left: "50%", bottom: "calc(14px + env(safe-area-inset-bottom))", transform: "translateX(-50%)", width: "min(calc(100% - 48px), 440px)", minHeight: 58, borderRadius: "14px", bgcolor: blue, fontWeight: 800, "&:hover": { bgcolor: blue } }}>Ir a plan de compra</Button>
    <Dialog open={open} onClose={close} aria-labelledby="purchase-flow-title" fullWidth maxWidth="sm" scroll="paper" slots={{ transition: SlideUp }} slotProps={{ backdrop: { sx: { bgcolor: "rgba(0,0,0,.76)" } }, container: { sx: { alignItems: "flex-end", pb: "max(8px, env(safe-area-inset-bottom))" } } }} sx={{ "& .MuiDialog-paper": { width: "calc(100% - 24px)", maxWidth: 548, height: "min(95dvh, 850px)", maxHeight: "calc(100dvh - 28px - env(safe-area-inset-top))", m: 0, overflow: "hidden", borderRadius: "24px", bgcolor: surface, color: "#171717" } }}>
      <Stack sx={{ height: "100%", minHeight: 0, overflowY: "auto", px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2.5, gap: 1.4 }}>
        <FlowHeader title={stage === "plan" ? "Plan de compra" : stage === "payment" || stage === "report" || stage === "c2p" ? "Realizar pago" : "Estado de compra"} onClose={close} />
        {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void withBusy(refreshPurchase)}>Actualizar</Button>}>{error}</Alert>}
        {busy && <Typography role="status">Consultando información…</Typography>}
        {stage === "plan" && plan && <>
          {(!p || plan.plan === null) ? <Alert severity="info">Este producto no tiene un plan de financiamiento disponible.</Alert> : <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, p: 1.2, borderRadius: "20px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
              <Box sx={{ width: 76, height: 76, flexShrink: 0, overflow: "hidden", borderRadius: "14px", bgcolor: "#F2F2F7" }}>
                <MarketplaceProductImage url={productImageUrl} productId={productId} alt="" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "1.08rem", lineHeight: 1.25, fontWeight: 800 }}>{productName}</Typography>
                {productSubtitle && <Typography sx={{ mt: 0.3, fontSize: "0.92rem", lineHeight: 1.3 }}>{productSubtitle}</Typography>}
                {plan.product && <Typography sx={{ mt: 0.25, fontSize: "0.88rem", color: "text.secondary" }}>{plan.product}</Typography>}
              </Box>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: "18px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
              <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Tu plan de compra</Typography>
              <Stack spacing={1.2}>
                {get(plan, "precio").usdt != null && <Box sx={{ position: "relative", p: 1.4, minHeight: 92, display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #D9D9E1", borderRadius: "15px" }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}><Typography sx={{ fontSize: "0.92rem" }}>Precio del equipo</Typography><LocalOfferRounded sx={{ color: blue, bgcolor: "#F0EFFF", borderRadius: "50%", p: 0.8, boxSizing: "content-box" }} /></Stack>
                  <Typography sx={{ mt: 1, color: blue, fontSize: "1.2rem", lineHeight: 1.2, fontWeight: 800 }}>{fmt(get(plan, "precio").usdt)}</Typography>
                </Box>}
                {get(p, "aFinanciar").usdt != null && <Box sx={{ p: 1.4, minHeight: 92, display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #D9D9E1", borderRadius: "15px" }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}><Typography sx={{ fontSize: "0.92rem" }}>Monto a financiar</Typography><RequestQuoteRounded sx={{ color: blue, bgcolor: "#F0EFFF", borderRadius: "50%", p: 0.8, boxSizing: "content-box" }} /></Stack>
                  <Typography sx={{ mt: 1, color: blue, fontSize: "1.2rem", lineHeight: 1.2, fontWeight: 800 }}>{fmt(get(p, "aFinanciar").usdt)}</Typography>
                </Box>}
              </Stack>
            </Box>
            <Box sx={{ p: 1.25, borderRadius: "18px", bgcolor: "white", border: "1px solid #D9D9E1" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.1 }}>
                <PlanAmountCard title="Inicial" amount={get(p, "inicial").usdt} note={p.inicialPorcentaje != null ? `${p.inicialPorcentaje}% del valor del producto` : undefined} icon={<LocalAtmRounded fontSize="small" />} />
                <PlanAmountCard title="Cuotas" amount={get(p, "montoCuota").usdt} note={[p.cuotas != null ? `${p.cuotas} cuotas` : null, p.frecuencia].filter(Boolean).join(" · ") || undefined} icon={<AccountBalanceWalletRounded fontSize="small" />} />
                <PlanValueCard title="Servicio legal" value={get(p, "servicioLegal")} icon={<SavingsRounded fontSize="small" />} />
                <PlanValueCard title="Servicio administrativo" value={get(p, "servicioAdministrativo")} icon={<RequestQuoteRounded fontSize="small" />} />
              </Box>
              {Array.isArray(p.calendario) && <details style={{ margin: "14px 4px 2px" }}><summary>Ver calendario estimado</summary>{p.calendario.map((item: AnyRecord) => <Typography key={item.numero} sx={{ mt: 0.75 }}>Cuota {item.numero}: {item.vence} · {fmt(get(item, "monto").usdt)}</Typography>)}</details>}
            </Box>
            {plan.alcanzaCupo === false || p.alcanzaCupo === false || plan.cupoUsable === false ? <Alert severity="warning">El cupo disponible no alcanza o no está habilitado para este plan.</Alert> : null}
            {horarioOpen === false && <OffHoursNotice isOpen={false} nextOpening={hours?.proximaApertura} />}
          </>}
          {purchaseListUnavailable && <Alert severity="warning">No pudimos consultar tus compras activas. Cierra este plan y vuelve a abrirlo para intentarlo nuevamente.</Alert>}
          {blockingPurchase ? <Box sx={{ p: 1.5, border: "1px solid #C7D3FF", borderRadius: "16px", bgcolor: "#F7F8FF" }}>
            <Typography sx={{ fontWeight: 800 }}>Ya tienes una compra activa</Typography>
            <Typography sx={{ mt: 0.35, mb: 1.2, color: "text.secondary", fontSize: "0.9rem" }}>Completa o consulta {get(blockingPurchase, "producto").nombre ? `“${get(blockingPurchase, "producto").nombre}”` : "tu compra actual"} antes de iniciar otra.</Typography>
            {marketplacePurchaseProductId(blockingPurchase) && <Button component={Link} href={`/marketplace/${encodeURIComponent(marketplacePurchaseProductId(blockingPurchase)!)}`} fullWidth variant="outlined" sx={{ minHeight: 48, borderRadius: "13px", fontWeight: 800 }}>Ir a la compra activa</Button>}
          </Box> : purchase ? <Box sx={{ p: 1.5, border: "1px solid #C7D3FF", borderRadius: "16px", bgcolor: "#F7F8FF" }}>
            <Typography sx={{ fontWeight: 800 }}>Tienes una compra pendiente</Typography>
            <Typography sx={{ mt: 0.35, mb: 1.2, color: "text.secondary", fontSize: "0.9rem" }}>Revisa este plan y elige cuándo quieres retomar tu compra.</Typography>
            <Button fullWidth variant="contained" disabled={busy} onClick={resumePurchase} sx={{ minHeight: 50, borderRadius: "13px", bgcolor: blue, fontWeight: 800, "&:hover": { bgcolor: blue } }}>Continuar compra</Button>
          </Box> : p && <Primary disabled={busy || !purchaseListChecked || purchaseListUnavailable || plan.alcanzaCupo === false || p.alcanzaCupo === false || plan.cupoUsable === false} onClick={() => void create()}>Iniciar compra</Primary>}
        </>}
        {(stage === "payment" || stage === "report") && purchase && <>
          <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.25rem" }}>Pagar inicial</Typography>
          {purchase.motivoRechazo && <Alert severity="error">Pago rechazado: {purchase.motivoRechazo}. Revisa los datos antes de volver a reportarlo.</Alert>}
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: blue, color: "white" }}><Typography>Monto congelado</Typography><Typography sx={{ fontSize: "1.5rem", fontWeight: 700 }}>{fmt(initialBs, "Bs.")}</Typography></Box>
          {stage === "payment" && <>
          <ToggleButtonGroup aria-label="Método de pago" exclusive fullWidth value={activeMethod} onChange={(_, value: MarketplacePaymentMethod | null) => value && setMethod(value)} sx={{ p: 0.5, borderRadius: 99, bgcolor: "#F0EFFF", "& .MuiToggleButtonGroup-grouped": { minHeight: 44, border: 0, borderRadius: "99px !important", color: "#171717", fontWeight: 700, textTransform: "none" }, "& .Mui-selected": { bgcolor: `${blue} !important`, color: "#fff !important" } }}>
            <ToggleButton value="mobile">Pago móvil</ToggleButton><ToggleButton value="transfer">Transferencia</ToggleButton><ToggleButton value="c2p">C2P</ToggleButton>
          </ToggleButtonGroup>
          {!paymentEnabled && <OffHoursNotice isOpen={horarioOpen} nextOpening={hours?.proximaApertura} />}
          {activeMethod !== "c2p" && purchaseDestination && <InitialPaymentInstructions destination={purchaseDestination} amountBs={String(initialBs ?? "0")} method={activeMethod} />}
          {activeMethod !== "c2p" && !purchaseDestination && <Alert severity="warning">No recibimos los datos de destino para este método. Actualiza la compra o inténtalo más tarde.</Alert>}
          {activeMethod !== "c2p" && <Primary disabled={busy || !paymentEnabled || !purchaseDestination} onClick={() => { setReportedAmountBs(String(initialBs ?? "")); setStage("report"); }}>Listo - Ya pagué</Primary>}
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
            <Button onClick={() => setStage("payment")} sx={{ alignSelf: "flex-start" }}>Volver a instrucciones</Button>
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
        {stage === "status" && purchase && <>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "white", textAlign: "center" }}><AccountBalanceWalletRounded sx={{ color: blue, fontSize: 42 }} /><Typography component="h3" sx={{ fontSize: "1.25rem", fontWeight: 800 }}>{purchase.etapa === "VALIDANDO_PAGO" ? String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "TRANSFERENCIA" ? "Pago pendiente de aprobación" : String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "PAGO_MOVIL" ? "Pago móvil en revisión" : String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "C2P" ? "Verificando pago C2P" : "Verificando pago" : purchase.etapa === "PAGAR_CUOTAS" ? "Compra confirmada" : purchase.etapa === "VENCIDA" ? "Compra vencida" : purchase.etapa === "ESPERANDO_FIRMAS" ? "Inicial aprobada" : purchase.motivoRechazo ? "Pago rechazado" : purchase.estado ?? "Estado de compra"}</Typography><Typography>{purchase.motivoRechazo ?? (purchase.etapa === "ESPERANDO_FIRMAS" ? "El pago inicial fue aprobado. El contrato está disponible para revisión." : purchase.etapa === "VALIDANDO_PAGO" && String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "TRANSFERENCIA" ? "La transferencia debe ser revisada y aprobada por la empresa." : purchase.etapa === "VALIDANDO_PAGO" && String(get(get(purchase, "pago"), "metodo")).toUpperCase() === "PAGO_MOVIL" ? "El pago móvil no pudo confirmarse automáticamente y será revisado. Actualiza para consultar el resultado." : purchase.etapa === "VALIDANDO_PAGO" ? "Estamos confirmando el resultado con el banco. Actualiza el estado para consultar el resultado; no repitas un cobro C2P." : `Etapa: ${purchase.etapa ?? "No disponible"}`)}</Typography></Box>
          {purchase.etapa === "ESPERANDO_FIRMAS" && <><Alert severity="info">Descarga y revisa el contrato. La firma electrónica no está definida en esta integración; no enviaremos una confirmación de firma sin el flujo real.</Alert><Button disabled={busy} onClick={() => void downloadContract()}>Descargar contrato</Button></>}
          {purchase.etapa === "PAGAR_CUOTAS" && purchase.consumoId && <Button component="a" href={`/installments/${encodeURIComponent(purchase.consumoId)}`} variant="contained" sx={{ bgcolor: blue }}>Ir a mis cuotas</Button>}
          <Button onClick={() => void withBusy(refreshPurchase)}>Actualizar estado</Button>
        </>}
      </Stack>
    </Dialog>
  </>;
}
