import { Button, Stack, TextField, Typography } from "@mui/material";

type RecoveryCodeStepProps = Readonly<{
  code: string;
  countdownLabel: string;
  destinationLabel: string;
  error: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isUnavailable: boolean;
  requestStatus: string;
  resendMessage: string;
  onChange: (value: string) => void;
  onResend: () => void;
}>;

export function RecoveryCodeStep({
  code,
  countdownLabel,
  destinationLabel,
  error,
  inputRef,
  isUnavailable,
  requestStatus,
  resendMessage,
  onChange,
  onResend,
}: RecoveryCodeStepProps) {
  return (
    <Stack spacing={2}>
      <Typography color="text.secondary" role="status" variant="body2">
        {requestStatus}
      </Typography>
      <Typography
        aria-label={`Código enviado a ${destinationLabel}`}
        sx={{ color: "secondary.main", fontWeight: 700 }}
      >
        {destinationLabel}
      </Typography>
      <TextField
        autoComplete="one-time-code"
        disabled={isUnavailable}
        error={Boolean(error)}
        fullWidth
        helperText={error}
        inputRef={inputRef}
        label="Código de validación"
        name="code"
        onChange={(event) => onChange(event.target.value)}
        required
        slotProps={{
          formHelperText: { role: "alert" },
          htmlInput: { inputMode: "numeric", maxLength: 6 },
        }}
        value={code}
      />
      <Typography
        aria-label={`Vigencia del código: ${countdownLabel}`}
        color="text.secondary"
        variant="body2"
      >
        {countdownLabel}
      </Typography>
      <Button
        onClick={onResend}
        sx={{ alignSelf: "flex-start" }}
        type="button"
        variant="text"
      >
        Reenviar código
      </Button>
      <Typography
        aria-live="polite"
        color="text.secondary"
        role="status"
        sx={{ minHeight: "1.5em" }}
        variant="body2"
      >
        {resendMessage || "\u00a0"}
      </Typography>
    </Stack>
  );
}
