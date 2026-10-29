"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowBackRounded,
  CheckCircleRounded,
  CloudUploadRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, darken } from "@mui/material/styles";

import { ViewportCanvasBackground } from "@/components/ViewportCanvasBackground";
import { TermsAndConditionsContent } from "@/features/auth/registration/components/TermsAndConditionsContent";
import { themeTokens } from "@/theme/tokens";

import {
  keepActivationDigits,
  normalizeActivationName,
  removeInvisibleNameCharacters,
  validateActivationDetails,
  validateActivationDocument,
  validateActivationIdentity,
  type ActivationFormErrors,
} from "./validation";
import {
  PreloadedActivationError,
  clearActivationToken,
  resendActivationEmail,
  submitPreloadedActivation,
  validateInvitation,
} from "./services/activation";
import type {
  PreloadedActivationProfile,
  PreloadedActivationStep,
} from "./types";

type ActivationDocuments = Readonly<{
  cedula: File | null;
  rif: File | null;
}>;

const emptyDocuments: ActivationDocuments = { cedula: null, rif: null };
const activationDeclaration =
  "Declaro y garantizo que los fondos que utilizaré provienen de actividades lícitas y serán destinados exclusivamente a fines lícitos.";

function activationErrorMessage(error: unknown): string {
  if (!(error instanceof PreloadedActivationError)) {
    return "No pudimos completar la solicitud. Conservamos tus datos para que puedas intentarlo nuevamente.";
  }

  switch (error.code) {
    case "ACTIVACION_REALIZADA":
      return "Esta cuenta ya fue activada. Inicia sesión con tu contraseña.";
    case "API_KEY_INVALIDA":
      return "El sandbox rechazó la clave del servicio de activación. Confirma con backend si debe enviarse una X-Activation-Key o si la omisión está habilitada.";
    case "UNAVAILABLE":
      return "La activación no está disponible en este momento. Inténtalo más tarde.";
    case "DEMASIADOS_INTENTOS":
      return "Se alcanzó el límite de intentos. Espera antes de volver a intentarlo.";
    case "DOCUMENTO_RECHAZADO": {
      const name = error.field === "documentoCedula" ? "cédula" : "RIF";
      if (error.reason === "MUY_GRANDE") return `La imagen del ${name} supera el máximo de 5 MB.`;
      if (error.reason === "TIPO_NO_PERMITIDO") return `La imagen del ${name} debe ser JPG, PNG o WEBP.`;
      return `No pudimos leer la imagen del ${name}. Selecciona otra foto legible.`;
    }
    case "NETWORK":
      return "No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.";
    case "SIN_COINCIDENCIA":
      return "No encontramos una invitación con esos datos. Revisa la cédula y el correo de tu empresa.";
    case "TOKEN_INVALIDO":
      return "La validación venció. Confirma nuevamente tu cédula y correo para continuar.";
    default:
      return "No pudimos completar la solicitud. Conservamos tus datos para que puedas intentarlo nuevamente.";
  }
}

