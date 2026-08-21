"use client";

import { Ref, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleOutlineRounded,
  ContentCopyRounded,
  ErrorOutlineRounded,
  HourglassTopRounded,
} from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  formatBank,
  formatDocument,
  formatMinorUnits,
  formatTransactionDate,
} from "../format";
import type { TransferResult } from "../types";

type TransferResultViewProps = Readonly<{
  result: TransferResult;
  titleRef: Ref<HTMLHeadingElement>;
  onBackHome: () => void;
  onNewPayment: () => void;
  onReview: () => void;
  onNotice: (message: string) => void;
}>;

type ResultItemProps = Readonly<{
  label: string;
  value: string;
}>;

function ResultItem({ label, value }: ResultItemProps) {
  return (
    <Box sx={{ minWidth: 0, display: "grid", gap: 0.25 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Box>
  );
}

export function TransferResultView({
  result,
  titleRef,
  onBackHome,
  onNewPayment,
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
        spacing={1.25}
        sx={(theme) => {
          const statusColor = result.status === "success"
            ? theme.palette.success.main
            : result.status === "processing"
              ? theme.palette.primary.main
              : theme.palette.error.main;

          return {
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 3.5 },
            py: { xs: 2.25, sm: 2.5 },
            textAlign: "center",
            borderTop: "4px solid",
            borderTopColor: statusColor,
            bgcolor: alpha(statusColor, 0.1),
          };
        }}
      >
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            width: { xs: 56, sm: 60 },
            height: { xs: 56, sm: 60 },
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
          <StatusIcon sx={{ width: { xs: 32, sm: 34 }, height: { xs: 32, sm: 34 } }} />
        </Box>
        <Typography
          component="h1"
          id="mobile-payment-result-title"
          ref={titleRef}
          tabIndex={-1}
          sx={{
            color: "secondary.main",
            fontSize: { xs: "clamp(1.875rem, 8vw, 2.125rem)", sm: "2.25rem" },
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
          py: { xs: 2, sm: 2.5 },
          px: { xs: 2.5, sm: 3.5 },
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={2}>
          {result.status === "rejected" && (
            <Typography color="text.secondary">
              {result.userMessage
                ?? "Revisa los datos antes de intentarlo nuevamente."}
            </Typography>
          )}

          {result.bankReference && (
            <Card
              variant="outlined"
              sx={(theme) => ({
                borderColor: alpha(theme.palette.primary.main, 0.32),
                bgcolor: alpha(theme.palette.primary.main, 0.07),
                boxShadow: "none",
              })}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack spacing={0.75}>
                  <Typography color="text.secondary" variant="body2">
                    Número de referencia
                  </Typography>
                  <Stack
                    sx={{
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: 1,
                      "@media (min-width: 360px)": {
                        flexDirection: "row",
                        alignItems: "center",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        minWidth: 0,
                        flex: 1,
                        color: "secondary.main",
                        fontSize: "1.125rem",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        lineHeight: 1.4,
                        overflowWrap: "anywhere",
                        userSelect: "text",
                      }}
                    >
                      {result.bankReference}
                    </Typography>
                    <Button
                      aria-label="Copiar número de referencia"
                      onClick={copyReference}
                      startIcon={<ContentCopyRounded />}
                      sx={{ minHeight: 44, minWidth: 112, alignSelf: "flex-start" }}
                      type="button"
                      variant="text"
                    >
                      {isCopied ? "Copiado" : "Copiar"}
                    </Button>
                  </Stack>
                  {copyError && (
                    <Typography color="error" role="alert" variant="body2">
                      {copyError}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Stack spacing={1.5}>
            <Box sx={{ display: "grid", gap: 0.25 }}>
              <Typography color="text.secondary" variant="body2">
                Monto transferido
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: "secondary.main", fontWeight: 800, overflowWrap: "anywhere" }}
              >
                {formatMinorUnits(result.amountMinorUnits)}
              </Typography>
            </Box>
            <Box
              component="dl"
              sx={{
                m: 0,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <ResultItem label="Beneficiario" value={result.beneficiaryName} />
              {result.status === "success" && (
                <>
                  <ResultItem
                    label="Banco receptor"
                    value={formatBank({ code: result.bankCode, name: result.bankName })}
                  />
                  <ResultItem
                    label="Cédula"
                    value={formatDocument(result.documentType, result.documentNumber)}
                  />
                  <ResultItem label="Teléfono" value={result.phone} />
                </>
              )}
              {transactionDateLabel && (
                <Box sx={{ minWidth: 0, display: "grid", gap: 0.25 }}>
                <Typography color="text.secondary" variant="body2">
                  Fecha y hora
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    m: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    columnGap: 0.5,
                    fontWeight: 700,
                  }}
                >
                  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                    {transactionDateLabel.date}
                  </Box>
                  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                    · {transactionDateLabel.time}
                  </Box>
                </Typography>
                </Box>
              )}
            </Box>
          </Stack>

          {result.status === "processing" && (
            <Stack
              direction="row"
              spacing={1}
              sx={(theme) => ({
                alignItems: "flex-start",
                p: 1.5,
                borderRadius: 2,
                color: "text.primary",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              })}
            >
              <HourglassTopRounded aria-hidden="true" color="primary" />
              <Typography>
                Estamos validando la operación. No realices nuevamente el pago
                mientras confirmamos el resultado.
              </Typography>
            </Stack>
          )}
        </Stack>

        <Stack
          sx={{
            flexDirection: "column",
            gap: 1,
            pt: 2,
            pb: "calc(4px + env(safe-area-inset-bottom))",
            "@media (min-width: 390px)": {
              flexDirection: "row",
            },
          }}
        >
          {result.status === "success" && (
            <Button fullWidth onClick={onNewPayment} type="button" variant="outlined">
              Realizar otro pago
            </Button>
          )}
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
            <Button fullWidth onClick={onBackHome} type="button" variant="contained">
              Volver al inicio
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
