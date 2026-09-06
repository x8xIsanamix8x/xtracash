"use client";

import { useState } from "react";
import Link from "next/link";
import { ExpandMoreRounded, WestRounded } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

import { frequentlyAskedQuestions } from "../data/frequentlyAskedQuestions";

export function HelpCenterView() {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [expandedQuestion, setExpandedQuestion] = useState<string | false>(false);

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "background.default", pb: "calc(32px + env(safe-area-inset-bottom))" }}>
      <Box sx={{ bgcolor: "secondary.main", color: "secondary.contrastText", borderRadius: "0 0 28px 28px", pt: "calc(16px + env(safe-area-inset-top))", pb: { xs: 5, sm: 7 }, px: { xs: 3, sm: 4 } }}>
        <Container maxWidth="sm" disableGutters>
          <Stack spacing={{ xs: 4.5, sm: 5.5 }}>
            <Button component={Link} href="/" startIcon={<WestRounded />} sx={{ alignSelf: "flex-start", color: "common.white", px: 0, minHeight: 44 }}>
              Volver
            </Button>
            <Stack spacing={2}>
              <Typography component="h1" sx={{ fontSize: { xs: "clamp(1.5rem, 6.5vw, 2rem)", sm: "2.5rem" }, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}>
                ¿Cómo podemos ayudarte?
              </Typography>
              <Typography sx={{ maxWidth: 440, color: alpha(themeTokens.color.onDark, 0.82), fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                Encuentra respuestas claras sobre tu financiamiento y el uso de la aplicación.
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: { xs: -2.5, sm: -3.5 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ p: { xs: 2.25, sm: 3.5 }, borderRadius: 3, bgcolor: "background.paper", boxShadow: `0 16px 40px ${alpha(themeTokens.color.brandDeep, 0.1)}` }}>
          <Typography component="h2" variant="h5" sx={{ mb: 2.5, color: "secondary.main", fontWeight: 800, lineHeight: 1.2 }}>
            Preguntas frecuentes
          </Typography>
          <Stack spacing={1.5}>
            {frequentlyAskedQuestions.map((item, index) => (
              <Accordion
                disableGutters
                expanded={expandedQuestion === item.question}
                key={item.question}
                onChange={(_event, expanded) => setExpandedQuestion(expanded ? item.question : false)}
                slotProps={{ transition: { timeout: prefersReducedMotion ? 0 : 180 } }}
                sx={{
                  m: "0 !important",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "12px !important",
                  boxShadow: "none",
                  overflow: "hidden",
                  transformOrigin: "top center",
                  transition: "border-color 180ms ease",
                  "&::before": { display: "none" },
                  "&.Mui-expanded": {
                    m: "0 !important",
                    borderColor: "primary.main",
                  },
                }}
              >
                <AccordionSummary
                  aria-controls={`faq-panel-${index}`}
                  expandIcon={<ExpandMoreRounded />}
                  id={`faq-trigger-${index}`}
                  sx={{ minHeight: 56, px: 2, "&.Mui-expanded": { minHeight: 56 }, "& .MuiAccordionSummary-content": { my: 1.25, pr: 1 }, "& .MuiAccordionSummary-content.Mui-expanded": { my: 1.25 }, "& .MuiAccordionSummary-expandIconWrapper": { color: "primary.main" } }}
                >
                  <Typography sx={{ color: "secondary.main", fontWeight: 700, lineHeight: 1.35 }}>{item.question}</Typography>
                </AccordionSummary>
                <AccordionDetails aria-labelledby={`faq-trigger-${index}`} id={`faq-panel-${index}`} sx={{ px: 2, pt: 0, pb: 2.25 }}>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>{item.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
