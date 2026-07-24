import { Stack, TextField, Typography } from "@mui/material";

type RecoveryRequestStepProps = Readonly<{
  fieldError: string;
  generalError: string;
  identifier: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  statusMessage: string;
  onChange: (value: string) => void;
}>;

export function RecoveryRequestStep({
  fieldError,
  generalError,
  identifier,
  inputRef,
  statusMessage,
  onChange,
}: RecoveryRequestStepProps) {
  return (
    <Stack spacing={2}>
      <TextField
        autoComplete="username"
        error={Boolean(fieldError)}
        fullWidth
        helperText={fieldError}
        inputRef={inputRef}
        label="Correo o teléfono"
        name="identifier"
        onChange={(event) => onChange(event.target.value)}
        required
        slotProps={{ formHelperText: { role: "alert" } }}
        type="text"
        value={identifier}
      />
      {generalError && (
        <Typography color="error" role="alert" variant="body2">
          {generalError}
        </Typography>
      )}
      <Typography
        aria-live="polite"
        color="text.secondary"
        role="status"
        sx={{ minHeight: "1.5em" }}
        variant="body2"
      >
        {statusMessage || "\u00a0"}
      </Typography>
    </Stack>
  );
}
