"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EmailOutlined,
  ExpandMoreRounded,
  OpenInNewRounded,
  WestRounded,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

import { frequentlyAskedQuestionGroups } from "../data/frequentlyAskedQuestions";

export function HelpCenterView() {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [expandedQuestion, setExpandedQuestion] = useState<string | false>(false);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        pb: "calc(32px + env(safe-area-inset-bottom))",
      }}
    >
      <Box
        sx={{
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          borderRadius: "0 0 28px 28px",
          pt: "calc(16px + env(safe-area-inset-top))",
          pb: { xs: 5, sm: 7 },
          px: { xs: 3, sm: 4 },
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Stack spacing={{ xs: 4.5, sm: 5.5 }}>
            <Button
              component={Link}
              href="/"
              startIcon={<WestRounded />}
              sx={{ alignSelf: "flex-start", color: "common.white", px: 0, minHeight: 44 }}
            >
              Volver
            </Button>
            <Stack spacing={2}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: "clamp(1.5rem, 6.5vw, 2rem)", sm: "2.5rem" },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                ¿Cómo podemos ayudarte?
              </Typography>
              <Typography
                sx={{
                  maxWidth: 440,
                  color: alpha(themeTokens.color.onDark, 0.82),
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                }}
              >
                Encuentra respuestas claras sobre tu financiamiento y el uso de la aplicación.
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: { xs: -2.5, sm: -3.5 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            p: { xs: 2.25, sm: 3.5 },
            borderRadius: 3,
            bgcolor: "background.paper",
            boxShadow: `0 16px 40px ${alpha(themeTokens.color.brandDeep, 0.1)}`,
          }}
        >
          <Typography
            component="h2"
            variant="h5"
            sx={{ mb: 3, color: "secondary.main", fontWeight: 800, lineHeight: 1.2 }}
          >
            Preguntas frecuentes
          </Typography>

          <Stack sx={{ gap: 3 }}>
            {frequentlyAskedQuestionGroups.map((group) => (
              <Box
                component="section"
                key={group.id}
                aria-labelledby={`faq-group-${group.id}`}
                sx={(theme) => ({
                  p: { xs: 1.25, sm: 1.75 },
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.045),
                })}
              >
                <Typography
                  component="h3"
                  id={`faq-group-${group.id}`}
                  sx={{
                    mb: 1.5,
                    px: 0.5,
                    color: "secondary.main",
                    fontSize: "0.875rem",
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  {group.title}
                </Typography>

                <Stack sx={{ gap: 1.5 }}>
                  {group.questions.map((item, index) => {
                    const questionId = `${group.id}-${index}`;
                    const isEmailAction = item.action?.href.startsWith("mailto:") ?? false;

                    return (
                      <Accordion
                        disableGutters
                        expanded={expandedQuestion === questionId}
                        key={item.question}
                        onChange={(_event, expanded) => (
                          setExpandedQuestion(expanded ? questionId : false)
                        )}
                        slotProps={{
                          transition: { timeout: prefersReducedMotion ? 0 : 180 },
                        }}
                        sx={{
                          m: "0 !important",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "12px !important",
                          bgcolor: "background.paper",
                          boxShadow: "none",
                          overflow: "hidden",
                          transformOrigin: "top center",
                          transition: "border-color 180ms ease, box-shadow 180ms ease",
                          "&::before": { display: "none" },
                          "&.Mui-expanded": {
                            m: "0 !important",
                            borderColor: "primary.main",
                            boxShadow: `0 8px 20px ${alpha(themeTokens.color.brandDeep, 0.08)}`,
                          },
                        }}
                      >
                        <AccordionSummary
                          aria-controls={`faq-panel-${questionId}`}
                          expandIcon={<ExpandMoreRounded />}
                          id={`faq-trigger-${questionId}`}
                          sx={{
                            minHeight: 56,
                            px: 2,
                            "&.Mui-expanded": { minHeight: 56 },
                            "& .MuiAccordionSummary-content": { my: 1.25, pr: 1 },
                            "& .MuiAccordionSummary-content.Mui-expanded": { my: 1.25 },
                            "& .MuiAccordionSummary-expandIconWrapper": { color: "primary.main" },
                          }}
                        >
                          <Typography sx={{ color: "secondary.main", fontWeight: 700, lineHeight: 1.35 }}>
                            {item.question}
                          </Typography>
                        </AccordionSummary>

                        <AccordionDetails
                          aria-labelledby={`faq-trigger-${questionId}`}
                          id={`faq-panel-${questionId}`}
                          sx={{ px: 2, pt: 0, pb: 2.25 }}
                        >
                          <Stack sx={{ gap: 1.5 }}>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
                              {item.answer}
                            </Typography>

                            {item.details && (
                              <Box
                                component="dl"
                                sx={{
                                  m: 0,
                                  display: "grid",
                                  gap: 1,
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: "#F4F5F8",
                                }}
                              >
                                {item.details.map((detail) => (
                                  <Stack
                                    component="div"
                                    direction="row"
                                    key={detail.label}
                                    sx={{ justifyContent: "space-between", gap: 2 }}
                                  >
                                    <Typography component="dt" color="text.secondary" variant="body2">
                                      {detail.label}
                                    </Typography>
                                    <Typography
                                      component="dd"
                                      sx={{ m: 0, color: "secondary.main", fontWeight: 700, textAlign: "right" }}
                                      variant="body2"
                                    >
                                      {detail.value}
                                    </Typography>
                                  </Stack>
                                ))}
                              </Box>
                            )}

                            {item.note && (
                              <Box
                                sx={(theme) => ({
                                  p: 1.5,
                                  borderLeft: "3px solid",
                                  borderColor: "primary.main",
                                  borderRadius: "0 8px 8px 0",
                                  bgcolor: alpha(theme.palette.primary.main, 0.07),
                                })}
                              >
                                <Typography sx={{ color: "secondary.main", fontWeight: 700 }} variant="body2">
                                  Importante
                                </Typography>
                                <Typography color="text.secondary" variant="body2">
                                  {item.note}
                                </Typography>
                              </Box>
                            )}

                            {item.action && (
                              <Button
                                component="a"
                                href={item.action.href}
                                rel={isEmailAction ? undefined : "noreferrer"}
                                startIcon={isEmailAction ? <EmailOutlined /> : <OpenInNewRounded />}
                                target={isEmailAction ? undefined : "_blank"}
                                sx={{
                                  alignSelf: "flex-start",
                                  justifyContent: "flex-start",
                                  minHeight: 44,
                                  px: 1,
                                  overflowWrap: "anywhere",
                                  textAlign: "left",
                                }}
                                variant="text"
                              >
                                {item.action.prefix
                                  ? `${item.action.prefix}: ${item.action.label}`
                                  : item.action.label}
                              </Button>
                            )}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
