"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBackRounded,
  BadgeRounded,
  SecurityRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { darken } from "@mui/material/styles";

import { registrationSubmittedUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import { PreLoginIconBadge } from "../shared/components/PreLoginIconBadge";
import { ConfirmationStep } from "./components/ConfirmationStep";
import { ContactSecurityStep } from "./components/ContactSecurityStep";
import { IdentificationStep } from "./components/IdentificationStep";
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
  RegistrationUiField,
} from "./types";
import {
  composeNationalPhone,
  emptyRegistrationPhone,
  isContactStepValid,
  isIdentificationStepValid,
  type RegistrationPhoneParts,
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
  icon: typeof BadgeRounded;
}>[] = [
  {
    title: "Cuéntanos quién eres",
    description: "Necesitamos estos datos para identificarte y preparar el acceso a tu línea de crédito.",
    icon: BadgeRounded,
  },
  {
    title: "Protege tu cuenta",
    description: "Indica cómo podemos contactarte y crea una contraseña segura para proteger tu información.",
    icon: SecurityRounded,
  },
  {
    title: "Revisa y confirma",
    description: "Verifica que tus datos estén correctos antes de crear tu cuenta.",
    icon: VerifiedUserRounded,
  },
];

const identificationFields: RegistrationField[] = [
  "nationality",
  "documentNumber",
  "firstName",
  "lastName",
];
const contactFields: RegistrationUiField[] = [
  "phoneOperatorCode",
  "phoneLocalNumber",
  "email",
  "password",
  "passwordConfirmation",
];
const allFields: RegistrationUiField[] = [...identificationFields, ...contactFields];

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
  const [phoneParts, setPhoneParts] = useState<RegistrationPhoneParts>(emptyRegistrationPhone);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nationalityRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneOperatorCodeRef = useRef<HTMLInputElement>(null);
  const phoneLocalNumberRef = useRef<HTMLInputElement>(null);
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
    phoneOperatorCode: phoneOperatorCodeRef,
    phoneLocalNumber: phoneLocalNumberRef,
    email: emailRef,
    password: passwordRef,
    passwordConfirmation: confirmationRef,
  };

  const isSubmitting = flowState.name === "submitting";
  const step = getStepIndex(flowState);
  const currentContent = stepContent[step];
  const canContinueCurrentStep =
    step === 0 ? isIdentificationStepValid(data) : isContactStepValid(data, phoneParts);

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

  const updateField = (field: keyof RegistrationData, value: string) => {
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

  const updatePhoneParts = (nextPhoneParts: RegistrationPhoneParts) => {
    if (isSubmitting) return;

    setPhoneParts(nextPhoneParts);
    setData((current) => ({
      ...current,
      phone: composeNationalPhone(nextPhoneParts),
    }));
    setErrors((current) => ({
      ...current,
      phone: undefined,
      phoneOperatorCode:
        nextPhoneParts.operatorCode === phoneParts.operatorCode
          ? current.phoneOperatorCode
          : undefined,
      phoneLocalNumber:
        nextPhoneParts.localNumber === phoneParts.localNumber
          ? current.phoneLocalNumber
          : undefined,
    }));
    setSubmissionError("");
  };

  const focusFirstError = (nextErrors: RegistrationErrors, fields: RegistrationUiField[]) => {
    const firstInvalid = fields.find((field) => nextErrors[field]);
    if (firstInvalid) inputRefs[firstInvalid]?.current?.focus();
  };

  const validateFieldOnBlur = (field: RegistrationUiField) => {
    if (isSubmitting) return;

    setErrors((current) => ({
      ...current,
      [field]: validateRegistrationField(field, data, phoneParts),
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
      const nextErrors = validateContact(data, phoneParts);
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
      ...validateContact(data, phoneParts),
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
      setPhoneParts(emptyRegistrationPhone);
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
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: themeTokens.color.preLoginBackground,
        overflowX: "hidden",
      }}
    >
      <Stack
        component="header"
        direction="row"
        sx={{
          width: "100%",
          maxWidth: 520,
          minHeight: 48,
          mx: "auto",
          alignItems: "center",
          justifyContent: "space-between",
          pt: "calc(12px + env(safe-area-inset-top))",
          pr: "calc(16px + env(safe-area-inset-right))",
          pl: "calc(16px + env(safe-area-inset-left))",
        }}
      >
        <IconButton
          aria-label="Volver a la pantalla de acceso"
          component={Link}
          href="/"
          sx={{ color: themeTokens.color.preLoginNavy }}
        >
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
          maxWidth: 520,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          pt: "clamp(4px, 3dvh, 32px)",
        }}
      >
        <Stack
          sx={{
            alignItems: "center",
            textAlign: "center",
            px: 3,
            pb: 3,
          }}
        >
          <Box sx={{ "@media (max-height: 700px)": { transform: "scale(0.73)" } }}>
            <PreLoginIconBadge icon={currentContent.icon} />
          </Box>
          <Typography
            component="h1"
            ref={titleRef}
            tabIndex={-1}
            sx={{
              mt: "24px",
              color: themeTokens.color.preLoginNavy,
              fontSize: "clamp(1.5rem, 7vw, 2rem)",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {currentContent.title}
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              maxWidth: 360,
              color: themeTokens.color.preLoginNavy,
              fontSize: "1rem",
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {currentContent.description}
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: themeTokens.color.paper,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            pt: 3,
            pb: "calc(24px + env(safe-area-inset-bottom))",
            pr: "calc(19px + env(safe-area-inset-right))",
            pl: "calc(19px + env(safe-area-inset-left))",
          }}
        >
          <Stack spacing={1}>
            <Typography
              id="registration-progress-label"
              sx={{ color: themeTokens.color.preLoginMuted, fontSize: "0.8125rem" }}
            >
              Paso {step + 1} de 3
            </Typography>
            <LinearProgress
              aria-labelledby="registration-progress-label"
              value={((step + 1) / 3) * 100}
              variant="determinate"
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: "rgba(70, 55, 245, 0.15)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  bgcolor: themeTokens.color.preLoginPrimary,
                },
              }}
            />
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
                onPhonePartsChange={updatePhoneParts}
                phoneParts={phoneParts}
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
              <Alert role="alert" severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {submissionError}
              </Alert>
            )}

            <Stack spacing={1.5} sx={{ mt: 3, pt: 3 }}>
              <Button
                disabled={
                  isSubmitting ||
                  (step < 2 && !canContinueCurrentStep) ||
                  (step === 2 && !termsAccepted)
                }
                fullWidth
                loading={isSubmitting}
                sx={{
                  minHeight: 50,
                  borderRadius: "999px",
                  fontWeight: 400,
                  bgcolor: themeTokens.color.preLoginPrimary,
                  "&:hover": { bgcolor: darken(themeTokens.color.preLoginPrimary, 0.12) },
                  "&:active": { bgcolor: darken(themeTokens.color.preLoginPrimary, 0.2) },
                  "&:focus-visible": {
                    outline: `3px solid ${themeTokens.color.preLoginPrimary}`,
                    outlineOffset: 2,
                  },
                }}
                type="submit"
                variant="contained"
              >
                {step < 2 ? "Continuar" : "Crear cuenta"}
              </Button>
              {step > 0 && (
                <Button
                  disabled={isSubmitting}
                  fullWidth
                  onClick={goBack}
                  type="button"
                  variant="text"
                  sx={{
                    minHeight: 44,
                    color: themeTokens.color.preLoginNavy,
                    fontWeight: 500,
                    "&:focus-visible": {
                      outline: `3px solid ${themeTokens.color.preLoginPrimary}`,
                    },
                  }}
                >
                  Atrás
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