function acceptedFileSize(size: number): string {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function PreloadedActivationView() {
  const [step, setStep] = useState<PreloadedActivationStep>("identity");
  const [profile, setProfile] = useState<PreloadedActivationProfile | null>(null);
  const [identity, setIdentity] = useState({ cedula: "", correo: "" });
  const [details, setDetails] = useState({ nombre: "", apellido: "", telefono: "" });
  const [documents, setDocuments] = useState<ActivationDocuments>(emptyDocuments);
  const [confirmedDetails, setConfirmedDetails] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<ActivationFormErrors>({});
  const [documentErrors, setDocumentErrors] = useState<Partial<Record<"cedula" | "rif", string>>>({});
  const [message, setMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<"ENVIADO" | "FALLIDO">("ENVIADO");
  const [busyAction, setBusyAction] = useState<"validate" | "submit" | "resend" | "clear" | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cedulaRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const apellidoRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const cedulaFileRef = useRef<HTMLInputElement>(null);
  const rifFileRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const requestRef = useRef<AbortController | null>(null);

  const isBusy = busyAction !== null;

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  const createRequest = () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    return controller;
  };

  const validateIdentity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;

    const nextErrors = validateActivationIdentity(identity.cedula, identity.correo);
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.cedula) cedulaRef.current?.focus();
      else emailRef.current?.focus();
      return;
    }

    busyRef.current = true;
    setBusyAction("validate");
    const controller = createRequest();
    try {
      const result = await validateInvitation({
        cedula: identity.cedula.trim(),
        correo: identity.correo.trim(),
      }, controller.signal);
      if (!mountedRef.current) return;
      setProfile(result);
      setDetails({
        nombre: removeInvisibleNameCharacters(result.nombre),
        apellido: removeInvisibleNameCharacters(result.apellido),
        telefono: result.telefono,
      });
      setDocuments(emptyDocuments);
      setDocumentErrors({});
      setConfirmedDetails(false);
      setAcceptedTerms(false);
      setStep("details");
      setErrors({});
    } catch (error) {
      if (!mountedRef.current || (error instanceof Error && error.name === "AbortError")) return;
      setMessage(activationErrorMessage(error));
      if (error instanceof PreloadedActivationError && error.code === "ACTIVACION_REALIZADA") {
        setMessage(`${activationErrorMessage(error)} Puedes volver al acceso para iniciar sesión.`);
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusyAction(null);
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const chooseDocument = (kind: "cedula" | "rif", file: File | null) => {
    const error = file ? validateActivationDocument(file) : "Adjunta este documento para continuar.";
    setDocumentErrors((current) => ({ ...current, [kind]: error ?? undefined }));
    if (error) return;
    setDocuments((current) => ({ ...current, [kind]: file }));
    setMessage("");
  };

  const submitDocuments = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || busyRef.current) return;

    const nextErrors = validateActivationDetails(details);
    setErrors(nextErrors);
    const nextDocumentErrors = {
      cedula: validateActivationDocument(documents.cedula) ?? undefined,
      rif: validateActivationDocument(documents.rif) ?? undefined,
    };
    setDocumentErrors(nextDocumentErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.nombre) nombreRef.current?.focus();
      else if (nextErrors.apellido) apellidoRef.current?.focus();
      else telefonoRef.current?.focus();
      return;
    }
    if (nextDocumentErrors.cedula || nextDocumentErrors.rif) {
      if (nextDocumentErrors.cedula) cedulaFileRef.current?.click();
      else rifFileRef.current?.click();
      return;
    }
    if (!confirmedDetails || !acceptedTerms) {
      setMessage("Confirma tus datos y acepta los términos para continuar.");
      return;
    }

    const formData = new FormData();
    formData.set("nombre", normalizeActivationName(details.nombre));
    formData.set("apellido", normalizeActivationName(details.apellido));
    formData.set("telefono", details.telefono.trim());
    formData.set("datosConfirmados", "true");
    formData.set("terminosAceptados", "true");
    formData.set("documentoCedula", documents.cedula!);
    formData.set("documentoRif", documents.rif!);

    busyRef.current = true;
    setBusyAction("submit");
    setMessage("");
    const controller = createRequest();
    try {
      const result = await submitPreloadedActivation(formData, controller.signal);
      if (!mountedRef.current) return;
      setEmailStatus(result.correoActivacion);
      setStep("submitted");
    } catch (error) {
      if (!mountedRef.current || (error instanceof Error && error.name === "AbortError")) return;
      if (error instanceof PreloadedActivationError && (error.code === "NETWORK" || error.code === "UNAVAILABLE")) {
        setMessage("No pudimos confirmar si se procesó el envío. Antes de intentarlo otra vez, valida nuevamente la invitación y revisa tu correo; así evitamos enviar los documentos dos veces.");
        setProfile(null);
        setStep("identity");
        return;
      }
      const nextMessage = activationErrorMessage(error);
      setMessage(nextMessage);
      if (error instanceof PreloadedActivationError && error.code === "TOKEN_INVALIDO") {
        setStep("identity");
        setProfile(null);
        setDocuments(emptyDocuments);
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusyAction(null);
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const resendEmail = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyAction("resend");
    setMessage("");
    const controller = createRequest();
    try {
      await resendActivationEmail(identity, controller.signal);
      if (!mountedRef.current) return;
      setEmailStatus("ENVIADO");
      setMessage("Listo. Enviamos nuevamente el correo de activación.");
    } catch (error) {
      if (!mountedRef.current || (error instanceof Error && error.name === "AbortError")) return;
      setMessage(activationErrorMessage(error));
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusyAction(null);
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const useAnotherIdentity = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyAction("clear");
    requestRef.current?.abort();
    setStep("identity");
    setProfile(null);
    setIdentity({ cedula: "", correo: "" });
    setDetails({ nombre: "", apellido: "", telefono: "" });
    setDocuments(emptyDocuments);
    setDocumentErrors({});
    setConfirmedDetails(false);
    setAcceptedTerms(false);
    setErrors({});
    setMessage("");
    try { await clearActivationToken(); } catch { /* El token expira por sí solo; no bloquear el cambio de identidad. */ }
    finally {
      busyRef.current = false;
      if (mountedRef.current) setBusyAction(null);
    }
  };

  const uploadCard = (
    kind: "cedula" | "rif",
    title: string,
    file: File | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    const id = `activation-document-${kind}`;
    return (
      <Box
        component="section"
        aria-labelledby={`${id}-title`}
        sx={{
          border: `1px solid ${documentErrors[kind] ? "#D32F2F" : alpha(themeTokens.color.preLoginNavy, 0.14)}`,
          borderRadius: 2,
          bgcolor: themeTokens.color.paper,
          p: 1.5,
        }}
      >
        <Typography id={`${id}-title`} sx={{ color: themeTokens.color.preLoginNavy, fontWeight: 750 }}>
          {title} <Box component="span" sx={{ color: themeTokens.color.accent }}>*</Box>
        </Typography>
        <Typography sx={{ mt: 0.5, color: themeTokens.color.preLoginMuted, fontSize: "0.8125rem" }}>
          Imagen legible. JPG, PNG o WEBP; máximo 5 MB.
        </Typography>
        <input
          accept="image/jpeg,image/png,image/webp"
          hidden
          id={id}
          onChange={(event) => chooseDocument(kind, event.target.files?.[0] ?? null)}
          ref={inputRef}
          type="file"
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.25, minWidth: 0, width: "100%" }}>
          <Button
            aria-describedby={documentErrors[kind] ? `${id}-error` : `${id}-help`}
            component="label"
            htmlFor={id}
            startIcon={file ? <DescriptionRounded /> : <CloudUploadRounded />}
            sx={{
              flex: "0 0 auto",
              minHeight: 40,
              maxWidth: "100%",
              borderRadius: 1.5,
              color: themeTokens.color.preLoginPrimary,
              fontWeight: 750,
              px: 1.25,
              textTransform: "none",
              whiteSpace: "nowrap",
            }}
            variant="outlined"
          >
            {file ? "Reemplazar imagen" : "Adjuntar imagen"}
          </Button>
          {file && (
            <Typography noWrap title={file.name} sx={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", color: themeTokens.color.preLoginNavy, fontSize: "0.8125rem" }}>
              {file.name} · {acceptedFileSize(file.size)}
            </Typography>
          )}
        </Stack>
        <Typography id={`${id}-help`} sx={{ display: "none" }}>Imagen requerida.</Typography>
        {documentErrors[kind] && (
          <Typography color="error" id={`${id}-error`} role="alert" sx={{ mt: 1, fontSize: "0.8125rem" }}>
            {documentErrors[kind]}
          </Typography>
        )}
        {file && (
          <Button
            disabled={isBusy}
            onClick={() => {
              setDocuments((current) => ({ ...current, [kind]: null }));
              setDocumentErrors((current) => ({ ...current, [kind]: "Adjunta este documento para continuar." }));
              if (inputRef.current) inputRef.current.value = "";
            }}
            size="small"
            startIcon={<DeleteOutlineRounded sx={{ fontSize: 17 }} />}
            sx={{ mt: 0.5, ml: -0.75, minHeight: 32, px: 1, borderRadius: 1.5, color: themeTokens.color.preLoginMuted, textTransform: "none", "&:hover": { bgcolor: alpha(themeTokens.color.preLoginNavy, 0.05) } }}
            variant="text"
          >
            Quitar archivo
          </Button>
        )}
      </Box>
    );
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
      <ViewportCanvasBackground color={themeTokens.color.preLoginBackground} />
      <Stack
        component="header"
        direction="row"
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 560,
          minHeight: 56,
          mx: "auto",
          alignItems: "center",
          justifyContent: "space-between",
          pt: "calc(8px + env(safe-area-inset-top))",
          pr: "calc(16px + env(safe-area-inset-right))",
          pl: "calc(16px + env(safe-area-inset-left))",
        }}
      >
        <IconButton
          aria-label={step === "identity" ? "Volver al acceso" : step === "details" ? "Volver a validar la invitación" : "Volver al acceso"}
          component={step === "details" ? "button" : Link}
          {...(step === "details" ? {} : { href: "/" })}
          onClick={step === "details" ? useAnotherIdentity : undefined}
          sx={{ color: themeTokens.color.preLoginNavy }}
        >
          <ArrowBackRounded />
        </IconButton>
        <Typography sx={{ color: themeTokens.color.brandDeep, fontWeight: 800 }}>Impúlsate Móvil</Typography>
        <Box sx={{ width: 40 }} />
      </Stack>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          width: "100%",
          maxWidth: 560,
          mx: "auto",
          px: { xs: 2.25, sm: 3 },
          pt: { xs: 1, sm: 2 },
          pb: "calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        {step === "identity" && (
          <Stack spacing={2.25}>
            <Stack sx={{ alignItems: "center", textAlign: "center", pt: 1 }}>
              <Box sx={{ width: 64, height: 64, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: alpha(themeTokens.color.preLoginPrimary, 0.1), color: themeTokens.color.preLoginPrimary }}>
                <VerifiedUserRounded sx={{ fontSize: 34 }} />
              </Box>
              <Typography component="h1" ref={titleRef} tabIndex={-1} sx={{ mt: 2, color: themeTokens.color.preLoginNavy, fontSize: "clamp(1.5rem, 7vw, 2rem)", fontWeight: 750, lineHeight: 1.2 }}>
                Activa tu cuenta
              </Typography>
              <Typography sx={{ mt: 1, maxWidth: 420, color: themeTokens.color.preLoginMuted, lineHeight: 1.5 }}>
                Ingresa la cédula y el correo electrónico donde recibiste la invitación de tu empresa.
              </Typography>
              <Typography sx={{ mt: 1.5, color: themeTokens.color.preLoginPrimary, fontSize: "0.875rem", fontWeight: 750 }}>
                Paso 1 de 2 · Valida tu invitación
              </Typography>
            </Stack>

            <Box component="form" noValidate onSubmit={validateIdentity}>
              <Stack spacing={2}>
                <TextField
                  autoComplete="off"
                  error={Boolean(errors.cedula)}
                  fullWidth
                  helperText={errors.cedula ?? "Solo números, sin puntos ni letras."}
                  inputRef={cedulaRef}
                  label="Cédula de identidad"
                  name="cedula"
                  onChange={(event) => setIdentity((current) => ({ ...current, cedula: keepActivationDigits(event.target.value) }))}
                  required
                  slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 9 } }}
                  value={identity.cedula}
                  variant="filled"
                  sx={activationFieldSx}
                />
                <TextField
                  autoComplete="email"
                  error={Boolean(errors.correo)}
                  fullWidth
                  helperText={errors.correo}
                  inputRef={emailRef}
                  label="Correo de la invitación"
                  name="email"
                  onChange={(event) => setIdentity((current) => ({ ...current, correo: event.target.value }))}
                  required
                  slotProps={{ htmlInput: { inputMode: "email", autoCapitalize: "none", spellCheck: false } }}
                  type="email"
                  value={identity.correo}
                  variant="filled"
                  sx={activationFieldSx}
                />
                {message && <Alert role="alert" severity="error">{message}</Alert>}
                <Button
                  disabled={isBusy || Object.keys(validateActivationIdentity(identity.cedula, identity.correo)).length > 0}
                  fullWidth
                  loading={busyAction === "validate"}
                  sx={activationPrimaryButtonSx}
                  type="submit"
                  variant="contained"
                >
                  Validar invitación
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}

        {step === "details" && profile && (
          <Stack spacing={1.5}>
            <Box>
              <Typography component="h1" ref={titleRef} tabIndex={-1} sx={{ color: themeTokens.color.preLoginNavy, fontSize: "clamp(1.5rem, 7vw, 1.9rem)", fontWeight: 750 }}>
                Verifica tus datos
              </Typography>
              <Typography sx={{ mt: 0.75, color: themeTokens.color.preLoginMuted, lineHeight: 1.5 }}>
                Tu empresa precargó esta información. Confirma que sea correcta y adjunta tu cédula y tu RIF.
              </Typography>
              <Typography sx={{ mt: 1, color: themeTokens.color.preLoginPrimary, fontSize: "0.875rem", fontWeight: 750 }}>
                Paso 2 de 2 · Datos y documentos
              </Typography>
            </Box>

            <Box component="form" noValidate onSubmit={submitDocuments}>
              <Stack spacing={1.25}>
                <TextField disabled fullWidth label="Cédula de identidad" value={profile.cedula} variant="filled" sx={activationFieldSx} />
                <TextField disabled fullWidth label="Correo electrónico" value={profile.correo} variant="filled" sx={activationFieldSx} />
                <TextField
                  autoComplete="given-name"
                  error={Boolean(errors.nombre)}
                  fullWidth
                  helperText={errors.nombre}
                  inputRef={nombreRef}
                  label="Nombre"
                  name="nombre"
                  onChange={(event) => setDetails((current) => ({ ...current, nombre: removeInvisibleNameCharacters(event.target.value) }))}
                  required
                  value={details.nombre}
                  variant="filled"
                  sx={activationFieldSx}
                />
                <TextField
                  autoComplete="family-name"
                  error={Boolean(errors.apellido)}
                  fullWidth
                  helperText={errors.apellido}
                  inputRef={apellidoRef}
                  label="Apellido"
                  name="apellido"
                  onChange={(event) => setDetails((current) => ({ ...current, apellido: removeInvisibleNameCharacters(event.target.value) }))}
                  required
                  value={details.apellido}
                  variant="filled"
                  sx={activationFieldSx}
                />
                <TextField
                  autoComplete="tel"
                  error={Boolean(errors.telefono)}
                  fullWidth
                  helperText={errors.telefono}
                  inputRef={telefonoRef}
                  label="Número de teléfono"
                  name="telefono"
                  onChange={(event) => setDetails((current) => ({ ...current, telefono: event.target.value }))}
                  required
                  slotProps={{ htmlInput: { inputMode: "tel" } }}
                  value={details.telefono}
                  variant="filled"
                  sx={activationFieldSx}
                />
                <Typography sx={{ color: themeTokens.color.preLoginMuted, fontSize: "0.8125rem", lineHeight: 1.45 }}>
                  Si algún dato es incorrecto, corrígelo antes de continuar.
                </Typography>

                <Typography component="h2" sx={{ pt: 0.75, color: themeTokens.color.preLoginNavy, fontWeight: 750 }}>
                  Adjunta tus documentos
                </Typography>
                {uploadCard("cedula", "Documento de identidad", documents.cedula, cedulaFileRef)}
                {uploadCard("rif", "RIF", documents.rif, rifFileRef)}

                <Stack spacing={1} sx={{ pt: 0.25 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", minWidth: 0 }}>
                    <Checkbox
                      checked={confirmedDetails}
                      disabled={isBusy}
                      id="activation-confirm-data"
                      onChange={(event) => setConfirmedDetails(event.target.checked)}
                      slotProps={{ input: { "aria-describedby": "activation-data-consent" } }}
                      sx={{ p: 0, mt: "2px", width: 24, height: 24, flex: "0 0 24px", color: themeTokens.color.preLoginMuted, "&.Mui-checked": { color: themeTokens.color.preLoginPrimary } }}
                    />
                    <Typography component="label" htmlFor="activation-confirm-data" id="activation-data-consent" sx={{ minWidth: 0, color: themeTokens.color.preLoginNavy, cursor: "pointer", lineHeight: 1.5 }}>
                      Confirmo que mis datos son correctos.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", minWidth: 0 }}>
                    <Checkbox
                      checked={acceptedTerms}
                      disabled={isBusy}
                      id="activation-accept-terms"
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      slotProps={{ input: { "aria-describedby": "activation-terms-consent" } }}
                      sx={{ p: 0, mt: "2px", width: 24, height: 24, flex: "0 0 24px", color: themeTokens.color.preLoginMuted, "&.Mui-checked": { color: themeTokens.color.preLoginPrimary } }}
                    />
                    <Box sx={{ minWidth: 0, lineHeight: 1.5 }}>
                      <Typography component="label" htmlFor="activation-accept-terms" id="activation-terms-consent" sx={{ color: themeTokens.color.preLoginNavy, cursor: "pointer" }}>
                        Acepto los términos de activación y declaro y garantizo que los fondos que utilizaré provienen de actividades lícitas y serán destinados exclusivamente a fines lícitos. {" "}
                      </Typography>
                      <Button
                        aria-controls={termsOpen ? "activation-terms-dialog" : undefined}
                        aria-expanded={termsOpen}
                        aria-haspopup="dialog"
                        disabled={isBusy}
                        onClick={() => setTermsOpen(true)}
                        sx={{ minWidth: 0, minHeight: 0, p: 0, color: themeTokens.color.preLoginPrimary, fontWeight: 700, lineHeight: "inherit", textTransform: "none", verticalAlign: "baseline" }}
                        type="button"
                        variant="text"
                      >
                        Leer términos y condiciones
                      </Button>
                    </Box>
                  </Stack>
                </Stack>

                {message && <Alert role="alert" severity="error">{message}</Alert>}
                <Button
                  disabled={isBusy || !confirmedDetails || !acceptedTerms || !documents.cedula || !documents.rif}
                  fullWidth
                  loading={busyAction === "submit"}
                  sx={{ ...activationPrimaryButtonSx, mt: 1 }}
                  type="submit"
                  variant="contained"
                >
                  Enviar documentos y continuar
                </Button>
                <Button disabled={isBusy} onClick={useAnotherIdentity} sx={{ minHeight: 44, color: themeTokens.color.preLoginNavy, fontWeight: 700, textTransform: "none" }}>
                  Usar otra cédula o correo
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}

        {step === "submitted" && (
          <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center", pt: { xs: 3, sm: 6 } }}>
            <Box sx={{ width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: alpha(themeTokens.color.preLoginPrimary, 0.1), color: themeTokens.color.preLoginPrimary }}>
              <CheckCircleRounded sx={{ fontSize: 48 }} />
            </Box>
            <Box>
              <Typography component="h1" ref={titleRef} tabIndex={-1} sx={{ color: themeTokens.color.preLoginNavy, fontSize: "1.75rem", fontWeight: 800 }}>
                Revisa tu correo
              </Typography>
              <Typography sx={{ mt: 1, color: themeTokens.color.preLoginMuted, lineHeight: 1.55 }}>
                {emailStatus === "ENVIADO" ? "Enviamos a " : "El correo de activación se enviará a "}
                <Box component="span" sx={{ color: themeTokens.color.preLoginNavy, fontWeight: 700 }}>{profile?.correo ?? identity.correo}</Box>
                {emailStatus === "ENVIADO" ? " el enlace para verificar tu correo y crear tu contraseña." : " cuando el servicio de correo esté disponible."}
              </Typography>
              <Typography sx={{ mt: 1.5, color: themeTokens.color.preLoginMuted, fontSize: "0.875rem" }}>
                Tu cuenta quedará activa cuando completes el enlace y accedas con tu contraseña.
              </Typography>
            </Box>
            {emailStatus === "FALLIDO" && (
              <Alert severity="warning" sx={{ width: "100%", textAlign: "left" }}>
                Guardamos tus datos, pero el correo no pudo enviarse. Puedes solicitar otro.
              </Alert>
            )}
            {message && <Alert role="status" severity="success" sx={{ width: "100%", textAlign: "left" }}>{message}</Alert>}
            <Stack spacing={1.25} sx={{ width: "100%", pt: 1 }}>
              <Button disabled={isBusy} loading={busyAction === "resend"} onClick={resendEmail} sx={activationPrimaryButtonSx} variant="contained">
                Reenviar correo de activación
              </Button>
              <Button component={Link} href="/" sx={{ minHeight: 48, color: themeTokens.color.preLoginPrimary, fontWeight: 750, textTransform: "none" }}>
                Volver al acceso
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>

      <Dialog
        aria-describedby="activation-terms-description"
        aria-labelledby="activation-terms-title"
        fullWidth
        id="activation-terms-dialog"
        maxWidth="md"
        onClose={() => setTermsOpen(false)}
        open={termsOpen}
        scroll="paper"
        slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: "calc(100dvh - 32px)" } } }}
      >
        <DialogTitle id="activation-terms-title" sx={{ color: themeTokens.color.preLoginNavy, fontWeight: 800 }}>
          Términos y condiciones de activación
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#F8F8FD", px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Box id="activation-terms-description">
            <TermsAndConditionsContent />
            <Box sx={{ mt: 2, p: 2, borderLeft: `4px solid ${themeTokens.color.accent}`, borderRadius: 1.5, bgcolor: alpha(themeTokens.color.accent, 0.08) }}>
              <Typography sx={{ color: themeTokens.color.preLoginNavy, fontWeight: 750 }}>Declaración de licitud de fondos</Typography>
              <Typography sx={{ mt: 0.5, color: themeTokens.color.preLoginNavy, lineHeight: 1.55 }}>{activationDeclaration}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setTermsOpen(false)} sx={{ color: themeTokens.color.preLoginPrimary, fontWeight: 750, textTransform: "none" }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <Box aria-live="polite" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {isBusy ? "Procesando solicitud" : ""}
      </Box>
      {isBusy && <LinearProgress aria-label="Procesando" sx={{ position: "fixed", inset: "0 0 auto", zIndex: 1400, height: 3, "& .MuiLinearProgress-bar": { bgcolor: themeTokens.color.preLoginPrimary } }} />}
    </Box>
  );
}

const activationFieldSx = {
  "& .MuiFilledInput-root": {
    borderRadius: 1.75,
    bgcolor: "#FFFFFF",
    "&:before, &:after": { display: "none" },
    "&:hover": { bgcolor: "#FFFFFF" },
    "&.Mui-focused": { outline: `2px solid ${themeTokens.color.preLoginPrimary}` },
    "&.Mui-disabled": { bgcolor: "#FFFFFF" },
  },
  "& .MuiInputLabel-root": { color: themeTokens.color.preLoginMuted },
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: themeTokens.color.preLoginNavy, opacity: 0.8 },
} as const;

const activationPrimaryButtonSx = {
  minHeight: 50,
  borderRadius: 999,
  fontWeight: 750,
  bgcolor: themeTokens.color.preLoginPrimary,
  "&:hover": { bgcolor: darken(themeTokens.color.preLoginPrimary, 0.12) },
  "&:focus-visible": { outline: `3px solid ${themeTokens.color.preLoginPrimary}`, outlineOffset: 2 },
  "&.Mui-disabled": {
    bgcolor: alpha(themeTokens.color.preLoginNavy, 0.12),
    color: alpha(themeTokens.color.preLoginNavy, 0.38),
  },
} as const;
