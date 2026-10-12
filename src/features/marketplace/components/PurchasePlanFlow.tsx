"use client";

import { useState } from "react";
import {
  AccountBalanceWalletRounded,
  CheckCircleRounded,
  CloseRounded,
  ContentCopyRounded,
  CreditCardRounded,
  ReceiptLongRounded,
  VerifiedRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  IconButton,
  MenuItem,
  Select,
  Slide,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";

import { SolarProductArtwork } from "./SolarProductArtwork";

const marketplaceBlue = "#2751E6";
const modalBackground = "#F0EFFF";

type PaymentMethod = "mobile" | "transfer";
type FlowStep = "plan" | "payment" | "report" | "validation" | "success";

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function FlowHeader({
  title,
  onClose,
}: Readonly<{ title: string; onClose: () => void }>) {
  return (
    <Stack direction="row" sx={{ minHeight: 48, alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <IconButton
        aria-label="Cerrar plan de compra"
        onClick={onClose}
        sx={{ width: 42, height: 42, color: "#171717", border: "1.5px solid #171717" }}
      >
        <CloseRounded sx={{ fontSize: 22 }} />
      </IconButton>
      <Typography id="purchase-flow-title" component="h2" sx={{ color: "#171717", fontSize: "1rem", fontWeight: 700, textAlign: "center" }}>
        {title}
      </Typography>
      <Box sx={{ width: 42 }} aria-hidden="true" />
    </Stack>
  );
}

function ActionButton({ children, onClick }: Readonly<{ children: React.ReactNode; onClick: () => void }>) {
  return (
  <Button
      fullWidth
      variant="contained"
      onClick={onClick}
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: 2,
        minHeight: 58,
        flexShrink: 0,
        borderRadius: "14px",
        bgcolor: marketplaceBlue,
        color: "white",
        fontSize: "1.1rem",
        fontWeight: 800,
        boxShadow: "0 3px 0 rgba(0,0,0,.14), inset 0 2px 0 rgba(255,255,255,.24)",
        "&:hover": { bgcolor: marketplaceBlue },
      }}
    >
      {children}
    </Button>
  );
}

function PlanAmount({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Box sx={{ minHeight: 92, display: "flex", flexDirection: "column", justifyContent: "space-between", p: 1.4, border: "1px solid #D6D6D6", borderRadius: "15px", bgcolor: "#fff" }}>
      <Typography sx={{ color: "#1A1A1A", fontSize: "0.91rem" }}>{label}</Typography>
      <Typography sx={{ color: marketplaceBlue, fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
    </Box>
  );
}

function PlanStep({ productName, imageVariant, onPay }: Readonly<{ productName: string; imageVariant: number; onPay: () => void }>) {
  return (
    <>
      <Box sx={{ p: 1.25, display: "flex", gap: 1.25, alignItems: "center", borderRadius: "15px", border: "1px solid #D6D6D6", bgcolor: "#fff" }}>
        <Box sx={{ width: 76, height: 76, flexShrink: 0, overflow: "hidden", borderRadius: "9px" }}>
          <SolarProductArtwork variant={imageVariant} />
        </Box>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#242424", fontSize: "1.17rem", lineHeight: 1.15, fontWeight: 800 }}>{productName}</Typography>
          <Typography sx={{ color: "#1F1F1F", lineHeight: 1.3 }}>Inversor + batería de litio</Typography>
          <Typography sx={{ color: "#1F1F1F", lineHeight: 1.3 }}>Orden #1234</Typography>
        </Stack>
      </Box>

      <Box sx={{ p: 1.4, borderRadius: "15px", border: "1px solid #D6D6D6", bgcolor: "#fff" }}>
        <Typography sx={{ mb: 1, color: "#1B1B1B", fontSize: "1.03rem", fontWeight: 800 }}>Tu plan de compra</Typography>
        <Stack spacing={1}>
          <PlanAmount label="Precio del equipo" value="1.000 usdt" />
          <PlanAmount label="Monto a financiar" value="800 usdt" />
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.2 }}>
        <Box sx={{ minHeight: 174, p: 1.35, borderRadius: "15px", border: "1px solid #D6D6D6", bgcolor: "white", display: "flex", flexDirection: "column" }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography sx={{ fontWeight: 800 }}>Inicial</Typography>
            <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "50%", color: marketplaceBlue, bgcolor: "#F0EFFF" }}><CreditCardRounded fontSize="small" /></Box>
          </Stack>
          <Typography sx={{ mt: "auto", color: "#929292", fontSize: "0.9rem", fontWeight: 600 }}>Costo de gestión - $25</Typography>
          <Typography sx={{ mt: 0.4, color: marketplaceBlue, fontSize: "1.35rem", fontWeight: 800 }}>225 usdt</Typography>
        </Box>
        <Box sx={{ minHeight: 174, p: 1.35, borderRadius: "15px", border: "1px solid #D6D6D6", bgcolor: "white", display: "flex", flexDirection: "column" }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography sx={{ fontWeight: 800 }}>6 Cuotas</Typography>
            <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "50%", color: marketplaceBlue, bgcolor: "#F0EFFF" }}><ReceiptLongRounded fontSize="small" /></Box>
          </Stack>
          <Typography sx={{ mt: "auto", color: marketplaceBlue, fontSize: "1.35rem", fontWeight: 800 }}>200 usdt</Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }} />
      <ActionButton onClick={onPay}>Pagar</ActionButton>
    </>
  );
}

