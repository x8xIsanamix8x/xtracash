"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FingerprintRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogContent,
  DialogContentText, DialogTitle, FormControlLabel, IconButton, InputAdornment,
  Slide, Stack, TextField, Typography, useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { alpha } from "@mui/material/styles";
import {
  activateBiometricVault, clearEnrollmentCredentials, deactivateBiometricVault,
  getBiometricVaultErrorMessage, hasBiometricVault, verifyEnrollmentPassword,
  type EnrollmentCredentials,
} from "../integration";
import { getBiometricActionFailureStatus } from "../client/detection";
import { BiometricActionControl } from "./BiometricActionControl";

function BottomSheetTransition(props: SlideProps) { return <Slide {...props} direction="up" />; }

export function BiometricProfileSection() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"password" | "ready" | "remove">("password");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "error" | "success">("info");
  const [fieldError, setFieldError] = useState(false);
  const [storageProblem, setStorageProblem] = useState(false);
  const credentialsRef = useRef<EnrollmentCredentials | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const passwordRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  const discard = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    clearEnrollmentCredentials(credentialsRef.current);
    credentialsRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    void hasBiometricVault().then((value) => {
      if (active) setConfigured(value);
    }).catch((error: unknown) => {
      if (active) {
        setStorageProblem(true);
        setMessage(getBiometricVaultErrorMessage(error));
        setSeverity("error");
      }
    });
    return () => {
      active = false;
      mountedRef.current = false;
      controllerRef.current?.abort();
      discard();
    };
  }, [discard]);

  useEffect(() => { if (message && open) noticeRef.current?.focus(); }, [message, open]);

  const begin = (next: "password" | "remove") => {
    discard(); setPassword(""); setVisible(false); setConsent(false);
    setFieldError(false); setMessage(""); setPhase(next); setOpen(true);
  };
  const close = () => {
    if (controllerRef.current) return;
    discard(); setPassword(""); setVisible(false); setConsent(false); setOpen(false); setMessage("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (controllerRef.current) return;
    if (phase === "password" && (!password || !consent)) {
      setFieldError(!password);
      if (!password) passwordRef.current?.focus();
      else { setMessage("Autoriza el guardado cifrado para continuar."); setSeverity("info"); consentRef.current?.focus(); }
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller; setBusy(true); setMessage("");
    try {
      if (phase === "remove") {
        await deactivateBiometricVault();
        if (!mountedRef.current) return;
        setConfigured(false); setStorageProblem(false); setOpen(false);
        setSeverity("success"); setMessage("Se eliminó la copia cifrada de este navegador. La passkey del dispositivo se administra por separado.");
      } else if (phase === "password") {
        const credentials = await verifyEnrollmentPassword(password,
          AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]));
        if (!mountedRef.current || controller.signal.aborted) { clearEnrollmentCredentials(credentials); return; }
        credentialsRef.current = credentials; setPassword(""); setVisible(false); setPhase("ready");
        timerRef.current = setTimeout(() => {
          discard(); setPhase("password"); setSeverity("info");
          setMessage("La verificación venció. Confirma nuevamente tu contraseña.");
        }, 120_000);
      } else {
        const credentials = credentialsRef.current;
        if (!credentials) throw new Error("enrollment-expired");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        await activateBiometricVault(credentials, controller.signal);
        if (!mountedRef.current) return;
        setConfigured(true); setStorageProblem(false); setOpen(false);
        setSeverity("success"); setMessage("Acceso configurado en este navegador. Puedes cerrar sesión y probar el ingreso con biometría.");
        discard();
      }
    } catch (error) {
      discard();
      if (mountedRef.current) {
        setPassword(""); setVisible(false);
        if (phase !== "remove") setPhase("password");
        setSeverity(getBiometricActionFailureStatus(error) === "cancelled" ? "info" : "error");
        setMessage(getBiometricVaultErrorMessage(error));
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      if (mountedRef.current) setBusy(false);
    }
  };

  return (
    <>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box aria-hidden="true" sx={{ width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "background.default", color: "primary.main" }}>
            <FingerprintRounded />
          </Box>
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography component="h3" sx={{ fontWeight: 700 }}>Acceso biométrico</Typography>
            <Typography color="text.secondary" variant="body2">Usa la seguridad de este dispositivo para ingresar más rápido.</Typography>
            <Typography color="text.secondary" variant="caption">Prototipo de pruebas · huella, rostro o PIN.</Typography>
          </Stack>
        </Stack>
        {!open && message && <Alert severity={severity} role="status">{message}</Alert>}
        {configured === true && <Typography role="status" variant="body2">Hay una configuración cifrada en este navegador.</Typography>}
        {configured === null && !storageProblem && <Typography role="status" variant="body2">Comprobando configuración…</Typography>}
        {(configured !== null || storageProblem) && (
          <BiometricActionControl actionLabel={configured ? "Actualizar acceso biométrico" : "Configurar acceso biométrico"} onAction={async () => begin("password")} />
        )}
        {(configured || storageProblem) && <Button fullWidth type="button" variant="text" onClick={() => begin("remove")}>Quitar de este navegador</Button>}
      </Stack>
      <Dialog open={open} onClose={close} fullWidth maxWidth={false}
        aria-labelledby="biometric-activation-title" aria-describedby="biometric-activation-description"
        slots={{ transition: BottomSheetTransition }} transitionDuration={reducedMotion ? 0 : undefined}
        slotProps={{ container: { sx: { alignItems: "flex-end" } }, paper: { sx: {
          m: 0, width: { xs: "100%", sm: "min(600px, calc(100% - 48px))" }, maxWidth: "100%",
          height: "min(76dvh, 720px)", maxHeight: "calc(100dvh - env(safe-area-inset-top))",
          borderRadius: "28px 28px 0 0", overflow: "hidden",
        } } }}>
        <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, pt: 3, pb: "calc(24px + env(safe-area-inset-bottom))", overflowY: "auto", overflowWrap: "anywhere" }}>
          <Box component="form" noValidate onSubmit={submit} aria-busy={busy} sx={{ minHeight: "100%", display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box aria-hidden="true" sx={{ width: 48, height: 5, bgcolor: "divider", borderRadius: 99, mx: "auto", flexShrink: 0 }} />
            <Box aria-hidden="true" sx={(theme) => ({ width: 80, height: 80, flexShrink: 0, mx: "auto", display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" })}>
              <FingerprintRounded sx={{ width: 48, height: 48 }} />
            </Box>
            <Stack spacing={1} sx={{ textAlign: "center" }}>
              <DialogTitle component="h2" id="biometric-activation-title" sx={{ p: 0, color: "secondary.main", fontWeight: 700 }}>
                {phase === "remove" ? "¿Quitar el acceso guardado?" : "Configura el acceso biométrico"}
              </DialogTitle>
              <DialogContentText id="biometric-activation-description">
                {phase === "remove" ? "Se eliminará la copia cifrada de este navegador. Podrás seguir ingresando con contraseña. Esta acción no elimina la passkey del administrador del dispositivo."
                  : phase === "ready" ? "Contraseña verificada. El dispositivo te pedirá crear y comprobar una passkey; puede solicitar dos verificaciones."
                    : "Guardaremos tu contraseña cifrada en este navegador. La seguridad del dispositivo permitirá utilizarla para ingresar a Core."}
              </DialogContentText>
            </Stack>
            {message && <Alert ref={noticeRef} tabIndex={-1} severity={severity} role="status">{message}</Alert>}
            {phase === "password" && <>
              {configured && <Alert severity="info">La nueva configuración reemplazará el acceso guardado en este navegador.</Alert>}
              <TextField autoFocus fullWidth required type={visible ? "text" : "password"} label="Contraseña actual"
                autoComplete="current-password" value={password} inputRef={passwordRef} disabled={busy}
                error={fieldError} helperText={fieldError ? "Ingresa tu contraseña actual." : undefined}
                id="biometric-current-password" onChange={(event) => { setPassword(event.target.value); setFieldError(false); }}
                slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton type="button" disabled={busy}
                  aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible}
                  onMouseDown={(event) => event.preventDefault()} onClick={() => setVisible(!visible)} sx={{ minWidth: 44, minHeight: 44 }}>
                  {visible ? <VisibilityOffRounded /> : <VisibilityRounded />}
                </IconButton></InputAdornment> } }} />
              <FormControlLabel sx={{ alignItems: "flex-start", m: 0 }} control={<Checkbox checked={consent} disabled={busy}
                slotProps={{ input: { ref: consentRef } }} onChange={(event) => setConsent(event.target.checked)} />}
                label={<Typography variant="body2">Autorizo guardar una copia cifrada de mi contraseña en este navegador. Permanecerá después de cerrar sesión hasta que quite esta opción o borre los datos del sitio.</Typography>} />
              <Typography variant="caption" color="text.secondary">Solo para sandbox. Usa un dispositivo personal. Si cambias tu contraseña, deberás actualizar esta configuración.</Typography>
            </>}
            <Stack spacing={1} sx={{ mt: "auto", pt: 1 }}>
              <Button type="submit" fullWidth variant="contained" disabled={busy || (phase === "password" && (!password || !consent))}
                startIcon={busy ? <CircularProgress color="inherit" size={20} /> : <FingerprintRounded />} sx={{ minHeight: 48 }}>
                {busy ? "Procesando…" : phase === "remove" ? "Quitar configuración" : phase === "ready" ? "Guardar con seguridad del dispositivo" : "Verificar contraseña"}
              </Button>
              <Button fullWidth type="button" color="secondary" disabled={busy} onClick={close} sx={{ minHeight: 44 }}>Ahora no</Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
