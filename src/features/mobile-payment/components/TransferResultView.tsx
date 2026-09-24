import type { Ref } from "react";
import {
  AccessTimeRounded,
  CheckRounded,
  CloseRounded,
  InfoRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  formatMinorUnits,
  formatPercentage,
  formatTransactionDate,
  maskPhone,
} from "../format";
import type { TransferResult } from "../types";

type TransferResultViewProps = Readonly<{
  result: TransferResult;
  titleRef: Ref<HTMLHeadingElement>;
  onBackHome: () => void;
}>;

type ResultRowProps = Readonly<{
  label: string;
  value: string;
  strong?: boolean;
}>;

function ResultRow({ label, value, strong = false }: ResultRowProps) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 2 }}
    >
      <Typography sx={{ color: "secondary.main", fontSize: 13, fontWeight: strong ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: "secondary.main",
          fontSize: 13,
          fontWeight: strong ? 800 : 500,
          overflowWrap: "anywhere",
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export function TransferResultView({
  result,
  titleRef,
  onBackHome,
}: TransferResultViewProps) {
  const transactionDateLabel = result.transactionDate
    ? formatTransactionDate(result.transactionDate)
    : null;
  const phoneLabel = result.phone.includes("*")
    ? result.phone
    : maskPhone(result.phone);
  const presentation = result.status === "success"
    ? {
        title: "¡Envío exitoso!",
        subtitle: "Tu pago móvil se ha realizado correctamente.",
        color: "#00B86B",
        softColor: "#A7F3D0",
        Icon: CheckRounded,
        role: "status" as const,
      }
    : result.status === "processing"
      ? {
          title: "Pago pendiente",
          subtitle: "Estamos procesando tu pago móvil.",
          color: "#E9A800",
          softColor: "#FFF0B3",
          Icon: AccessTimeRounded,
          role: "status" as const,
        }
      : {
          title: "No se pudo realizar el envío",
          subtitle: "Por favor, revisa la información antes de continuar.",
          color: "#FF1F2D",
          softColor: "#FFD6DA",
          Icon: CloseRounded,
          role: "alert" as const,
        };
  const StatusIcon = presentation.Icon;

  return (
    <Box
      component="section"
      aria-labelledby="mobile-payment-result-title"
      sx={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      <Stack
        aria-live={result.status === "rejected" ? "assertive" : "polite"}
        role={presentation.role}
        sx={{ flex: 1, alignItems: "center", textAlign: "center" }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 100,
            height: 100,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: presentation.softColor,
            border: "1px solid",
            borderColor: alpha(presentation.color, 0.35),
          }}
        >
          <Box
            sx={{
              width: 70,
              height: 70,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: presentation.color,
              color: "common.white",
            }}
          >
            <StatusIcon sx={{ width: 38, height: 38 }} />
          </Box>
        </Box>

        <Typography
          component="h1"
          id="mobile-payment-result-title"
          ref={titleRef}
          tabIndex={-1}
          sx={{
            mt: 1.5,
            color: "secondary.main",
            fontSize: { xs: "1.625rem", sm: "2rem" },
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {presentation.title}
        </Typography>
        <Typography color="secondary.main" sx={{ mt: 0.75, fontSize: 13 }}>
          {presentation.subtitle}
        </Typography>

        {result.status === "rejected" ? (
          <Card
            elevation={0}
            sx={{ width: "100%", mt: 2, borderRadius: 4, bgcolor: "common.white" }}
          >
            <CardContent sx={{ px: 2.5, py: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Stack spacing={1.25} sx={{ alignItems: "center" }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <Typography sx={{ color: "secondary.main", fontSize: 17 }}>
                    Motivo
                  </Typography>
                  <InfoRounded color="primary" sx={{ fontSize: 17 }} />
                </Stack>
                <Typography
                  sx={{ color: "secondary.main", fontSize: 20, fontWeight: 700 }}
                >
                  Operación no completada
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 300, fontSize: 13 }}>
                  {result.userMessage ?? "No pudimos confirmar el pago móvil. Inténtalo nuevamente más tarde."}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card
            elevation={0}
            sx={{ width: "100%", mt: 2, borderRadius: 4, bgcolor: "common.white" }}
          >
            <CardContent sx={{ px: 2, py: 2, "&:last-child": { pb: 2 } }}>
              <Stack spacing={1}>
                <ResultRow label="Beneficiario" value={result.beneficiaryName} />
                <ResultRow label="Banco" value={result.bankName} />
                <ResultRow label="Teléfono" value={phoneLabel} />
                <Box sx={{ my: 0.25, borderTop: "1px solid", borderColor: "secondary.main" }} />
                <ResultRow label="Monto enviado" value={formatMinorUnits(result.amountMinorUnits)} />
                <ResultRow
                  label={`Comisión (${formatPercentage(result.feePercentage)})`}
                  value={formatMinorUnits(result.feeMinorUnits)}
                />
                <Box sx={{ my: 0.25, borderTop: "1px solid", borderColor: "secondary.main" }} />
                <ResultRow
                  label="Total a debitar"
                  strong
                  value={formatMinorUnits(result.totalMinorUnits)}
                />
                <Box sx={{ my: 0.25, borderTop: "1px solid", borderColor: "secondary.main" }} />
                <ResultRow
                  label="Fecha y hora"
                  value={transactionDateLabel
                    ? `${transactionDateLabel.date} - ${transactionDateLabel.time}`
                    : "Pendiente de confirmación"}
                />
                <ResultRow
                  label="N.º de referencia"
                  value={result.bankReference ?? "Pendiente"}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {result.status === "processing" && (
          <Typography color="text.secondary" sx={{ mt: 1.5, px: 1, fontSize: 12 }}>
            No realices nuevamente el pago mientras confirmamos el resultado.
          </Typography>
        )}

        <Button
          fullWidth
          onClick={onBackHome}
          sx={{ mt: 2, mb: 1, borderRadius: 8, minHeight: 48 }}
          type="button"
          variant="contained"
        >
          Volver al inicio
        </Button>
      </Stack>
    </Box>
  );
}
