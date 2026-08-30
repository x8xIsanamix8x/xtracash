"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import {
  AttachFileRounded,
  DeleteOutlineRounded,
  ImageOutlined,
  PictureAsPdfOutlined,
} from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  formatPaymentSupportSize,
  getPaymentSupportKindFromName,
  PAYMENT_SUPPORT_ACCEPT,
  sanitizePaymentSupportDisplayName,
} from "../paymentSupport";

type PaymentSupportFieldProps = Readonly<{
  error?: string;
  file: File | null;
  focusError: boolean;
  focusRequest: number;
  onRemove: () => void;
  onSelect: (file: File) => void;
}>;

const fieldId = "payment-report-support";
const descriptionId = `${fieldId}-description`;
const errorId = `${fieldId}-error`;

export function PaymentSupportField({
  error,
  file,
  focusError,
  focusRequest,
  onRemove,
  onSelect,
}: PaymentSupportFieldProps) {
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error && focusError) errorRef.current?.focus();
  }, [error, focusError, focusRequest]);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (nextFile) onSelect(nextFile);
  };

  const fileInput = (
    <input
      accept={PAYMENT_SUPPORT_ACCEPT}
      hidden
      onChange={selectFile}
      type="file"
    />
  );

  const isPdf = file
    ? getPaymentSupportKindFromName(file.name) === "pdf"
    : false;

  return (
    <Box
      aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
      aria-labelledby={`${fieldId}-title`}
      role="group"
    >
      <Stack spacing={0.5}>
        <Typography id={`${fieldId}-title`} sx={{ fontWeight: 700 }}>
          Comprobante de pago (opcional)
        </Typography>
        <Typography color="text.secondary" id={descriptionId} variant="body2">
          JPG, PNG o PDF · Máx. 5 MB
        </Typography>
      </Stack>

      {file ? (
        <Stack
          spacing={1.25}
          sx={(theme) => ({
            minWidth: 0,
            mt: 1.5,
            p: 1.5,
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.18),
            borderRadius: 2,
            bgcolor: "background.paper",
          })}
        >
          <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: "center" }}>
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 1.5,
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.09),
              })}
            >
              {isPdf ? <PictureAsPdfOutlined /> : <ImageOutlined />}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                title={sanitizePaymentSupportDisplayName(file.name)}
                sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
                variant="body2"
              >
                {sanitizePaymentSupportDisplayName(file.name)}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {formatPaymentSupportSize(file.size)}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{ alignItems: "center", justifyContent: "flex-end" }}
          >
            <Button
              component="label"
              size="small"
              sx={{ minHeight: 44 }}
              variant="text"
            >
              Reemplazar
              {fileInput}
            </Button>
            <IconButton
              aria-label={`Eliminar ${sanitizePaymentSupportDisplayName(file.name)}`}
              color="error"
              onClick={onRemove}
              sx={{ minWidth: 44, minHeight: 44 }}
              type="button"
            >
              <DeleteOutlineRounded />
            </IconButton>
          </Stack>
        </Stack>
      ) : (
        <Button
          component="label"
          startIcon={<AttachFileRounded />}
          sx={{ minHeight: 48, mt: 1.5 }}
          variant="outlined"
        >
          Adjuntar comprobante
          {fileInput}
        </Button>
      )}

      {error && (
        <Typography
          color="error"
          id={errorId}
          ref={errorRef}
          role="alert"
          sx={{ mt: 1 }}
          tabIndex={-1}
          variant="body2"
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