function AmountSummary() {
  return (
    <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: marketplaceBlue, color: "white" }}>
      <Typography sx={{ fontSize: "0.86rem" }}>Monto a pagar</Typography>
      <Typography sx={{ fontSize: "1.55rem", lineHeight: 1.25 }}>Bs.30.981,51</Typography>
      <Typography sx={{ mt: 0.7, fontSize: "0.82rem" }}>Mascota - Cuota 03 - hasta el 9 nov.</Typography>
    </Box>
  );
}

function PaymentTabs({ value, onChange }: Readonly<{ value: PaymentMethod; onChange: (method: PaymentMethod) => void }>) {
  return (
    <Stack direction="row" role="tablist" aria-label="Método de pago" sx={{ p: 0.75, borderRadius: "17px", border: "1px solid #D9D9E1", bgcolor: modalBackground }}>
      {(["mobile", "transfer"] as const).map((method) => {
        const selected = value === method;
        return (
          <Button
            key={method}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(method)}
            sx={{ flex: 1, minHeight: 43, borderRadius: "13px", color: selected ? "white" : "#171717", bgcolor: selected ? marketplaceBlue : "transparent", boxShadow: selected ? "inset 0 0 0 1px rgba(255,255,255,.75)" : "none", fontWeight: 700, "&:hover": { bgcolor: selected ? marketplaceBlue : "rgba(39,81,230,.06)" } }}
          >
            {method === "mobile" ? "Pago móvil" : "Transferencia"}
          </Button>
        );
      })}
    </Stack>
  );
}

function CopyableRow({
  label,
  value,
  emphasize = false,
  onCopy,
}: Readonly<{ label: string; value: string; emphasize?: boolean; onCopy: (value: string) => void }>) {
  return (
    <Stack direction="row" sx={{ minHeight: 56, alignItems: "center", justifyContent: "space-between", gap: 1, px: 1.5, py: 0.65, borderBottom: "1px solid #D5D5DC", bgcolor: modalBackground, "&:last-of-type": { borderBottom: 0 } }}>
      <Stack spacing={0.05} sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "#757575", fontSize: "0.72rem", lineHeight: 1.2 }}>{label}</Typography>
        <Typography sx={{ color: "#101010", fontSize: emphasize ? "1.1rem" : "0.96rem", lineHeight: 1.25, fontWeight: emphasize ? 800 : 500, overflowWrap: "anywhere" }}>{value}</Typography>
      </Stack>
      <IconButton
        aria-label={`Copiar ${label.toLocaleLowerCase("es-VE")}`}
        onClick={() => onCopy(value)}
        size="small"
        sx={{ flexShrink: 0, color: marketplaceBlue }}
      >
        <ContentCopyRounded fontSize="small" />
      </IconButton>
    </Stack>
  );
}

