import { TextField } from "@mui/material";

type RecoveryRequestStepProps = Readonly<{
  disabled: boolean;
  error: string;
  identifier: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
}>;

export function RecoveryRequestStep({
  disabled,
  error,
  identifier,
  inputRef,
  onChange,
}: RecoveryRequestStepProps) {
  return (
    <TextField
      autoComplete="email"
      disabled={disabled}
      error={Boolean(error)}
      fullWidth
      helperText={error}
      inputRef={inputRef}
      label="Correo electrónico"
      name="identifier"
      onChange={(event) => onChange(event.target.value)}
      required
      slotProps={{
        formHelperText: { role: "alert" },
        htmlInput: { inputMode: "email" },
      }}
      type="email"
      value={identifier}
    />
  );
}
