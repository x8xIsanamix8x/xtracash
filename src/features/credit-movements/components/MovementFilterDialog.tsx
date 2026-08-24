"use client";

import { TuneRounded } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
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
}: MovementFilterDialogProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <Dialog
      aria-labelledby="movement-filter-title"
      fullWidth
      maxWidth="xs"
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
            borderRadius: { xs: "24px 24px 0 0", sm: 3 },
          },
        },
      }}
      transitionDuration={prefersReducedMotion ? 0 : undefined}
    >
      <DialogTitle
        id="movement-filter-title"
        sx={{ color: "secondary.main", fontWeight: 700 }}
      >
        Filtrar movimientos
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary" variant="body2">
            Los filtros consultan los movimientos disponibles en el historial.
          </Typography>

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
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Divider />

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
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          gap: 1,
          px: 3,
          pb: "calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        <Button onClick={onClose} type="button">
          Cancelar
        </Button>
        <Button
          onClick={onApply}
          startIcon={<TuneRounded />}
          type="button"
          variant="contained"
        >
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
