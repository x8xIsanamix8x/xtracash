"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowBackRounded, CheckCircleRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import { ConfirmationStep } from "./components/ConfirmationStep";
import { ContactSecurityStep } from "./components/ContactSecurityStep";
import { IdentificationStep } from "./components/IdentificationStep";
import { registrationMock } from "./mocks/registration";
import type {
  RegistrationData,
  RegistrationErrors,
  RegistrationField,
  RegistrationInputRefs,
} from "./types";
import { validateContact, validateIdentification } from "./validation";

const initialData: RegistrationData = {
  nationality: "V",
  documentNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

const stepTitles = ["Identificación", "Contacto y seguridad", "Confirmación"] as const;

export function RegistrationView() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RegistrationData>(initialData);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const inputRefs: RegistrationInputRefs = {
    documentNumber: documentRef,
    firstName: firstNameRef,
    lastName: lastNameRef,
    phone: phoneRef,
    email: emailRef,
    password: passwordRef,
    passwordConfirmation: confirmationRef,
  };

  useEffect(() => {
    titleRef.current?.focus();
  }, [step, isComplete]);

  useEffect(() => {
    if (isOtpVisible) otpRef.current?.focus();
  }, [isOtpVisible]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const updateField = (field: RegistrationField, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));

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

  const submitStep = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields: RegistrationField[] = step === 0
      ? ["documentNumber", "firstName", "lastName"]
      : ["phone", "email", "password", "passwordConfirmation"];
    const nextErrors = step === 0 ? validateIdentification(data) : validateContact(data);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors, fields);
      return;
    }

    setStep((current) => current + 1);
  };

  const goBack = () => {
    if (step === 2) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsSendingOtp(false);
      setIsOtpVisible(false);
      setTermsAccepted(false);
      setOtp("");
      setOtpError("");
    }
    setErrors({});
    setStep((current) => Math.max(0, current - 1));
  };

  const sendOtp = () => {
    if (!termsAccepted || isSendingOtp) return;
    setIsSendingOtp(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setIsSendingOtp(false);
      setIsOtpVisible(true);
    }, registrationMock.otpDelay);
  };

  const confirmOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextError = !otp
      ? "Ingresa el código de verificación."
      : otp.length !== 6
        ? "Ingresa los 6 dígitos del código."
        : otp !== registrationMock.validOtp
          ? "El código ingresado es incorrecto. Inténtalo nuevamente."
          : "";
    setOtpError(nextError);
    if (nextError) {
      otpRef.current?.focus();
      return;
    }
    setData((current) => ({ ...current, password: "", passwordConfirmation: "" }));
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <Box component="main" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 3 }}>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 520, alignItems: "center", textAlign: "center" }}>
          <CheckCircleRounded color="success" sx={{ width: 72, height: 72 }} />
          <Typography component="h1" ref={titleRef} tabIndex={-1} variant="h4" sx={{ fontWeight: 700 }}>
            Registro completado
          </Typography>
          <Typography color="text.secondary">Tu registro demostrativo se completó correctamente.</Typography>
          <Button component={Link} fullWidth href="/" variant="contained">Volver al acceso</Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Container
        maxWidth="sm"
        sx={{
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
          <Typography sx={{ color: themeTokens.color.brandLogo, fontWeight: 800 }}>xtracash</Typography>
        </Stack>

        <Paper
          variant="outlined"
          sx={{ flex: 1, display: "flex", flexDirection: "column", mt: 2, p: { xs: 2, sm: 3 }, boxShadow: "none" }}
        >
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="body2">Paso {step + 1} de 3</Typography>
            <LinearProgress aria-label={`Paso ${step + 1} de 3`} value={((step + 1) / 3) * 100} variant="determinate" />
            <Typography component="h1" ref={titleRef} tabIndex={-1} variant="h4" sx={{ pt: 1, fontWeight: 700 }}>
              {stepTitles[step]}
            </Typography>
          </Stack>

          <Box
            component="form"
            noValidate
            onSubmit={step < 2 ? submitStep : isOtpVisible ? confirmOtp : (event) => { event.preventDefault(); sendOtp(); }}
            sx={{ flex: 1, display: "flex", flexDirection: "column", pt: 3 }}
          >
            {step === 0 && <IdentificationStep data={data} errors={errors} inputRefs={inputRefs} onChange={updateField} />}
            {step === 1 && <ContactSecurityStep data={data} errors={errors} inputRefs={inputRefs} onChange={updateField} />}
            {step === 2 && (
              <ConfirmationStep
                data={data}
                isOtpVisible={isOtpVisible}
                onOtpChange={(value) => { setOtp(value); setOtpError(""); }}
                onTermsChange={setTermsAccepted}
                otp={otp}
                otpError={otpError}
                otpRef={otpRef}
                termsAccepted={termsAccepted}
              />
            )}

            <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} sx={{ mt: "auto", pt: 3 }}>
              {step > 0 && <Button fullWidth onClick={goBack} type="button" variant="outlined">Atrás</Button>}
              <Button
                disabled={step === 2 && !isOtpVisible && !termsAccepted}
                fullWidth
                loading={isSendingOtp}
                type="submit"
                variant="contained"
              >
                {step < 2 ? "Continuar" : isOtpVisible ? "Confirmar registro" : "Enviar código"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
