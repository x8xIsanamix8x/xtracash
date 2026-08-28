import { InfoOutlined } from "@mui/icons-material";
import { Alert, MenuItem, Stack, TextField, Typography } from "@mui/material";

import type { RegistrationData, RegistrationErrors, RegistrationInputRefs } from "../types";

const nationalityLabels = {
  V: "Venezolano",
  E: "Extranjero",
} as const;

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
        error={Boolean(errors.nationality)}
        fullWidth
        helperText={errors.nationality}
        inputRef={inputRefs.nationality}
        label="Nacionalidad"
        name="nationality"
        onChange={(event) => onChange("nationality", event.target.value)}
        required
        select
        slotProps={{
          formHelperText: errors.nationality ? { role: "alert" } : undefined,
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (value) =>
              value === "V" || value === "E"
                ? nationalityLabels[value]
                : (
                    <Typography color="text.secondary" component="span">
                      Selecciona una opción
                    </Typography>
                  ),
          },
        }}
        value={data.nationality}
      >
        <MenuItem value="V">Venezolano</MenuItem>
        <MenuItem value="E">Extranjero</MenuItem>
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
        slotProps={{
          formHelperText: errors.documentNumber ? { role: "alert" } : undefined,
          htmlInput: { inputMode: "numeric", maxLength: 8 },
        }}
        value={data.documentNumber}
      />
      <Typography color="text.secondary" id="registration-name-guidance" variant="body2">
        Escríbelos como aparecen en tu documento de identidad.
      </Typography>
      <TextField
        autoComplete="given-name"
        error={Boolean(errors.firstName)}
        fullWidth
        helperText={errors.firstName}
        inputRef={inputRefs.firstName}
        label="Nombres"
        name="firstName"
        onChange={(event) => onChange("firstName", event.target.value)}
        required
        slotProps={{
          formHelperText: errors.firstName ? { role: "alert" } : undefined,
          htmlInput: {
            "aria-describedby": errors.firstName ? undefined : "registration-name-guidance",
            autoCapitalize: "words",
            inputMode: "text",
            spellCheck: false,
          },
        }}
        value={data.firstName}
      />
      <TextField
        autoComplete="family-name"
        error={Boolean(errors.lastName)}
        fullWidth
        helperText={errors.lastName}
        inputRef={inputRefs.lastName}
        label="Apellidos"
        name="lastName"
        onChange={(event) => onChange("lastName", event.target.value)}
        required
        slotProps={{
          formHelperText: errors.lastName ? { role: "alert" } : undefined,
          htmlInput: {
            "aria-describedby": errors.lastName ? undefined : "registration-name-guidance",
            autoCapitalize: "words",
            inputMode: "text",
            spellCheck: false,
          },
        }}
        value={data.lastName}
      />
      <Alert icon={<InfoOutlined />} severity="info">
        Tus datos se utilizarán únicamente para validar tu registro.
      </Alert>
    </Stack>
  );
}
