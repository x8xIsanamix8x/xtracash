"use client";

import { Ref, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleOutlineRounded,
  ChevronLeftRounded,
  ContentCopyRounded,
  ErrorOutlineRounded,
  HourglassTopRounded,
} from "@mui/icons-material";
import { Box, Button, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDocument, formatMinorUnits, formatTransactionDate } from "../format";
import type { TransferResult } from "../types";

type TransferResultViewProps = Readonly<{
  result: TransferResult;
  titleRef: Ref<HTMLHeadingElement>;
  onBackHome: () => void;
  onReview: () => void;
  onNotice: (message: string) => void;
}>;

type ResultItemProps = Readonly<{
  fullWidth?: boolean;
  label: string;
  value: string;
}>;

function ResultItem({ fullWidth = false, label, value }: ResultItemProps) {
  return (
    <Box sx={{ minWidth: 0, display: "grid", gap: 0.25, gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <Typography color="text.secondary" sx={{ fontWeight: 700 }} variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 400, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Box>
  );
}

export function TransferResultView({
  result,
  titleRef,
  onBackHome,
  onReview,
  onNotice,
}: TransferResultViewProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const copyResetTimerRef = useRef<number | null>(null);
  const isCopyingRef = useRef(false);

  useEffect(() => () => {
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
  }, []);

  const transactionDateLabel = useMemo(
    () => result.transactionDate
      ? formatTransactionDate(result.transactionDate)
      : null,
    [result.transactionDate],
  );

  const resultPresentation = result.status === "success"
    ? {
        title: "Transferencia exitosa",
        role: "status" as const,
        icon: CheckCircleOutlineRounded,
        color: "success.main",
      }
    : result.status === "processing"
      ? {
          title: "Transferencia en proceso",
          role: "status" as const,
          icon: HourglassTopRounded,
          color: "primary.main",
        }
      : {
          title: "No pudimos completar la transferencia",
          role: "alert" as const,
          icon: ErrorOutlineRounded,
          color: "error.main",
        };
  const StatusIcon = resultPresentation.icon;

  const copyReference = async () => {
    if (
      !result.bankReference
      || isCopyingRef.current
      || isCopied
      || copyResetTimerRef.current !== null
    ) {
      return;
    }

    isCopyingRef.current = true;
    setCopyError("");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(result.bankReference);
      setIsCopied(true);
      onNotice("Número de referencia copiado");

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        copyResetTimerRef.current = null;
        setIsCopied(false);
      }, 2200);
    } catch {
      setCopyError(
        "No se pudo copiar la referencia. Selecciónala para copiarla manualmente.",
      );
    } finally {
      isCopyingRef.current = false;
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="mobile-payment-result-title"
      sx={{
        minWidth: 0,
        minHeight: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack
        aria-live={result.status === "rejected" ? "assertive" : "polite"}
        role={resultPresentation.role}
        spacing={0.75}
        sx={{
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3.5 },
          py: { xs: 0.75, sm: 2.5 },
          textAlign: "center",
          bgcolor: "transparent",
        }}
      >
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            width: { xs: 66, sm: 72 },
            height: { xs: 66, sm: 72 },
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            color: resultPresentation.color,
            bgcolor: alpha(
              result.status === "success"
                ? theme.palette.success.main
                : result.status === "processing"
                  ? theme.palette.primary.main
                  : theme.palette.error.main,
              0.14,
            ),
          })}
        >
          <StatusIcon sx={{ width: { xs: 39, sm: 42 }, height: { xs: 39, sm: 42 } }} />
        </Box>
        <Typography
          component="h1"
          id="mobile-payment-result-title"
          ref={titleRef}
          tabIndex={-1}
          sx={{
            color: "secondary.main",
            fontSize: { xs: "clamp(1.5rem, 7vw, 1.875rem)", sm: "2.25rem" },
            fontWeight: 700,
            lineHeight: 1.12,
          }}
        >
          {resultPresentation.title}
        </Typography>
      </Stack>

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: { xs: 0.75, sm: 1.5 },
          py: { xs: 0.75, sm: 2.5 },
          px: { xs: 2, sm: 3.5 },
          bgcolor: "transparent",
          overflow: "hidden",
          justifyContent: "flex-start",
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "none", flexShrink: 0 }}>
          <CardContent sx={{ boxSizing: "border-box", p: { xs: 2, sm: "23px" }, "&:last-child": { pb: { xs: 2, sm: "23px" } } }}>
            <Stack spacing={{ xs: 1.75, sm: 2 }}>
              <Stack spacing={0} sx={{ textAlign: "center" }}>
                {result.bankReference ? (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                    <Typography color="text.secondary" variant="body2">Referencia:</Typography>
                    <Typography sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }} variant="body2">
                      {result.bankReference}
                    </Typography>
                    <IconButton aria-label={isCopied ? "Referencia copiada" : "Copiar número de referencia"} onClick={copyReference} size="small" sx={{ width: 28, height: 28, minWidth: 28, minHeight: 28, p: 0.25, color: "primary.main" }} type="button">
                      <ContentCopyRounded fontSize="small" />
                    </IconButton>
                  </Stack>
                ) : (
                  <Typography color="text.secondary" variant="body2">Comprobante de operación</Typography>
                )}
                <Typography color="text.secondary" variant="body2">
                  {transactionDateLabel ? `${transactionDateLabel.date} · ${transactionDateLabel.time}` : "Fecha pendiente de confirmación"}
                </Typography>
                {copyError && <Typography color="error" role="alert" variant="body2">{copyError}</Typography>}
              </Stack>

              <Stack spacing={{ xs: 1.75, sm: 2.25 }}>
                <Typography component="h2" sx={{ color: "secondary.main", fontSize: "1rem", fontWeight: 700 }}>
                  Detalles de la transferencia
                </Typography>
                {result.status === "rejected" && (
                  <Typography color="text.secondary" variant="body2">
                    {result.userMessage ?? "Revisa los datos antes de intentarlo nuevamente."}
                  </Typography>
                )}
                <Box sx={{ display: "grid", gap: 0.25, mb: { xs: 1.75, sm: 2 } }}>
                  <Typography color="text.secondary" variant="body2">Monto transferido</Typography>
                  <Typography variant="h4" sx={{ color: "secondary.main", fontSize: { xs: "2rem", sm: "2.125rem" }, fontWeight: 800, lineHeight: 1.1, overflowWrap: "anywhere" }}>
                    {formatMinorUnits(result.amountMinorUnits)}
                  </Typography>
                </Box>
                <Box component="dl" sx={{ m: 0, display: "grid", gap: { xs: 1.5, sm: 2 } }}>
                  <ResultItem fullWidth label="Beneficiario" value={result.beneficiaryName} />
                  <ResultItem fullWidth label="Cédula" value={formatDocument(result.documentType, result.documentNumber)} />
                  <ResultItem fullWidth label="Teléfono" value={result.phone} />
                  <ResultItem fullWidth label="Banco receptor" value={result.bankName} />
                </Box>
                {result.status === "processing" && (
                  <Stack direction="row" spacing={0.75} sx={(theme) => ({ alignItems: "flex-start", p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08) })}>
                    <HourglassTopRounded aria-hidden="true" color="primary" fontSize="small" />
                    <Typography color="text.secondary" variant="body2">Estamos validando la operación. No realices nuevamente el pago mientras confirmamos el resultado.</Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          sx={{
            flexDirection: "column",
            gap: 1,
            pt: { xs: 0.25, sm: 0.5 },
            pb: 0,
            alignItems: result.status === "rejected" ? "stretch" : "center",
            justifyContent: result.status === "rejected" ? "flex-start" : "center",
            "@media (min-width: 390px)": {
              flexDirection: "row",
            },
          }}
        >
          {result.status === "rejected" && (
            <Button fullWidth onClick={onBackHome} type="button" variant="outlined">
              Volver al inicio
            </Button>
          )}
          {result.status === "rejected" && (
            <Button fullWidth onClick={onReview} type="button" variant="contained">
              Revisar datos
            </Button>
          )}
          {result.status !== "rejected" && (
            <IconButton
              aria-label="Volver al inicio"
              onClick={onBackHome}
              type="button"
              sx={(theme) => ({
                width: 70,
                height: 70,
                bgcolor: theme.palette.primary.main,
                boxShadow: `0 8px 18px ${alpha(theme.palette.primary.main, 0.28)}`,
                color: theme.palette.common.white,
                "&:hover": { bgcolor: theme.palette.primary.dark },
              })}
            >
              <ChevronLeftRounded sx={{ width: 44, height: 44 }} />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