function PaymentStep({
  method,
  onMethodChange,
  onPaid,
  onCopy,
}: Readonly<{ method: PaymentMethod; onMethodChange: (method: PaymentMethod) => void; onPaid: () => void; onCopy: (text: string) => void }>) {
  const mobilePaymentRows = [
    ["Banco destino", "Banesco"],
    ["RIF", "J-00000000"],
    ["Nro de teléfono", "0424-000-0000"],
    ["Monto", "Bs. 17.590,76"],
  ] as const;
  const transferRows = [
    ["Banco destino", "Banesco"],
    ["Titular", "Impulsa Venture Capital C.A"],
    ["RIF", "J-00000000"],
    ["Nro de cuenta", "0171 0000 0000 0000 0000"],
    ["Tipo de cuenta", "Corriente"],
    ["Monto", "Bs. 17.590,76"],
  ] as const;
  const rows = method === "mobile" ? mobilePaymentRows : transferRows;

  return (
    <>
      <Typography component="h3" sx={{ color: "#242424", fontSize: "1.35rem", fontWeight: 800 }}>Realiza el pago</Typography>
      <AmountSummary />
      <Alert severity="info" sx={{ p: 0.2, borderRadius: "12px", bgcolor: "white", color: "#191919", border: "1px solid #D9D9D9", fontSize: "0.8rem", "& .MuiAlert-icon": { color: marketplaceBlue, mr: 0.8 } }}>
        Si pagas otro día, el monto puede cambiar. Al reportar usa la fecha real de tu pago.
      </Alert>
      <Box sx={{ p: 1.5, border: "1px solid #D9D9D9", borderRadius: "15px", bgcolor: "white" }}>
        <PaymentTabs value={method} onChange={onMethodChange} />
        <Box sx={{ mt: 0.8, overflow: "hidden", border: "1px solid #D9D9D9", borderRadius: "17px" }}>
          {rows.map(([label, value]) => <CopyableRow key={label} label={label} value={value} emphasize={label === "Monto"} onCopy={onCopy} />)}
        </Box>
        <Button
          fullWidth
          startIcon={<ContentCopyRounded />}
          onClick={() => onCopy(rows.map(([label, value]) => `${label}: ${value}`).join("\n"))}
          sx={{ minHeight: 42, mt: 0.8, borderRadius: "13px", bgcolor: "#F8F8FA", color: marketplaceBlue, fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,.2)", "&:hover": { bgcolor: "#F2F2F6" } }}
        >
          Copiar todos los datos
        </Button>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }} />
      <ActionButton onClick={onPaid}>Listo - Ya pagué</ActionButton>
    </>
  );
}

function ReadOnlyField({ label, value, trailing, compact = false }: Readonly<{ label?: string; value: string; trailing?: React.ReactNode; compact?: boolean }>) {
  return (
    <Stack direction="row" sx={{ minHeight: compact ? 50 : 58, alignItems: "center", justifyContent: "space-between", gap: 1.25, px: compact ? 1.4 : 1.7, py: compact ? 0.55 : 0.9, borderBottom: "1px solid #D5D5DC", bgcolor: modalBackground, "&:last-child": { borderBottom: 0 } }}>
      <Stack spacing={0.05} sx={{ minWidth: 0, flex: 1 }}>
        {label && <Typography sx={{ color: "#717171", fontSize: "0.72rem", lineHeight: 1.2 }}>{label}</Typography>}
        <Typography sx={{ color: label ? "#161616" : "#777", fontSize: "0.91rem", overflowWrap: "anywhere" }}>{value}</Typography>
      </Stack>
      {trailing}
    </Stack>
  );
}

