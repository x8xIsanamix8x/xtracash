"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowBackRounded,
  ArrowForwardRounded,
  CheckCircleOutlineRounded,
  CloseRounded,
  HelpOutlineRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";
import { financingGuideRanges, paymentGuideSteps } from "../financingGuide";
import { hasSeenPaymentGuide, markPaymentGuideSeen } from "../paymentGuidePreference";

type MobilePaymentGuideProps = Readonly<{
  autoOpen: boolean;
  disabled: boolean;
}>;

export function MobilePaymentGuide({ autoOpen, disabled }: MobilePaymentGuideProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const preferenceCheckedRef = useRef(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const step = paymentGuideSteps[stepIndex];
  const isLastStep = stepIndex === paymentGuideSteps.length - 1;

  useEffect(() => {
    if (!autoOpen || disabled || preferenceCheckedRef.current) return;
    const timeout = window.setTimeout(() => {
      preferenceCheckedRef.current = true;
      if (!hasSeenPaymentGuide()) setOpen(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [autoOpen, disabled]);

  useEffect(() => {
    if (!open) return;
    contentRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [open, stepIndex]);

  const closeGuide = () => {
    markPaymentGuideSeen();
    setOpen(false);
  };

  const changeStep = (direction: number) => {
    setStepIndex((current) => Math.max(0, Math.min(paymentGuideSteps.length - 1, current + direction)));
  };

  return (
    <>
      <IconButton
        aria-label="Cómo funciona el Pago Móvil"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => { setStepIndex(0); setOpen(true); }}
        ref={launcherRef}
        title="Cómo funciona"
        sx={{
          color: "inherit",
          "&.Mui-focusVisible": { outline: "2px solid currentColor", outlineOffset: 2 },
          "&.Mui-disabled": { opacity: 0.5 },
        }}
      >
        <HelpOutlineRounded />
      </IconButton>

      <Dialog
        aria-describedby="mobile-payment-guide-description"
        aria-labelledby="mobile-payment-guide-title"
        disableRestoreFocus
        fullWidth
        maxWidth="xs"
        onClose={closeGuide}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); changeStep(1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); changeStep(-1); }
        }}
        open={open}
        transitionDuration={prefersReducedMotion ? 0 : undefined}
        slotProps={{
          backdrop: { sx: { bgcolor: "rgba(2, 0, 40, 0.6)", backdropFilter: "blur(4px)" } },
          paper: { sx: {
            m: 2, width: "calc(100% - 32px)", maxWidth: 420,
            height: 740,
            maxHeight: "calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
            borderRadius: "2rem", bgcolor: "secondary.main", color: "common.white",
            backgroundImage: "radial-gradient(ellipse at top left, rgba(60, 68, 209, 0.4), transparent 60%)",
            overflow: "hidden",
            "& .MuiButtonBase-root:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 },
          } },
          transition: {
            onEntered: () => titleRef.current?.focus({ preventScroll: true }),
            onExited: () => launcherRef.current?.focus({ preventScroll: true }),
          },
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2.5, pt: 1.5, pb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box sx={{ display: "grid", placeItems: "center", width: 32, height: 36, borderRadius: 2, bgcolor: "common.white" }}>
              <Image alt="" height={28} src="/entry/isotipo-impulsa.png" width={24} style={{ objectFit: "contain" }} />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Impúlsate <Box component="span" sx={{ color: "#FFB36B" }}>Móvil</Box></Typography>
          </Stack>
          <IconButton aria-label="Cerrar guía de Pago Móvil" onClick={closeGuide} sx={{ color: "common.white" }}>
            <CloseRounded />
          </IconButton>
        </Stack>

        <DialogContent
          ref={contentRef}
          onPointerDown={(event) => {
            if (event.pointerType === "touch") touchStartRef.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerCancel={() => { touchStartRef.current = null; }}
          onPointerUp={(event) => {
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) changeStep(dx < 0 ? 1 : -1);
          }}
          sx={{ px: { xs: 2.5, sm: 3 }, pt: "8px !important", pb: 1, touchAction: "pan-y" }}
        >
          <Typography sx={{ color: "#FFB36B", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textAlign: "center", textTransform: "uppercase" }}>
            {stepIndex === 0 ? "Un impulso para tus planes" : stepIndex === 1 ? "Te lo explico paso a paso" : "Tu mascota te acompaña"}
          </Typography>
          <Typography
            component="h2"
            id="mobile-payment-guide-title"
            ref={titleRef}
            tabIndex={-1}
            sx={{ mt: 1.25, fontSize: { xs: "1.875rem", sm: "2rem" }, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, textAlign: "center", textWrap: "balance", "&:focus": { outline: "none" } }}
          >
            {step.title}
          </Typography>

          {stepIndex !== 1 && (
            <Box sx={{ position: "relative", width: "min(100%, 220px)", mx: "auto", my: 2.5 }}>
              <Image
                alt={step.imageAlt}
                height={1254}
                loading="eager"
                sizes="220px"
                src={step.image}
                style={{ display: "block", width: "100%", height: "auto", borderRadius: stepIndex === 0 ? "50% 50% 1.5rem 1.5rem" : "1.5rem" }}
                width={1254}
              />
              {stepIndex === 0 && (
                <Box sx={{ position: "absolute", top: 8, right: -8, width: 64, height: 64, display: "grid", placeContent: "center", borderRadius: "50%", bgcolor: themeTokens.color.accent, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", transform: "rotate(9deg)", textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 24, lineHeight: 1 }}>0%</Typography>
                  <Typography sx={{ fontSize: 10, fontWeight: 700 }}>intereses</Typography>
                </Box>
              )}
            </Box>
          )}

          {stepIndex !== 1 && (
            <Typography id="mobile-payment-guide-description" sx={{ fontSize: 14, lineHeight: 1.55, color: "#E1DFFF", textAlign: "center" }}>
              {step.description}
            </Typography>
          )}

          {stepIndex === 0 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3, textAlign: "center" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Los 15 días cuentan desde cada consumo.</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12, color: "#E1DFFF" }}>La comisión del Pago Móvil se mantiene.</Typography>
            </Box>
          )}

          {stepIndex === 1 && (
            <>
              <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, mb: 2, alignItems: "center" }}>
                <Box sx={{ width: { xs: 96, sm: 112 }, flexShrink: 0 }}>
                  <Image
                    alt={step.imageAlt}
                    height={1254}
                    loading="eager"
                    sizes="112px"
                    src={step.image}
                    width={1254}
                    style={{ display: "block", width: "100%", height: "auto", borderRadius: "1.25rem" }}
                  />
                </Box>
                <Box sx={{
                  position: "relative", flex: 1, minWidth: 0, p: 1.5,
                  borderRadius: "1.25rem", bgcolor: "common.white", color: "secondary.main",
                  "&::before": { content: '\"\"', position: "absolute", left: -6, top: "50%", width: 12, height: 12, bgcolor: "common.white", transform: "translateY(-50%) rotate(45deg)" },
                }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 12, mb: 0.75 }}>¡Mira este ejemplo!</Typography>
                  <Typography id="mobile-payment-guide-description" sx={{ fontSize: 13, lineHeight: 1.5 }}>
                    {step.description}
                  </Typography>
                </Box>
              </Stack>
              <Typography sx={{ mb: 1, fontSize: 12, color: "#E1DFFF", textAlign: "center" }}>
                Busca el monto que necesitas · Referencia en USD
              </Typography>
              <Box sx={{ overflow: "hidden", bgcolor: "common.white", borderRadius: 3 }}>
                <Table aria-label="Plazos según el monto solicitado" size="small" sx={{ tableLayout: "fixed", "& th, & td": { px: 1.25, py: 1.25, fontSize: 12, color: "secondary.main", borderColor: "#EEEDF6" }, "& th": { fontWeight: 800, bgcolor: "#F0EFFF" }, "& tr:last-child td": { borderBottom: 0 } }}>
                  <TableHead><TableRow>
                    <TableCell sx={{ width: "56%" }}>Monto en USD</TableCell>
                    <TableCell align="center">Cuotas</TableCell>
                    <TableCell align="right">Plazo</TableCell>
                  </TableRow></TableHead>
                  <TableBody>{financingGuideRanges.map((range) => (
                    <TableRow key={range.amount} sx={{ bgcolor: range.installments === 3 ? "#FFF3E8" : undefined }}>
                      <TableCell>{range.amount}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>{range.installments}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{range.days} días</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
              <Typography sx={{ mt: 1.5, fontSize: 12, lineHeight: 1.5, color: "#E1DFFF", textAlign: "center" }}>
                Solicitas y pagas en bolívares. El rango corresponde al equivalente del monto en dólares.
              </Typography>
            </>
          )}

          {stepIndex === 2 && (
            <>
              <Stack component="ul" spacing={1.25} sx={{ mt: 2, mb: 0, p: 0, listStyle: "none" }}>
                {["El monto y la comisión de tu pago", "Tus cuotas y sus fechas de vencimiento", "El plazo y los intereses de tu plan"].map((label) => (
                  <Stack component="li" direction="row" spacing={1} key={label} sx={{ alignItems: "center" }}>
                    <CheckCircleOutlineRounded aria-hidden="true" sx={{ color: "#FFB36B", fontSize: 20 }} />
                    <Typography sx={{ fontSize: 13 }}>{label}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Typography sx={{ mt: 2, fontSize: 12, lineHeight: 1.5, color: "#E1DFFF", textAlign: "center" }}>
                Desde el día 16 se generan intereses sobre el saldo pendiente, según tu plan.
              </Typography>
            </>
          )}
        </DialogContent>

        <Box sx={{ flexShrink: 0, px: 2.5, pt: 1, pb: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "center" }} aria-label={`Paso ${stepIndex + 1} de ${paymentGuideSteps.length}`}>
            {paymentGuideSteps.map((item, index) => (
              <IconButton aria-label={`Ir al paso ${index + 1}: ${item.title}`} aria-current={index === stepIndex ? "step" : undefined} key={item.title} onClick={() => setStepIndex(index)} sx={{ color: "common.white" }}>
                <Box sx={{ width: index === stepIndex ? 22 : 7, height: 7, borderRadius: 8, bgcolor: index === stepIndex ? themeTokens.color.accent : "rgba(255,255,255,0.35)" }} />
              </IconButton>
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            {stepIndex > 0 && (
              <IconButton aria-label="Volver al paso anterior" onClick={() => changeStep(-1)} sx={{ color: "common.white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8 }}>
                <ArrowBackRounded />
              </IconButton>
            )}
            <Button fullWidth onClick={isLastStep ? closeGuide : () => changeStep(1)} endIcon={isLastStep ? undefined : <ArrowForwardRounded />} variant="contained" sx={{ bgcolor: themeTokens.color.accent, color: "secondary.main", borderRadius: 8, fontWeight: 800, "&:hover": { bgcolor: "#FF9638" } }}>
              {isLastStep ? "Entendido, usar mi disponible" : stepIndex === 0 ? "Conoce tus plazos" : "Siguiente"}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
}
