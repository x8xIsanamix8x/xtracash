import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

import { TERMS_AND_CONDITIONS } from "../termsAndConditions";

type TermsLineKind =
  | "acceptance"
  | "article"
  | "body"
  | "bullet"
  | "documentTitle"
  | "formula"
  | "module"
  | "numberedItem"
  | "paragraphNotice"
  | "spacer";

function getLineKind(line: string, index: number): TermsLineKind {
  if (line.length === 0) return "spacer";
  if (index === 0) return "documentTitle";
  if (line.startsWith("MÓDULO ")) return "module";
  if (line.startsWith("ARTÍCULO ") || line === "ACEPTACIÓN FINAL") return "article";
  if (line.startsWith("PARÁGRAFO ")) return "paragraphNotice";
  if (line.startsWith("•")) return "bullet";
  if (/^\d+\.\t/.test(line)) return "numberedItem";
  if (line.startsWith("(") && line.endsWith(")")) return "formula";
  if (line.startsWith("EL USUARIO DECLARA HABER LEÍDO")) return "acceptance";
  return "body";
}

function renderEmphasizedLead(line: string) {
  const colonIndex = line.indexOf(":");
  const hasEmphasizedLead =
    colonIndex >= 0 && /^(?:\d+(?:\.\d+)?\.|[a-z]\)|•|PARÁGRAFO )/.test(line);

  if (!hasEmphasizedLead) return line;

  return (
    <>
      <Box component="span" sx={{ fontWeight: 750 }}>
        {line.slice(0, colonIndex + 1)}
      </Box>
      {line.slice(colonIndex + 1)}
    </>
  );
}

export function TermsAndConditionsContent() {
  const lines = TERMS_AND_CONDITIONS.split("\r\n");

  return (
    <Box
      component="article"
      id="registration-terms-description"
      sx={{ color: themeTokens.color.preLoginNavy }}
    >
      {lines.map((line, index) => {
        const kind = getLineKind(line, index);
        const sharedTextSx = {
          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          lineHeight: 1.75,
          overflowWrap: "anywhere",
          tabSize: 2,
          whiteSpace: "pre-wrap",
        } as const;

        if (kind === "spacer") {
          return <Box aria-hidden="true" key={index} sx={{ height: 8 }} />;
        }

        if (kind === "documentTitle") {
          return (
            <Typography
              key={index}
              sx={{
                ...sharedTextSx,
                mb: 3,
                border: `1px solid ${alpha(themeTokens.color.preLoginPrimary, 0.16)}`,
                borderRadius: 2.5,
                bgcolor: alpha(themeTokens.color.preLoginPrimary, 0.07),
                color: themeTokens.color.preLoginNavy,
                fontSize: { xs: "0.9375rem", sm: "1.0625rem" },
                fontWeight: 800,
                lineHeight: 1.5,
                p: { xs: 1.75, sm: 2.25 },
                textAlign: "center",
              }}
            >
              {line}
            </Typography>
          );
        }

        if (kind === "module") {
          return (
            <Typography
              component="h3"
              key={index}
              sx={{
                ...sharedTextSx,
                mt: 3,
                mb: 1.75,
                borderRadius: 2,
                bgcolor: themeTokens.color.preLoginNavy,
                color: themeTokens.color.paper,
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                fontWeight: 800,
                letterSpacing: "0.015em",
                px: 1.75,
                py: 1.25,
              }}
            >
              {line}
            </Typography>
          );
        }

        if (kind === "article") {
          const isFinalHeading = line === "ACEPTACIÓN FINAL";

          return (
            <Typography
              component="h4"
              key={index}
              sx={{
                ...sharedTextSx,
                mt: isFinalHeading ? 3.5 : 2.75,
                mb: 1.25,
                borderLeft: `4px solid ${
                  isFinalHeading
                    ? themeTokens.color.brandLogo
                    : themeTokens.color.preLoginPrimary
                }`,
                color: themeTokens.color.preLoginNavy,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                fontWeight: 800,
                lineHeight: 1.45,
                pl: 1.25,
              }}
            >
              {line}
            </Typography>
          );
        }

        if (kind === "paragraphNotice") {
          return (
            <Typography
              component="p"
              key={index}
              sx={{
                ...sharedTextSx,
                my: 1.75,
                border: `1px solid ${alpha(themeTokens.color.brandLogo, 0.3)}`,
                borderRadius: 2,
                bgcolor: alpha(themeTokens.color.brandLogo, 0.06),
                p: 1.5,
              }}
            >
              {renderEmphasizedLead(line)}
            </Typography>
          );
        }

        if (kind === "formula") {
          return (
            <Typography
              component="p"
              key={index}
              sx={{
                ...sharedTextSx,
                my: 1,
                borderRadius: 1.5,
                bgcolor: alpha(themeTokens.color.preLoginPrimary, 0.06),
                fontWeight: 650,
                px: 1.5,
                py: 1,
                textAlign: "center",
              }}
            >
              {line}
            </Typography>
          );
        }

        if (kind === "bullet" || kind === "numberedItem") {
          return (
            <Typography
              component="p"
              key={index}
              sx={{
                ...sharedTextSx,
                mb: 1,
                borderRadius: 1.5,
                bgcolor: themeTokens.color.paper,
                boxShadow: `inset 3px 0 0 ${alpha(themeTokens.color.preLoginPrimary, 0.2)}`,
                px: 1.5,
                py: 1,
              }}
            >
              {renderEmphasizedLead(line)}
            </Typography>
          );
        }

        if (kind === "acceptance") {
          return (
            <Typography
              component="p"
              key={index}
              sx={{
                ...sharedTextSx,
                border: `1px solid ${alpha(themeTokens.color.preLoginPrimary, 0.2)}`,
                borderRadius: 2,
                bgcolor: themeTokens.color.paper,
                fontWeight: 750,
                p: 1.75,
              }}
            >
              {line}
            </Typography>
          );
        }

        return (
          <Typography component="p" key={index} sx={{ ...sharedTextSx, mb: 1.25 }}>
            {renderEmphasizedLead(line)}
          </Typography>
        );
      })}
    </Box>
  );
}
