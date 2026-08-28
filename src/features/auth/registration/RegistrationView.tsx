"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBackRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { registrationSubmittedUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import { ConfirmationStep } from "./components/ConfirmationStep";
import { ContactSecurityStep } from "./components/ContactSecurityStep";
import { IdentificationStep } from "./components/IdentificationStep";
import {
  RegistrationStepVisual,
  type RegistrationVisualKey,
} from "./components/RegistrationStepVisual";
import {
  createRegistrationRequest,
  registerUser,
  RegistrationServiceError,
} from "./services/registration";
import type {
  RegistrationData,
  RegistrationErrors,
  RegistrationField,
  RegistrationFlowState,
  RegistrationInputRefs,
} from "./types";
import {
  isContactStepValid,
  isIdentificationStepValid,
  validateContact,
  validateIdentification,
  validateRegistrationField,
} from "./validation";

const initialData: RegistrationData = {
  nationality: "",
  documentNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

const stepContent: readonly Readonly<{
  title: string;
  description: string;
  visualKey: RegistrationVisualKey;
}>[] = [
  {
    title: "Cuéntanos quién eres",
    description: "Necesitamos estos datos para identificarte y preparar el acceso a tu línea de crédito.",
    visualKey: "identity",
  },
  {
    title: "Protege tu cuenta",
    description: "Indica cómo podemos contactarte y crea una contraseña segura para proteger tu información.",
    visualKey: "security",
  },
  {
    title: "Revisa y confirma",
    description: "Verifica que tus datos estén correctos antes de crear tu cuenta.",
    visualKey: "confirmation",
  },
];

const identificationFields: RegistrationField[] = [
  "nationality",
  "documentNumber",
  "firstName",
  "lastName",
];
const contactFields: RegistrationField[] = ["phone", "email", "password", "passwordConfirmation"];
const allFields: RegistrationField[] = [...identificationFields, ...contactFields];

function getRegistrationErrorMessage(error: unknown): string {
  if (!(error instanceof RegistrationServiceError)) {
    return "No pudimos completar el registro en este momento. Inténtalo nuevamente.";
  }

  if (error.type === "network") {
    return "No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.";
  }

  if (error.type === "http") {
    return "No pudimos completar el registro. Inténtalo nuevamente más tarde.";
  }

  return "El registro no está disponible en este momento. Inténtalo nuevamente más tarde.";
}

function getStepIndex(flowState: RegistrationFlowState): number {
  if (flowState.name === "identification") return 0;
  if (flowState.name === "contactSecurity") return 1;
  return 2;
}

export function RegistrationView() {
  const router = useRouter();
  const [flowState, setFlowState] = useState<RegistrationFlowState>({ name: "identification" });
  const [data, setData] = useState<RegistrationData>(initialData);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nationalityRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const submissionRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const inputRefs: RegistrationInputRefs = {
    nationality: nationalityRef,
    documentNumber: documentRef,
    firstName: firstNameRef,
    lastName: lastNameRef,
    phone: phoneRef,
    email: emailRef,
    password: passwordRef,
    passwordConfirmation: confirmationRef,
  };

  const isSubmitting = flowState.name === "submitting";
  const step = getStepIndex(flowState);
  const currentContent = stepContent[step];
  const canContinueCurrentStep =
    step === 0 ? isIdentificationStepValid(data) : isContactStepValid(data);

  useEffect(() => {
    if (flowState.name !== "submitting") {
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [flowState.name]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const updateField = (field: RegistrationField, value: string) => {
    if (isSubmitting) return;

    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmissionError("");

    if (field === "password" && data.passwordConfirmation) {
      setErrors((current) => ({
        ...current,
        passwordConfirmation:
          data.passwordConfirmation === value ? undefined : "Las contraseñas no coinciden.",
      }));
    }
  };

  const focusFirstError = (nextErrors: RegistrationErrors, fields: RegistrationField[]) => {
    const firstInvalid = fields.find((field) => nextErrors[field]);
    if (firstInvalid) inputRefs[firstInvalid]?.current?.focus();
  };

  const validateFieldOnBlur = (field: RegistrationField) => {
    if (isSubmitting) return;

    setErrors((current) => ({
      ...current,
      [field]: validateRegistrationField(field, data),
    }));
  };

  const submitStep = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (flowState.name === "identification") {
      const nextErrors = validateIdentification(data);
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        focusFirstError(nextErrors, identificationFields);
        return;
      }

      setSubmissionError("");
      setFlowState({ name: "contactSecurity" });
      return;
    }

    if (flowState.name === "contactSecurity") {
      const nextErrors = validateContact(data);
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        focusFirstError(nextErrors, contactFields);
        return;
      }

      setSubmissionError("");
      setFlowState({ name: "review" });
    }
  };

  const goBack = () => {
    if (isSubmitting) return;

    setErrors({});
    setSubmissionError("");

    if (flowState.name === "review") {
      setFlowState({ name: "contactSecurity" });
    } else if (flowState.name === "contactSecurity") {
      setFlowState({ name: "identification" });
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submissionRef.current || flowState.name !== "review") return;

    const nextErrors = {
      ...validateIdentification(data),
      ...validateContact(data),
    };
    setErrors(nextErrors);
    setSubmissionError("");

    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors, allFields);
      return;
    }

    if (!termsAccepted) {
      setSubmissionError("Debes aceptar los términos y condiciones antes de crear tu cuenta.");
      return;
    }

    const request = createRegistrationRequest(data, termsAccepted);
    const controller = new AbortController();
    submissionRef.current = true;
    abortControllerRef.current = controller;
    setFlowState({ name: "submitting" });

    try {
      await registerUser(request, controller.signal);

      if (!isMountedRef.current) return;

      setData(initialData);
      setErrors({});
      setTermsAccepted(false);
      setSubmissionError("");
      setFlowState({ name: "identification" });
      router.replace(registrationSubmittedUrl);
    } catch (error) {
      if (!isMountedRef.current) return;

      setFlowState({ name: "review" });

      if (error instanceof RegistrationServiceError && error.type === "aborted") {
        return;
      }

      setSubmissionError(getRegistrationErrorMessage(error));
    } finally {
      submissionRef.current = false;
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Container
        maxWidth={false}
        sx={{
          width: "100%",
          maxWidth: 1120,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          py: "calc(16px + env(safe-area-inset-top))",
          pb: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <Stack direction="row" sx={{ minHeight: 48, alignItems: "center", justifyContent: "space-between" }}>
          <IconButton aria-label="Volver a la pantalla de acceso" component={Link} href="/">
            <ArrowBackRounded />
          </IconButton>
          <Typography sx={{ color: themeTokens.color.brandLogo, fontWeight: 800 }}>
            Impúlsate Móvil
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            py: { xs: 2, sm: 4 },
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              flex: "0 0 auto",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 38fr) minmax(0, 62fr)" },
              my: { xs: 0, sm: "auto" },
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                minWidth: 0,
                overflow: "hidden",
                bgcolor: "background.default",
                borderBottom: { xs: "1px solid", lg: 0 },
                borderRight: { xs: 0, lg: "1px solid" },
                borderColor: "divider",
              }}
            >
              <RegistrationStepVisual visualKey={currentContent.visualKey} />
            </Box>

            <Box
              sx={{
                display: "flex",
                width: "100%",
                maxWidth: { xs: 680, lg: "none" },
                minWidth: 0,
                mx: "auto",
                flexDirection: "column",
                p: { xs: 2, sm: 3, lg: 4 },
              }}
            >
              <Stack spacing={1}>
                <Typography color="text.secondary" id="registration-progress-label" variant="body2">
                  Paso {step + 1} de 3
                </Typography>
                <LinearProgress
                  aria-labelledby="registration-progress-label"
                  value={((step + 1) / 3) * 100}
                  variant="determinate"
                />
                <Typography
                  component="h1"
                  ref={titleRef}
                  tabIndex={-1}
                  variant="h4"
                  sx={{ pt: 1, color: "secondary.main", fontWeight: 700 }}
                >
                  {currentContent.title}
                </Typography>
                <Typography color="text.secondary">{currentContent.description}</Typography>
              </Stack>

              <Box
                aria-busy={isSubmitting}
                component="form"
                noValidate
                onSubmit={
                  flowState.name === "identification" || flowState.name === "contactSecurity"
                    ? submitStep
                    : submitRegistration
                }
                sx={{ flex: 1, display: "flex", flexDirection: "column", pt: 3 }}
              >
                {flowState.name === "identification" && (
                  <IdentificationStep
                    data={data}
                    errors={errors}
                    inputRefs={inputRefs}
                    onChange={updateField}
                    onFieldBlur={validateFieldOnBlur}
                  />
                )}
                {flowState.name === "contactSecurity" && (
                  <ContactSecurityStep
                    data={data}
                    errors={errors}
                    inputRefs={inputRefs}
                    onChange={updateField}
                    onFieldBlur={validateFieldOnBlur}
                  />
                )}
                {(flowState.name === "review" || flowState.name === "submitting") && (
                  <ConfirmationStep
                    data={data}
                    isSubmitting={isSubmitting}
                    onTermsChange={(checked) => {
                      setTermsAccepted(checked);
                      setSubmissionError("");
                    }}
                    termsAccepted={termsAccepted}
                  />
                )}

                {submissionError && (
                  <Alert role="alert" severity="error" sx={{ mt: 2 }}>
                    {submissionError}
                  </Alert>
                )}

                <Stack
                  direction={{ xs: "column-reverse", sm: "row" }}
                  spacing={1.5}
                  sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
                >
                  {step > 0 && (
                    <Button disabled={isSubmitting} fullWidth onClick={goBack} type="button" variant="outlined">
                      Atrás
                    </Button>
                  )}
                  <Button
                    disabled={
                      isSubmitting ||
                      (step < 2 && !canContinueCurrentStep) ||
                      (step === 2 && !termsAccepted)
                    }
                    fullWidth
                    loading={isSubmitting}
                    type="submit"
                    variant="contained"
                  >
                    {step < 2 ? "Continuar" : "Crear cuenta"}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
