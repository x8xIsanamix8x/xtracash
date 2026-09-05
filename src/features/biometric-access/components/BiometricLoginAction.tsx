"use client";

import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import type { StartBiometricFlow } from "../types";
import { hasBiometricVault } from "../integration";
import { BiometricActionControl } from "./BiometricActionControl";

export function BiometricLoginAction({ onAuthenticate, disabled }: Readonly<{
  onAuthenticate: StartBiometricFlow;
  disabled?: boolean;
}>) {
  const [available, setAvailable] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const check = () => {
      void hasBiometricVault().then((value) => { if (active) { setAvailable(value); setFailed(false); } })
        .catch(() => { if (active) { setAvailable(false); setFailed(true); } });
    };
    check();
    window.addEventListener("pageshow", check);
    return () => { active = false; window.removeEventListener("pageshow", check); };
  }, []);
  if (failed) return <Typography color="text.secondary" role="status" variant="body2">No pudimos leer el acceso guardado. Ingresa con contraseña para revisarlo en Perfil.</Typography>;
  if (!available) return null;
  return <>
    <BiometricActionControl actionLabel="Ingresar con biometría" disabled={disabled}
      onAction={onAuthenticate} presentation="login-icon" />
    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
      Usará la cuenta guardada en este navegador, no el correo escrito arriba.
    </Typography>
  </>;
}
