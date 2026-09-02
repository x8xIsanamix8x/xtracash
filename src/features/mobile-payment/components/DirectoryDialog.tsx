"use client";

import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CloseRounded,
  ContactsRounded,
  DeleteOutlineRounded,
  PersonOutlineRounded,
  ReplayRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Slide,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";

import { APP_BOTTOM_NAVIGATION_HEIGHT } from "@/components/AppBottomNavigation";

import {
  formatBank,
  formatDocument,
  formatPhone,
  getBank,
} from "../format";
import type {
  Bank,
  DirectoryContact,
  DirectoryStatus,
} from "../types";

export type DirectoryFocusDestination =
  | Readonly<{ type: "contact"; contactId: string }>
  | Readonly<{ type: "search" | "empty" }>;

export type DirectoryFocusRequest = DirectoryFocusDestination & Readonly<{
  requestId: number;
}>;

type DirectoryDialogProps = Readonly<{
  banks: readonly Bank[];
  contacts: readonly DirectoryContact[];
  contactToDelete: DirectoryContact | null;
  deleteError: string;
  focusRequest: DirectoryFocusRequest | null;
  isDeleting: boolean;
  open: boolean;
  status: DirectoryStatus;
  suppressFocusRestore: boolean;
  suppressDeleteFocusRestore: boolean;
  onCancelDelete: () => void;
  onClose: () => void;
  onConfirmDelete: () => void;
  onDeleteDialogExited: () => void;
  onExited: () => void;
  onFocusHandled: (requestId: number) => void;
  onRequestDelete: (
    contactId: string,
    focusDestination: DirectoryFocusDestination,
  ) => void;
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
  contactToDelete,
  deleteError,
  focusRequest,
  isDeleting,
  open,
  status,
  suppressFocusRestore,
  suppressDeleteFocusRestore,
  onCancelDelete,
  onClose,
  onConfirmDelete,
  onDeleteDialogExited,
  onExited,
  onFocusHandled,
  onRequestDelete,
  onRetry,
  onSelect,
}: DirectoryDialogProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const emptyTitleRef = useRef<HTMLHeadingElement>(null);
  const contactRefs = useRef(new Map<string, HTMLDivElement>());

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

  useEffect(() => {
    if (focusRequest === null) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      if (focusRequest.type === "contact") {
        contactRefs.current.get(focusRequest.contactId)?.focus({
          preventScroll: true,
        });
      } else if (focusRequest.type === "search") {
        searchRef.current?.focus({ preventScroll: true });
      } else {
        emptyTitleRef.current?.focus({ preventScroll: true });
      }

      onFocusHandled(focusRequest.requestId);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [focusRequest, onFocusHandled]);

  const closeDirectory = () => {
    setSearch("");
    onClose();
  };

  const selectContact = (contactId: string) => {
    setSearch("");
    onSelect(contactId);
  };

  const requestDelete = (
    event: MouseEvent<HTMLButtonElement>,
    contactId: string,
  ) => {
    event.stopPropagation();
    const visibleIndex = filteredContacts.findIndex(
      (contact) => contact.id === contactId,
    );
    const remainingVisibleContacts = filteredContacts.filter(
      (contact) => contact.id !== contactId,
    );
    const nextVisibleContact = remainingVisibleContacts[visibleIndex]
      ?? remainingVisibleContacts.at(-1);
    const remainingContactCount = contacts.length - 1;
    const focusDestination: DirectoryFocusDestination = nextVisibleContact
      ? { type: "contact", contactId: nextVisibleContact.id }
      : remainingContactCount > 0
        ? { type: "search" }
        : { type: "empty" };

    onRequestDelete(contactId, focusDestination);
  };

  const closeDeleteConfirmation = () => {
    if (!isDeleting) {
      onCancelDelete();
    }
  };

  const isDirectoryEmpty = status === "empty"
    || (status === "ready" && contacts.length === 0);

  return (
    <Dialog
      aria-labelledby="directory-title"
      disableRestoreFocus={suppressFocusRestore}
      fullWidth
      maxWidth="sm"
      onClose={closeDirectory}
      open={open}
      scroll="paper"
      slots={{ transition: DirectoryTransition }}
      slotProps={{
        transition: { onExited },
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
      sx={{
        bottom: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT}px + env(safe-area-inset-bottom))`,
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
        sx={{
          px: { xs: 2, sm: 3 },
          pb: "calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        <Stack spacing={1.5}>
          {status === "ready" && contacts.length > 0 && (
            <TextField
              autoFocus={isDesktop}
              fullWidth
              label="Buscar contacto"
              name="directorySearch"
              inputRef={searchRef}
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

          {isDirectoryEmpty && (
            <Stack
              aria-live="polite"
              role="status"
              spacing={1}
              sx={{ alignItems: "center", py: 4, textAlign: "center" }}
            >
              <ContactsRounded color="primary" sx={{ width: 44, height: 44 }} />
              <Typography
                component="h2"
                ref={emptyTitleRef}
                tabIndex={-1}
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: 700 }}
              >
                Todavía no existen beneficiarios guardados
              </Typography>
              <Typography color="text.secondary">
                Puedes cerrar el directorio e ingresar un destinatario nuevo.
              </Typography>
            </Stack>
          )}

          {status === "ready"
            && contacts.length > 0
            && filteredContacts.length === 0 && (
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
                  <ListItem
                    disablePadding
                    key={contact.id}
                    secondaryAction={
                      <IconButton
                        aria-label={`Eliminar a ${contact.name} del directorio`}
                        color="error"
                        onClick={(event) => requestDelete(event, contact.id)}
                        sx={{ minWidth: 44, minHeight: 44 }}
                        type="button"
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    }
                    sx={{
                      mb: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <ListItemButton
                      onClick={() => selectContact(contact.id)}
                      ref={(node) => {
                        if (node) {
                          contactRefs.current.set(contact.id, node);
                        } else {
                          contactRefs.current.delete(contact.id);
                        }
                      }}
                      sx={{ minHeight: 84, borderRadius: 2, py: 1.25, pr: 8 }}
                    >
                      <PersonOutlineRounded
                        aria-hidden="true"
                        color="primary"
                        sx={{ mr: 1.5, flexShrink: 0 }}
                      />
                      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                          {contact.name}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          variant="body2"
                          sx={{
                            minWidth: 0,
                            whiteSpace: "normal",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {bank
                            ? formatBank(bank)
                            : `${contact.bankCode} · Banco no disponible`}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {formatPhone(contact.phone)} · {formatDocument(
                            contact.documentType,
                            contact.documentNumber,
                          )}
                        </Typography>
                      </Stack>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Stack>
      </DialogContent>

      <Dialog
        aria-busy={isDeleting}
        aria-describedby="delete-directory-contact-description"
        aria-labelledby="delete-directory-contact-title"
        disableRestoreFocus={suppressDeleteFocusRestore}
        fullWidth
        maxWidth="xs"
        onClose={(_event, reason) => {
          if (
            !isDeleting
            && (reason === "backdropClick" || reason === "escapeKeyDown")
          ) {
            onCancelDelete();
          }
        }}
        open={contactToDelete !== null}
        sx={{
          bottom: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
        slotProps={{
          transition: { onExited: onDeleteDialogExited },
        }}
      >
        <DialogTitle
          id="delete-directory-contact-title"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          Eliminar beneficiario
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-directory-contact-description">
            ¿Deseas eliminar a {contactToDelete?.name} de tu directorio? Esta
            acción no afectará tus operaciones anteriores.
          </DialogContentText>
          <Typography
            aria-live={deleteError ? "assertive" : "polite"}
            color="error"
            role={deleteError ? "alert" : isDeleting ? "status" : undefined}
            sx={{ minHeight: "1.5em", mt: 2 }}
            variant="body2"
          >
            {deleteError || (isDeleting ? "Eliminando…" : "\u00a0")}
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
              disabled={isDeleting}
              onClick={closeDeleteConfirmation}
              sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 128 } }}
              type="button"
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button
              aria-busy={isDeleting}
              color="error"
              disabled={isDeleting}
              onClick={onConfirmDelete}
              startIcon={
                isDeleting
                  ? <CircularProgress aria-hidden="true" color="inherit" size={18} />
                  : <DeleteOutlineRounded />
              }
              sx={{ width: { xs: "100%", sm: 176 }, minHeight: 48 }}
              type="button"
              variant="contained"
            >
              {isDeleting ? "Eliminando…" : deleteError ? "Reintentar" : "Eliminar"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