function ReportStep({ onReport, onBack, productName }: Readonly<{ onReport: () => void; onBack: () => void; productName: string }>) {
  const [selectedBank, setSelectedBank] = useState("Mercantil Banco");
  const [reference, setReference] = useState("004512398765");
  const [paymentDate, setPaymentDate] = useState("2026-10-10");
  const [documentId, setDocumentId] = useState("V-5416169");
  const [phone, setPhone] = useState("");
  const [receiptAttached, setReceiptAttached] = useState(false);
  const [amountMatches, setAmountMatches] = useState(true);

  return (
    <>
      <Typography component="h3" sx={{ ml: 0, mt: 0.15, mb: 0.35, color: "#242424", fontSize: "1.25rem", lineHeight: 1.2, fontWeight: 800 }}>Reporta el pago</Typography>
      <Box sx={{ p: 1.3, borderRadius: "13px", border: "1px solid #D8D8D8", bgcolor: "white" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ width: 40, height: 40, display: "grid", flexShrink: 0, placeItems: "center", borderRadius: "50%", bgcolor: "#F0EFFF", color: marketplaceBlue }}>
            <AccountBalanceWalletRounded />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, pb: 0.25 }}>
            <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.2, fontWeight: 800 }}>{productName}</Typography>
            <Typography sx={{ mt: 0.35, fontSize: "1.18rem", lineHeight: 1.2, fontWeight: 800 }}>Bs. 17.590,76</Typography>
          </Box>
          <Box sx={{ px: 0.7, py: 0.3, display: "inline-flex", alignItems: "center", gap: 0.2, borderRadius: "7px", bgcolor: "#0AED81", color: "#07180E", fontSize: "0.62rem", fontWeight: 700, whiteSpace: "nowrap" }}>
            <CheckCircleRounded sx={{ fontSize: 14 }} /> Al día
          </Box>
        </Stack>
      </Box>
      <Box sx={{ px: 1.4, py: 0.85, border: "1px solid #D8D8D8", borderRadius: "12px", bgcolor: "white" }}>
        <Typography sx={{ fontSize: "0.78rem" }}>Pagar inicial: $225 | 3 cuotas - cada 15 días.</Typography>
      </Box>

      <Box sx={{ p: 1.3, border: "1px solid #D8D8D8", borderRadius: "15px", bgcolor: "white" }}>
        <Box sx={{ overflow: "hidden", border: "1px solid #D8D8D8", borderRadius: "16px" }}>
          <Select
            fullWidth
            value={selectedBank}
            onChange={(event) => setSelectedBank(event.target.value)}
            displayEmpty
            sx={{ minHeight: 50, bgcolor: modalBackground, borderRadius: 0, "& fieldset": { border: 0 }, "& .MuiSelect-select": { whiteSpace: "normal", fontSize: "0.84rem", py: 1.2 } }}
          >
            <MenuItem value="Mercantil Banco">Banco desde el que pagaste: Mercantil Banco</MenuItem>
            <MenuItem value="Banesco">Banco desde el que pagaste: Banesco</MenuItem>
            <MenuItem value="Banco de Venezuela">Banco desde el que pagaste: Banco de Venezuela</MenuItem>
          </Select>
          <TextField fullWidth size="small" variant="standard" label="Referencia de pago" placeholder="Ej. 004512398765" value={reference} onChange={(event) => setReference(event.target.value)} slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true, sx: { left: 14, top: 11, transform: "none" } } }} sx={{ minHeight: 60, px: 1.5, bgcolor: modalBackground, borderTop: "1px solid #D5D5DC", "& .MuiInput-root": { height: 60, position: "relative" }, "& input": { boxSizing: "border-box", position: "absolute", top: 29, left: 0, height: 22, p: 0, fontSize: "0.96rem", lineHeight: 1.25 }, "& label": { fontSize: "0.72rem", lineHeight: 1.2 } }} />
          <TextField fullWidth size="small" type="date" variant="standard" label="Fecha de pago" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true, sx: { left: 14, top: 11, transform: "none" } } }} sx={{ minHeight: 60, px: 1.5, bgcolor: modalBackground, borderTop: "1px solid #D5D5DC", "& .MuiInput-root": { height: 60, position: "relative" }, "& input": { boxSizing: "border-box", position: "absolute", top: 29, left: 0, height: 22, p: 0, fontSize: "0.96rem", lineHeight: 1.25 }, "& label": { fontSize: "0.72rem", lineHeight: 1.2 } }} />
          <TextField fullWidth size="small" variant="standard" label="Documento de identidad" value={documentId} onChange={(event) => setDocumentId(event.target.value)} slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true, sx: { left: 14, top: 11, transform: "none" } } }} sx={{ minHeight: 60, px: 1.5, bgcolor: modalBackground, borderTop: "1px solid #D5D5DC", "& .MuiInput-root": { height: 60, position: "relative" }, "& input": { boxSizing: "border-box", position: "absolute", top: 29, left: 0, height: 22, p: 0, fontSize: "0.96rem", lineHeight: 1.25 }, "& label": { fontSize: "0.72rem", lineHeight: 1.2 } }} />
          <TextField fullWidth size="small" variant="standard" label="Número de teléfono" placeholder="Ej. 0424-000-0000" value={phone} onChange={(event) => setPhone(event.target.value)} slotProps={{ htmlInput: { inputMode: "tel" }, input: { disableUnderline: true }, inputLabel: { shrink: true, sx: { left: 14, top: 11, transform: "none" } } }} sx={{ minHeight: 60, px: 1.5, bgcolor: modalBackground, borderTop: "1px solid #D5D5DC", "& .MuiInput-root": { height: 60, position: "relative" }, "& input": { boxSizing: "border-box", position: "absolute", top: 29, left: 0, height: 22, p: 0, fontSize: "0.96rem", lineHeight: 1.25 }, "& label": { fontSize: "0.72rem", lineHeight: 1.2 } }} />
          <ReadOnlyField label="Monto" value="17.590,76" compact />
        </Box>
      </Box>

      <Button
        fullWidth
        startIcon={receiptAttached ? <CheckCircleRounded /> : <ReceiptLongRounded />}
        onClick={() => setReceiptAttached((current) => !current)}
        sx={{ minHeight: 42, borderRadius: "12px", bgcolor: "#F8F8FA", color: marketplaceBlue, fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,.18)", "&:hover": { bgcolor: "#F2F2F6" } }}
      >
        {receiptAttached ? "Comprobante adjunto" : "Adjuntar comprobante"}
      </Button>
      <Stack direction="row" sx={{ minHeight: 28, alignItems: "center", mt: 0.5 }}>
        <Checkbox checked={amountMatches} onChange={(event) => setAmountMatches(event.target.checked)} size="small" sx={{ p: 0.35, color: marketplaceBlue, "&.Mui-checked": { color: marketplaceBlue } }} />
        <Typography sx={{ fontSize: "0.76rem" }}>El monto corresponde al producto e indicación indicada</Typography>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }} />
      <ActionButton onClick={onReport}>Reportar pago</ActionButton>
      <Button fullWidth onClick={onBack} sx={{ minHeight: 42, borderRadius: "12px", bgcolor: "#F8F8FA", color: marketplaceBlue, fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,.18)", "&:hover": { bgcolor: "#F2F2F6" } }}>
        Volver a cuotas
      </Button>
    </>
  );
}

