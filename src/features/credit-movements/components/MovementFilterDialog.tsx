"use client";

import { TuneRounded } from "@mui/icons-material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Slide,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";

import {
  movementStatusFilterOptions,
  movementTypeFilterOptions,
} from "../presentation";
import type {
  CreditMovementFilters,
  CreditMovementStatusFilter,
  CreditMovementTypeFilter,
} from "../types";

type MovementFilterDialogProps = Readonly<{
  pendingFilters: CreditMovementFilters;
  open: boolean;
  onApply: () => void;
  onChange: (filters: CreditMovementFilters) => void;
  onClose: () => void;
  variant?: "standard" | "marketplace";
}>;

function FilterTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function MovementFilterDialog({
  pendingFilters,
  open,
  onApply,
  onChange,
  onClose,
  variant = "standard",
}: MovementFilterDialogProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMarketplace = variant === "marketplace";

  return (
    <Dialog
      aria-labelledby="movement-filter-title"
      fullWidth
      maxWidth={isMarketplace ? "sm" : "xs"}
      onClose={onClose}
      open={open}
      slots={{ transition: FilterTransition }}
      slotProps={{
        container: {
          sx: { alignItems: { xs: "flex-end", sm: "center" } },
        },
        paper: {
          sx: {
            m: { xs: 0, sm: 2 },
            width: "100%",
            maxHeight: "min(86dvh, 720px)",
            borderRadius: isMarketplace ? { xs: "24px 24px 0 0", sm: 4 } : { xs: "24px 24px 0 0", sm: 3 },
            bgcolor: isMarketplace ? "#F0EFFF" : undefined,
            color: isMarketplace ? "#101044" : undefined,
            boxShadow: isMarketplace ? "none" : undefined,
          },
        },
      }}
      transitionDuration={prefersReducedMotion ? 0 : undefined}
    >
      <DialogTitle
        id="movement-filter-title"
        sx={isMarketplace ? { display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", pt: 3, px: 3, color: "#111", fontWeight: 700, textAlign: "center" } : { color: "secondary.main", fontWeight: 700 }}
      >
        {isMarketplace && <IconButton aria-label="Cerrar filtros" onClick={onClose} sx={{ border: "1.5px solid currentColor", width: 36, height: 36 }}><CloseRounded fontSize="small" /></IconButton>}
        {isMarketplace ? "Filtros" : "Filtrar movimientos"}
        {isMarketplace && <Box aria-hidden="true" />}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={isMarketplace ? 1.5 : 2}>
          {!isMarketplace && <Typography color="text.secondary" variant="body2">
            Los filtros consultan los movimientos disponibles en el historial.
          </Typography>}

          <FormControl fullWidth>
            <FormLabel sx={{ color: "secondary.main", fontWeight: 700 }}>
              Tipo
            </FormLabel>
            <RadioGroup
              aria-label="Tipo de movimiento"
              onChange={(event) => onChange({
                ...pendingFilters,
                type: event.target.value as CreditMovementTypeFilter,
              })}
              value={pendingFilters.type}
            >
              {movementTypeFilterOptions.map((option) => (
                <FormControlLabel
                  control={(
                    <Radio autoFocus={pendingFilters.type === option.value} />
                  )}
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  sx={{
                    minHeight: 48,
                    mx: 0,
                    px: 1,
                    borderRadius: 2,
                    flexDirection: isMarketplace ? "row-reverse" : undefined,
                    justifyContent: isMarketplace ? "space-between" : undefined,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Divider sx={isMarketplace ? { borderColor: "rgba(16,16,68,.35)" } : undefined} />

          <FormControl fullWidth>
            <FormLabel sx={{ color: "secondary.main", fontWeight: 700 }}>
              Estado
            </FormLabel>
            <RadioGroup
              aria-label="Estado del movimiento"
              onChange={(event) => onChange({
                ...pendingFilters,
                status: event.target.value as CreditMovementStatusFilter,
              })}
              value={pendingFilters.status}
            >
              {movementStatusFilterOptions.map((option) => (
                <FormControlLabel
                  control={<Radio />}
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  sx={{
                    minHeight: 48,
                    mx: 0,
                    px: 1,
                    borderRadius: 2,
                    flexDirection: isMarketplace ? "row-reverse" : undefined,
                    justifyContent: isMarketplace ? "space-between" : undefined,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={isMarketplace ? { display: "flex", flexDirection: "column", gap: 1, px: 3, pb: "calc(20px + env(safe-area-inset-bottom))", "& > :not(style) ~ :not(style)": { ml: 0 } } : { gap: 1, px: 3, pb: "calc(20px + env(safe-area-inset-bottom))" }}
      >
        <Button onClick={onClose} fullWidth={isMarketplace} type="button" variant={isMarketplace ? "outlined" : undefined} sx={isMarketplace ? { minHeight: 56, borderRadius: 99, fontWeight: 700, bgcolor: "#fff" } : undefined}>
          Cancelar
        </Button>
        <Button
          onClick={onApply}
          startIcon={isMarketplace ? undefined : <TuneRounded />}
          fullWidth={isMarketplace}
          type="button"
          variant="contained"
          sx={isMarketplace ? { minHeight: 56, borderRadius: 99, fontWeight: 700, order: -1 } : undefined}
        >
          {isMarketplace ? "Aplicar filtros" : "Aplicar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
