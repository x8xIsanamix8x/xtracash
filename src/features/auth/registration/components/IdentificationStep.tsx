import { InfoOutlined } from "@mui/icons-material";
import { Alert, MenuItem, Stack, TextField } from "@mui/material";

import type {
  Nationality,
  RegistrationData,
  RegistrationErrors,
  RegistrationInputRefs,
} from "../types";
import { DOCUMENT_MAX_LENGTH, keepAsciiDigits } from "../validation";

type IdentificationStepProps = Readonly<{
  data: RegistrationData;
  errors: RegistrationErrors;
  inputRefs: RegistrationInputRefs;
  onChange: (field: keyof RegistrationData, value: string) => void;
  onFieldBlur: (field: keyof RegistrationData) => void;
}>;

export function IdentificationStep({
  data,
  errors,
  inputRefs,
  onChange,
  onFieldBlur,
}: IdentificationStepProps) {
  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label="Nacionalidad"
        name="nationality"
        onChange={(event) => onChange("nationality", event.target.value as Nationality)}
        select
        value={data.nationality}
      >
        <MenuItem value="V">V</MenuItem>
        <MenuItem value="E">E</MenuItem>
      </TextField>
      <TextField
        autoComplete="off"
        error={Boolean(errors.documentNumber)}
        fullWidth
        helperText={errors.documentNumber}
        inputRef={inputRefs.documentNumber}
        label="Número de cédula"
        name="documentNumber"
        onBlur={() => onFieldBlur("documentNumber")}
        onChange={(event) =>
          onChange(
            "documentNumber",
            keepAsciiDigits(event.target.value, DOCUMENT_MAX_LENGTH),
          )
        }
        required
        slotProps={{
          formHelperText: errors.documentNumber ? { role: "alert" } : undefined,
          htmlInput: { inputMode: "numeric", maxLength: DOCUMENT_MAX_LENGTH },
        }}
        value={data.documentNumber}
      />
      <TextField
        autoComplete="given-name"
        error={Boolean(errors.firstName)}
        fullWidth
        helperText={errors.firstName}
        inputRef={inputRefs.firstName}
        label="Nombre"
        name="firstName"
        onBlur={() => onFieldBlur("firstName")}
        onChange={(event) => onChange("firstName", event.target.value)}
        required
        slotProps={{
          formHelperText: errors.firstName ? { role: "alert" } : undefined,
          htmlInput: { autoCapitalize: "words", inputMode: "text", spellCheck: false },
        }}
        value={data.firstName}
      />
      <TextField
        autoComplete="family-name"
        error={Boolean(errors.lastName)}
        fullWidth
        helperText={errors.lastName}
        inputRef={inputRefs.lastName}
        label="Apellido"
        name="lastName"
        onBlur={() => onFieldBlur("lastName")}
        onChange={(event) => onChange("lastName", event.target.value)}
        required
        slotProps={{
          formHelperText: errors.lastName ? { role: "alert" } : undefined,
          htmlInput: { autoCapitalize: "words", inputMode: "text", spellCheck: false },
        }}
        value={data.lastName}
      />
      <Alert icon={<InfoOutlined />} severity="info">
        Tus datos se utilizarán únicamente para validar tu registro.
      </Alert>
    </Stack>
  );
}
