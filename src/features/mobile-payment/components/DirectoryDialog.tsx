"use client";

import { useMemo, useState } from "react";
import {
  AccountBalanceRounded,
  CloseRounded,
  ContactsRounded,
  ReplayRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Slide,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";

import {
  formatBank,
  getBank,
  maskDocument,
  maskPhone,
} from "../format";
import type {
  Bank,
  DirectoryContact,
  DirectoryStatus,
} from "../types";

type DirectoryDialogProps = Readonly<{
  banks: readonly Bank[];
  contacts: readonly DirectoryContact[];
  open: boolean;
  status: DirectoryStatus;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (contactId: string) => void;
}>;

function DirectoryTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

export function DirectoryDialog({
  banks,
  contacts,
  open,
  status,
  onClose,
  onRetry,
  onSelect,
}: DirectoryDialogProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const [search, setSearch] = useState("");

  const filteredContacts = useMemo(() => {
    const normalizedSearch = normalizeSearch(search.trim());
    const phoneSearch = search.replace(/\D/g, "");

    if (!normalizedSearch && !phoneSearch) {
      return contacts;
    }

    return contacts.filter((contact) => (
      normalizeSearch(contact.name).includes(normalizedSearch)
      || (phoneSearch && contact.phone.includes(phoneSearch))
    ));
  }, [contacts, search]);

  const closeDirectory = () => {
    setSearch("");
    onClose();
  };

  const selectContact = (contactId: string) => {
    setSearch("");
    onSelect(contactId);
  };

  return (
    <Dialog
      aria-labelledby="directory-title"
      fullWidth
      maxWidth="sm"
      onClose={closeDirectory}
      open={open}
      scroll="paper"
      slots={{ transition: DirectoryTransition }}
      slotProps={{
        container: {
          sx: { alignItems: { xs: "flex-end", md: "center" } },
        },
        paper: {
          sx: {
            m: { xs: 0, md: 2 },
            width: "100%",
            maxHeight: "80dvh",
            borderRadius: { xs: "24px 24px 0 0", md: 3 },
          },
        },
      }}
      transitionDuration={prefersReducedMotion ? 0 : undefined}
    >
      <DialogTitle
        id="directory-title"
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          pr: 7,
          color: "secondary.main",
          fontWeight: 700,
        }}
      >
        <ContactsRounded color="primary" />
        Elegir del directorio
      </DialogTitle>
      <IconButton
        aria-label="Cerrar directorio"
        onClick={closeDirectory}
        type="button"
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <CloseRounded />
      </IconButton>

      <DialogContent
        sx={{ pb: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        <Stack spacing={2}>
          {status === "ready" && (
            <TextField
              autoFocus={isDesktop}
              fullWidth
              label="Buscar contacto"
              name="directorySearch"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o teléfono"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded />
                    </InputAdornment>
                  ),
                },
              }}
              value={search}
            />
          )}

          {status === "loading" && (
            <Stack
              aria-busy="true"
              aria-live="polite"
              aria-label="Cargando directorio"
              role="status"
              spacing={1.5}
            >
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  height={72}
                  variant="rounded"
                  sx={{
                    "@media (prefers-reduced-motion: reduce)": {
                      animation: "none",
                    },
                  }}
                />
              ))}
            </Stack>
          )}

          {status === "error" && (
            <Stack
              aria-live="assertive"
              role="alert"
              spacing={2}
              sx={{ alignItems: "center", py: 4, textAlign: "center" }}
            >
              <Typography
                component="h2"
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: 700 }}
              >
                No pudimos cargar tu directorio
              </Typography>
              <Typography color="text.secondary">
                Inténtalo nuevamente para consultar tus contactos.
              </Typography>
              <Button
                onClick={onRetry}
                startIcon={<ReplayRounded />}
                type="button"
                variant="contained"
              >
                Reintentar
              </Button>
            </Stack>
          )}

          {status === "empty" && (
            <Stack
              aria-live="polite"
              role="status"
              spacing={1}
              sx={{ alignItems: "center", py: 4, textAlign: "center" }}
            >
              <ContactsRounded color="primary" sx={{ width: 44, height: 44 }} />
              <Typography
                component="h2"
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: 700 }}
              >
                Aún no tienes contactos
              </Typography>
              <Typography color="text.secondary">
                Puedes cerrar el directorio e ingresar un destinatario nuevo.
              </Typography>
            </Stack>
          )}

          {status === "ready" && filteredContacts.length === 0 && (
            <Typography
              aria-live="polite"
              color="text.secondary"
              role="status"
              sx={{ py: 4, textAlign: "center" }}
            >
              No encontramos contactos con esa búsqueda.
            </Typography>
          )}

          {status === "ready" && filteredContacts.length > 0 && (
            <List disablePadding aria-label="Contactos del directorio">
              {filteredContacts.map((contact) => {
                const bank = getBank(banks, contact.bankCode);

                return (
                  <ListItemButton
                    key={contact.id}
                    onClick={() => selectContact(contact.id)}
                    sx={{
                      minHeight: 72,
                      borderRadius: 2,
                      mb: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <AccountBalanceRounded
                      aria-hidden="true"
                      color="primary"
                      sx={{ mr: 1.5 }}
                    />
                    <ListItemText
                      primary={contact.name}
                      secondary={`${bank ? formatBank(bank) : "Banco no disponible"} · ${maskPhone(contact.phone)} · ${maskDocument(contact.nationality, contact.documentNumber)}`}
                      slotProps={{
                        primary: { sx: { fontWeight: 700 } },
                        secondary: {
                          sx: { overflowWrap: "anywhere" },
                        },
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
