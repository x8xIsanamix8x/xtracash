"use client";

import type { Ref } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccountBalanceRounded,
  ContentCopyRounded,
  DoneRounded,
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

import { createCopyAllText, createPaymentDetails } from "../presentation";
import type { PaymentDetailKey } from "../types";
import { PaymentReportStepLayout } from "./PaymentReportStepLayout";

type CopyTarget = PaymentDetailKey | "all";

type PaymentInstructionsStepProps = Readonly<{
  amountBs: string;
  titleRef: Ref<HTMLHeadingElement>;
  onNotice: (message: string) => void;
  onNext: () => void;
}>;

export function PaymentInstructionsStep({
  amountBs,
  titleRef,
  onNotice,
  onNext,
}: PaymentInstructionsStepProps) {
  const details = useMemo(() => createPaymentDetails(amountBs), [amountBs]);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);
  const [copyError, setCopyError] = useState("");
  const copyTimerRef = useRef<number | null>(null);
  const isCopyingRef = useRef(false);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
  }, []);

  const copyValue = async (
    target: CopyTarget,
    value: string,
    successMessage: string,
  ) => {
    if (isCopyingRef.current) return;

    isCopyingRef.current = true;
    setCopyError("");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(value);
      setCopiedTarget(target);
      onNotice(successMessage);

      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null;
        setCopiedTarget(null);
      }, 2200);
    } catch {
      setCopyError(
        "No pudimos copiar el dato. Puedes seleccionarlo y copiarlo manualmente.",
      );
    } finally {
      isCopyingRef.current = false;
    }
  };

  return (
    <PaymentReportStepLayout
      actions={(
        <Button fullWidth onClick={onNext} type="button" variant="contained">
          Siguiente
        </Button>
      )}
      description="Realiza el Pago Móvil con estos datos"
      title="Paga a Impulsa"
      titleId="payment-report-instructions-title"
      titleRef={titleRef}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <AccountBalanceRounded aria-hidden="true" color="primary" />
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            Datos para el Pago Móvil
          </Typography>
        </Stack>

        <Card variant="outlined" sx={{ boxShadow: "none" }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
            <Stack spacing={1.25}>
              {details.map((detail) => (
                <Stack
                  key={detail.key}
                  direction="row"
                  spacing={1.5}
                  useFlexGap
                  sx={(theme) => ({
                    minWidth: 0,
                    alignItems: "center",
                    flexWrap: "wrap",
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.055),
                  })}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography color="text.secondary" variant="body2">
                      {detail.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: "secondary.main",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                        userSelect: "text",
                      }}
                    >
                      {detail.displayValue}
                    </Typography>
                  </Box>
                  <Button
                    aria-label={`Copiar ${detail.label.toLocaleLowerCase("es")}`}
                    onClick={() => void copyValue(
                      detail.key,
                      detail.copyValue,
                      `${detail.label} copiado`,
                    )}
                    startIcon={copiedTarget === detail.key
                      ? <DoneRounded />
                      : <ContentCopyRounded />}
                    sx={{
                      minWidth: 104,
                      minHeight: 44,
                      flexShrink: 0,
                      ml: "auto",
                    }}
                    type="button"
                    variant="text"
                  >
                    {copiedTarget === detail.key ? "Copiado" : "Copiar"}
                  </Button>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Button
          fullWidth
          onClick={() => void copyValue(
            "all",
            createCopyAllText(details),
            "Datos de pago copiados",
          )}
          startIcon={copiedTarget === "all"
            ? <DoneRounded />
            : <ContentCopyRounded />}
          type="button"
          variant="outlined"
        >
          {copiedTarget === "all" ? "Datos copiados" : "Copiar todos"}
        </Button>

        {copyError && (
          <Typography color="error" role="alert" variant="body2">
            {copyError}
          </Typography>
        )}
      </Stack>
    </PaymentReportStepLayout>
  );
}
