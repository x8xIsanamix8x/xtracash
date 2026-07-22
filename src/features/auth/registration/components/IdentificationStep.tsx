import { MenuItem, Stack, TextField } from "@mui/material";

import type {
  Nationality,
  RegistrationData,
  RegistrationErrors,
  RegistrationInputRefs,
} from "../types";

type IdentificationStepProps = Readonly<{
  data: RegistrationData;
  errors: RegistrationErrors;
  inputRefs: RegistrationInputRefs;
  onChange: (field: keyof RegistrationData, value: string) => void;
}>;

export function IdentificationStep({ data, errors, inputRefs, onChange }: IdentificationStepProps) {
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
        onChange={(event) => onChange("documentNumber", event.target.value)}
        required
        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
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
        onChange={(event) => onChange("firstName", event.target.value)}
        required
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
        onChange={(event) => onChange("lastName", event.target.value)}
        required
        value={data.lastName}
      />
    </Stack>
  );
}
