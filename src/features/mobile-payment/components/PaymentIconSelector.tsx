"use client";

import { useState } from "react";
import {
  CloseRounded,
  MoreHorizRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";

import {
  paymentIconComponents,
} from "@/features/payment-purpose/PaymentPurposeIcon";
import {
  getPaymentIconLabel,
  paymentIconIds,
} from "../paymentPurpose";
import type { PaymentIconId } from "../types";

const iconOptions = paymentIconIds.map((id) => ({
  id,
  label: getPaymentIconLabel(id),
  Icon: paymentIconComponents[id],
}));

const iconSize = "4.25rem";

type PaymentIconSelectorProps = Readonly<{
  disabled: boolean;
  selectedIcon: PaymentIconId | null;
  onSelect: (icon: PaymentIconId | null) => void;
}>;

function BottomSheetTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function PaymentIconSelector({
  disabled,
  selectedIcon,
  onSelect,
}: PaymentIconSelectorProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const selectedOption = iconOptions.find((option) => option.id === selectedIcon);
  const previewOptions = selectedOption
    ? [selectedOption, ...iconOptions.filter((option) => option.id !== selectedIcon).slice(0, 3)]
    : iconOptions.slice(0, 4);

  const selectIcon = (icon: PaymentIconId) => {
    onSelect(selectedIcon === icon ? null : icon);
    setOpen(false);
  };

  const renderIcon = ({ id, label, Icon }: (typeof iconOptions)[number]) => (
    <Button
      aria-label={selectedIcon === id ? `Quitar ícono ${label}` : `Seleccionar ícono ${label}`}
      aria-pressed={selectedIcon === id}
      disabled={disabled}
      key={id}
      onClick={() => selectIcon(id)}
      sx={{
        flex: `0 0 ${iconSize}`,
        width: iconSize,
        minWidth: iconSize,
        height: iconSize,
        minHeight: iconSize,
        p: 0,
        borderRadius: "50%",
        bgcolor: "common.white",
        color: "primary.main",
        border: selectedIcon === id ? "2px solid #FF7900" : "2px solid transparent",
        boxShadow: "0 0.25rem 0.75rem rgba(10, 12, 71, 0.14)",
        "&:hover": { bgcolor: "#ECEBFF" },
      }}
      type="button"
      variant="text"
    >
      <Icon sx={{ fontSize: "1.75rem" }} />
    </Button>
  );

  return (
    <>
      <Box
        aria-label="Íconos para el pago"
        role="group"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          p: "0.75rem",
          borderRadius: 2.5,
          bgcolor: "#F4F5F8",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minWidth: 0,
            gap: "0.75rem",
            py: "0.25rem",
            overflowX: "auto",
            overscrollBehaviorX: "contain",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
          }}
        >
          {previewOptions.map(renderIcon)}
        </Box>
        <Button
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Ver todos los íconos"
          disabled={disabled}
          onClick={() => setOpen(true)}
          sx={{
            flex: `0 0 ${iconSize}`,
            width: iconSize,
            minWidth: iconSize,
            height: iconSize,
            minHeight: iconSize,
            p: 0,
            borderRadius: "50%",
            bgcolor: "common.white",
            color: "primary.main",
            boxShadow: "0 0.25rem 0.75rem rgba(10, 12, 71, 0.14)",
            "&:hover": { bgcolor: "#ECEBFF" },
          }}
          type="button"
          variant="text"
        >
          <MoreHorizRounded sx={{ fontSize: "1.75rem" }} />
        </Button>
      </Box>

      <Dialog
        aria-labelledby="payment-icon-dialog-title"
        fullWidth
        maxWidth="sm"
        onClose={() => setOpen(false)}
        open={open}
        scroll="paper"
        slots={{ transition: BottomSheetTransition }}
        slotProps={{
          container: {
            sx: {
              alignItems: { xs: "flex-end", md: "center" },
              height: { xs: "100dvh", md: "100%" },
            },
          },
          paper: {
            sx: {
              m: { xs: 0, md: 2 },
              width: "100%",
              maxHeight: { xs: "82dvh", md: "80dvh" },
              borderRadius: { xs: "1.5rem 1.5rem 0 0", md: 3 },
            },
          },
        }}
        transitionDuration={prefersReducedMotion ? 0 : undefined}
      >
        <DialogTitle id="payment-icon-dialog-title" sx={{ color: "secondary.main", fontWeight: 700, pr: 7 }}>
          Seleccionar ícono
        </DialogTitle>
        <IconButton
          aria-label="Cerrar selección de ícono"
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", top: 8, right: 8 }}
          type="button"
        >
          <CloseRounded />
        </IconButton>
        <DialogContent
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, ${iconSize})`,
            justifyContent: "center",
            gap: "1.25rem",
            p: "1.5rem",
            pb: "calc(1.5rem + env(safe-area-inset-bottom))",
            bgcolor: "#F4F5F8",
          }}
        >
          {iconOptions.map(renderIcon)}
        </DialogContent>
      </Dialog>
    </>
  );
}
