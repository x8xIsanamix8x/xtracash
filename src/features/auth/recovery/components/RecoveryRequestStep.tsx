import { TextField } from "@mui/material";

import { RECOVERY_IDENTIFIER_MAX_LENGTH } from "../validation";

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
      spellCheck={false}
      slotProps={{
        formHelperText: { role: "alert" },
        htmlInput: {
          autoCapitalize: "none",
          inputMode: "email",
          maxLength: RECOVERY_IDENTIFIER_MAX_LENGTH,
        },
      }}
      type="email"
      value={identifier}
    />
  );
}
