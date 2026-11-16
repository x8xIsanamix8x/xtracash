"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { signOut } from "@/features/auth/session/services/session";
import { isProtectedRoute } from "@/features/auth/session/routes";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { DEMO_TERMS_TEXT, DEMO_TERMS_VERSION, TERMS_DEMO_ENABLED } from "./termsDemo";

export function TermsGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    if (!TERMS_DEMO_ENABLED) return;
    const timer = window.setTimeout(() => {
      try {
        setDismissed(sessionStorage.getItem(`terms-demo-accepted:${DEMO_TERMS_VERSION}`) === "true");
      } catch {
        setDismissed(false);
      }
      setRequested(new URLSearchParams(window.location.search).get("termsDemo") === "pending");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  const pending = TERMS_DEMO_ENABLED && isProtectedRoute(pathname) && requested && !dismissed;
  if (!pending) return null;
  const accept = () => { setBusy(true); setError(""); try { sessionStorage.setItem(`terms-demo-accepted:${DEMO_TERMS_VERSION}`, "true"); setDismissed(true); } catch { setError("No pudimos guardar la simulación. Inténtalo de nuevo."); } finally { setBusy(false); } };
  const reject = async () => { setBusy(true); setError(""); const controller = new AbortController(); try { await signOut(controller.signal); router.replace(sessionExpiredUrl); } catch { setError("No pudimos cerrar tu sesión. Inténtalo de nuevo."); } finally { setBusy(false); } };
  return <Dialog open onClose={() => undefined} fullWidth maxWidth="sm" aria-labelledby="terms-gate-title" slotProps={{ backdrop: { sx: { bgcolor: "rgba(2,0,77,.72)" } } }}>
    <DialogTitle id="terms-gate-title" sx={{ color: "#08065C", fontWeight: 800 }}>Actualizamos nuestros términos y condiciones</DialogTitle>
    <DialogContent dividers><Stack spacing={2}><Typography>Para continuar usando Impúlsate Móvil, revisa y acepta la versión vigente.</Typography><Typography variant="caption" color="text.secondary">Versión de demostración: {DEMO_TERMS_VERSION}</Typography><Box role="document" aria-label="Texto completo de términos" sx={{ maxHeight: "42dvh", overflowY: "auto", p: 2, border: "1px solid #ddd", borderRadius: 2, bgcolor: "#f8f8ff", whiteSpace: "pre-wrap" }}>{DEMO_TERMS_TEXT}</Box><Alert severity="warning">Modo de demostración: la aceptación no se registra legalmente; falta integrar el backend.</Alert>{error && <Alert severity="error" role="alert">{error}</Alert>}</Stack></DialogContent>
    <DialogActions sx={{ p: 2, display: "grid", gap: 1 }}><Button variant="contained" disabled={busy} onClick={accept}>Aceptar y continuar</Button><Button disabled={busy} onClick={() => void reject()}>No aceptar y cerrar sesión</Button></DialogActions>
  </Dialog>;
}