function ValidationStep({ onComplete }: Readonly<{ onComplete: () => void }>) {
  return (
    <Stack spacing={3} sx={{ mt: "auto", mb: -2.5, mx: -2, p: 2.5, pt: 4, alignItems: "center", bgcolor: "white", borderRadius: "16px 16px 0 0", textAlign: "center" }}>
      <Box>
        <Typography sx={{ color: "#202020", fontSize: "1.13rem", fontWeight: 800 }}>Estamos validando tu pago</Typography>
        <Typography sx={{ mt: 0.7, fontSize: "0.82rem" }}>El monto corresponde a la opción seleccionada</Typography>
      </Box>
      <ActionButton onClick={onComplete}>Listo - Reportar pago</ActionButton>
    </Stack>
  );
}

function SuccessStep({ onClose, productName }: Readonly<{ onClose: () => void; productName: string }>) {
  const details = [
    ["Producto", productName],
    ["Cuota reportada", "Cuota 03"],
    ["Banco", "Mercantil Banco"],
    ["Documento", "V-5416169"],
    ["Referencia", "004512398765"],
    ["Fecha", "10 oct."],
    ["Teléfono", "0422 285 5007"],
    ["Monto reportado", "Bs. 17.590,76"],
  ] as const;

  return (
    <>
      <Stack spacing={1.2} sx={{ alignItems: "center", textAlign: "center", pt: 1 }}>
        <Box sx={{ width: 88, height: 88, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#BDEFE1" }}>
          <Box sx={{ width: 62, height: 62, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#0AED81", color: "#05054F" }}>
            <VerifiedRounded sx={{ fontSize: 40 }} />
          </Box>
        </Box>
        <Typography component="h3" sx={{ color: "#05054F", fontSize: "1.7rem", fontWeight: 800 }}>¡Pago reportado!</Typography>
        <Typography sx={{ color: "#05054F", fontSize: "0.9rem" }}>Tu reporte fue enviado correctamente y será validado por el equipo.</Typography>
      </Stack>
      <Stack spacing={0} sx={{ p: 1.5, borderRadius: "18px", bgcolor: "white" }}>
        {details.map(([label, value]) => (
          <Stack key={label} direction="row" sx={{ py: 0.8, alignItems: "center", justifyContent: "space-between", gap: 2, borderBottom: "1px solid #E4E4E8", "&:last-child": { border: 0 } }}>
            <Typography sx={{ color: "#05054F", fontSize: "0.83rem" }}>{label}</Typography>
            <Typography sx={{ color: "#05054F", fontSize: "0.83rem", fontWeight: 700, textAlign: "right" }}>{value}</Typography>
          </Stack>
        ))}
      </Stack>
      <Typography sx={{ color: "#777", fontSize: "0.82rem", textAlign: "center" }}>
        Tu cuota aparecerá como “En revisión” hasta que el pago sea aprobado.
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0 }} />
      <ActionButton onClick={onClose}>Ver mis cuotas</ActionButton>
    </>
  );
}

export function PurchasePlanFlow({
  productName,
  imageVariant,
}: Readonly<{ productName: string; imageVariant: number }>) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<FlowStep>("plan");
  const [method, setMethod] = useState<PaymentMethod>("mobile");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const copyText = (text: string) => {
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    setSnackbarOpen(true);
  };

  const closeFlow = () => {
    setOpen(false);
    setStep("plan");
  };

  return (
    <>
      <Button
        fullWidth
        variant="contained"
        onClick={() => setOpen(true)}
        sx={{ position: "fixed", zIndex: (theme) => theme.zIndex.appBar, left: "50%", bottom: "calc(14px + env(safe-area-inset-bottom))", transform: "translateX(-50%)", width: "min(calc(100% - 48px), 440px)", minHeight: 58, borderRadius: "14px", bgcolor: marketplaceBlue, fontSize: "1rem", fontWeight: 800, boxShadow: "0 4px 12px rgba(39,81,230,.22)", "&:hover": { bgcolor: marketplaceBlue } }}
      >
        Ir a plan de compra
      </Button>

      <Dialog
        open={open}
        onClose={closeFlow}
        aria-labelledby="purchase-flow-title"
        fullWidth
        maxWidth="sm"
        scroll="paper"
        slots={{ transition: SlideUpTransition }}
        slotProps={{
          backdrop: { sx: { bgcolor: "rgba(0,0,0,.76)" } },
          container: { sx: { alignItems: "flex-end", pb: "max(8px, env(safe-area-inset-bottom))" } },
        }}
        sx={{
          "& .MuiDialog-paper": {
            width: "calc(100% - 24px)",
            maxWidth: 548,
            height: "min(95dvh, 850px)",
            maxHeight: "calc(100dvh - 28px - env(safe-area-inset-top))",
            m: 0,
            overflow: "hidden",
            borderRadius: "24px",
            bgcolor: modalBackground,
            color: "#171717",
            boxShadow: "0 20px 64px rgba(0,0,0,.28)",
          },
        }}
      >
        <Stack sx={{ height: "100%", minHeight: 0, overflowY: step === "plan" ? "auto" : "hidden", px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, gap: 1.7 }}>
          <FlowHeader title={step === "plan" ? "Plan de compra" : step === "report" || step === "validation" ? "Último paso" : step === "success" ? "Reporte de pago" : "Realizar pago"} onClose={closeFlow} />

          {step === "plan" && <PlanStep productName={productName} imageVariant={imageVariant} onPay={() => setStep("payment")} />}

          {step === "payment" && (
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 0.8 }}>
              <Box sx={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.8, minHeight: 0, flex: 1, pb: 0.25 }}>
                <PaymentStep method={method} onMethodChange={setMethod} onPaid={() => setStep("report")} onCopy={copyText} />
              </Box>
            </Box>
          )}

          {step === "report" && (
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 0.8, overflowY: "auto" }}>
              <ReportStep onReport={() => setStep("validation")} onBack={() => setStep("payment")} productName={productName} />
            </Box>
          )}

          {step === "validation" && <ValidationStep onComplete={() => setStep("success")} />}

          {step === "success" && (
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 1.5, overflowY: "auto" }}>
              <SuccessStep onClose={closeFlow} productName={productName} />
            </Box>
          )}
        </Stack>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2400}
        onClose={() => setSnackbarOpen(false)}
        message="Datos copiados"
      />
    </>
  );
}
