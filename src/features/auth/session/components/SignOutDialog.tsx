import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

type SignOutDialogProps = Readonly<{
  open: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>;

export function SignOutDialog({
  open,
  isLoading,
  onCancel,
  onConfirm,
}: SignOutDialogProps) {
  return (
    <Dialog
      aria-busy={isLoading}
      aria-describedby="sign-out-description"
      aria-labelledby="sign-out-title"
      fullWidth
      maxWidth="xs"
      onClose={(_event, reason) => {
        if (!isLoading && (reason === "backdropClick" || reason === "escapeKeyDown")) {
          onCancel();
        }
      }}
      open={open}
    >
      <DialogTitle id="sign-out-title" sx={{ color: "secondary.main", fontWeight: 700 }}>
        ¿Cerrar sesión?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="sign-out-description">
          Tendrás que ingresar nuevamente para consultar tu línea de crédito.
        </DialogContentText>
        <Typography
          aria-live="polite"
          color="text.secondary"
          role="status"
          sx={{ minHeight: "1.5em", mt: 2 }}
          variant="body2"
        >
          {isLoading ? "Cerrando sesión…" : "\u00a0"}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={1.5}
          sx={{ width: "100%", justifyContent: "flex-end" }}
        >
          <Button
            autoFocus
            disabled={isLoading}
            onClick={onCancel}
            sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 128 } }}
            type="button"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            aria-busy={isLoading}
            color="error"
            disabled={isLoading}
            onClick={onConfirm}
            startIcon={
              isLoading
                ? <CircularProgress aria-hidden="true" color="inherit" size={18} />
                : undefined
            }
            sx={{
              width: { xs: "100%", sm: 176 },
              minHeight: 48,
              flexShrink: 0,
            }}
            type="button"
            variant="contained"
          >
            {isLoading ? "Cerrando sesión…" : "Cerrar sesión"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
