"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBackRounded, ErrorOutlineRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import { isCreditLineUsable } from "@/features/credit-line";
import {
  AccountSummaryServiceError,
  getAccountSummary,
} from "@/features/home/services/accountSummary";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import {
  DirectoryDialog,
  type DirectoryFocusDestination,
  type DirectoryFocusRequest,
} from "./components/DirectoryDialog";
import { RecipientDetailsStep } from "./components/RecipientDetailsStep";
import { ReviewStep } from "./components/ReviewStep";
import { TransferResultView } from "./components/TransferResultView";
import {
  formatAmountOnBlur,
  formatBsAmount,
  getBank,
  parseAmountToMinorUnits,
} from "./format";
import {
  confirmMobilePayment,
  deleteDirectoryContact,
  getMobilePaymentOptions,
  initiateMobilePayment,
  MobilePaymentServiceError,
} from "./services/mobilePayment";
import type {
  Bank,
  DetailsErrors,
  DetailsField,
  DirectoryContact,
  DirectoryStatus,
  InitiatedPayment,
  ManualRecipientData,
  MobilePaymentStep,
  RecipientMode,
  ResolvedRecipient,
  TransferResult,
  TransferResultStatus,
} from "./types";
import { validateDetails } from "./validation";

type PaymentContextStatus = "loading" | "ready" | "error" | "unavailable";

const initialManualRecipient: ManualRecipientData = {
  bankCode: "",
  documentType: "V",
  documentNumber: "",
  phone: "",
  saveToDirectory: false,
  name: "",
};

const successfulStatuses = new Set([
  "CONFIRMADA",
  "CONFIRMADO",
  "EXITOSA",
  "EXITOSO",
]);
const processingStatuses = new Set([
  "INICIADA",
  "CREADA",
  "CREADO",
  "PROCESANDO",
  "EN_PROCESO",
  "ACEPTADA",
  "PENDIENTE",
  "PENDIENTE_CONFIRMACION",
]);
const rejectedStatuses = new Set([
  "RECHAZADA",
  "RECHAZADO",
  "FALLIDA",
  "FALLIDO",
]);

function mapTransferStatus(value: string): TransferResultStatus | null {
  const status = value.trim().toUpperCase();
  if (successfulStatuses.has(status)) return "success";
  if (processingStatuses.has(status)) return "processing";
  if (rejectedStatuses.has(status)) return "rejected";
  return null;
}

function serviceErrorMessage(error: MobilePaymentServiceError) {
  if (error.type === "business") {
    return "La operación no cumple las condiciones actuales de tu financiamiento.";
  }
  if (error.type === "conflict") {
    return "La operación cambió de estado. Revisa los datos antes de continuar.";
  }
  if (error.type === "not_found") {
    return "No encontramos la operación solicitada.";
  }
  if (error.type === "invalid") {
    return "No pudimos validar la información recibida. Inténtalo nuevamente.";
  }
  return "No pudimos comunicarnos con el servicio. Inténtalo nuevamente.";
}

export function MobilePaymentView() {
  const router = useRouter();
  const [contextStatus, setContextStatus] =
    useState<PaymentContextStatus>("loading");
  const [step, setStep] = useState<MobilePaymentStep>("details");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("choice");
  const [manualRecipient, setManualRecipient] =
    useState<ManualRecipientData>(initialManualRecipient);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [availableMinorUnits, setAvailableMinorUnits] = useState(0);
  const [availableLabel, setAvailableLabel] = useState("Bs. 0,00");
  const [banks, setBanks] = useState<readonly Bank[]>([]);
  const [detailsErrors, setDetailsErrors] = useState<DetailsErrors>({});
  const [focusField, setFocusField] = useState<DetailsField | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [lineError, setLineError] = useState("");
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [directoryEntries, setDirectoryEntries] =
    useState<readonly DirectoryContact[]>([]);
  const [directoryStatus, setDirectoryStatus] =
    useState<DirectoryStatus>("loading");
  const [contactToDeleteId, setContactToDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [suppressDeleteFocusRestore, setSuppressDeleteFocusRestore] =
    useState(false);
  const [directoryFocusRequest, setDirectoryFocusRequest] =
    useState<DirectoryFocusRequest | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [initiatedPayment, setInitiatedPayment] =
    useState<InitiatedPayment | null>(null);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [navigationNotice, setNavigationNotice] = useState("");
  const contextRequestRef = useRef<AbortController | null>(null);
  const paymentRequestRef = useRef<AbortController | null>(null);
  const deleteRequestRef = useRef<AbortController | null>(null);
  const pendingDeleteFocusRef = useRef<DirectoryFocusDestination | null>(null);
  const focusRequestIdRef = useRef(0);
  const reviewTitleRef = useRef<HTMLHeadingElement>(null);
  const resultTitleRef = useRef<HTMLHeadingElement>(null);

  const selectedContact = useMemo(
    () => directoryEntries.find((contact) => contact.id === selectedContactId) ?? null,
    [directoryEntries, selectedContactId],
  );
  const contactToDelete = useMemo(
    () => directoryEntries.find((contact) => contact.id === contactToDeleteId) ?? null,
    [contactToDeleteId, directoryEntries],
  );

  const resolvedRecipient = useMemo<ResolvedRecipient | null>(() => {
    if (recipientMode === "directory" && selectedContact) {
      return {
        id: selectedContact.id,
        name: selectedContact.name,
        bankCode: selectedContact.bankCode,
        documentType: selectedContact.documentType,
        documentNumber: selectedContact.documentNumber,
        phone: selectedContact.phone,
        saveToDirectory: false,
      };
    }

    if (recipientMode === "manual") {
      return {
        id: null,
        name: manualRecipient.name.trim(),
        bankCode: manualRecipient.bankCode,
        documentType: manualRecipient.documentType,
        documentNumber: manualRecipient.documentNumber,
        phone: manualRecipient.phone,
        saveToDirectory: manualRecipient.saveToDirectory,
      };
    }

    return null;
  }, [manualRecipient, recipientMode, selectedContact]);

  const loadPaymentContext = useCallback(() => {
    contextRequestRef.current?.abort();
    const controller = new AbortController();
    contextRequestRef.current = controller;

    void (async () => {
      try {
        const summary = await getAccountSummary(controller.signal);
        if (controller.signal.aborted) return;

        if (
          summary.accountStatus !== "ACTIVE"
          || summary.product === null
          || !isCreditLineUsable(summary.payments.delinquencyStage)
        ) {
          setContextStatus("unavailable");
          return;
        }

        const nextAvailableMinorUnits = parseAmountToMinorUnits(
          summary.product.availableBs,
        );
        if (nextAvailableMinorUnits === null) {
          setContextStatus("error");
          return;
        }

        const options = await getMobilePaymentOptions(controller.signal);
        if (controller.signal.aborted) return;

        setAvailableMinorUnits(nextAvailableMinorUnits);
        setAvailableLabel(formatBsAmount(summary.product.availableBs));
        setBanks(options.banks);
        setDirectoryEntries(options.contacts);
        setDirectoryStatus(options.contacts.length > 0 ? "ready" : "empty");
        setContextStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (
          (error instanceof AccountSummaryServiceError
            || error instanceof MobilePaymentServiceError)
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
          return;
        }
        if (
          (error instanceof AccountSummaryServiceError
            || error instanceof MobilePaymentServiceError)
          && error.type === "aborted"
        ) {
          return;
        }

        setDirectoryStatus("error");
        setContextStatus("error");
      } finally {
        if (contextRequestRef.current === controller) {
          contextRequestRef.current = null;
        }
      }
    })();
  }, [router]);

  useEffect(() => {
    void loadPaymentContext();
    return () => {
      contextRequestRef.current?.abort();
      paymentRequestRef.current?.abort();
      deleteRequestRef.current?.abort();
    };
  }, [loadPaymentContext]);

  useEffect(() => {
    if (step === "review") {
      reviewTitleRef.current?.focus();
    } else if (step === "result") {
      resultTitleRef.current?.focus({ preventScroll: true });
    }
  }, [step]);

  const clearDetailsError = (field: DetailsField) => {
    setDetailsErrors((current) => ({ ...current, [field]: undefined }));
    setLineError("");
  };

  const chooseManual = () => {
    setRecipientMode("manual");
    clearDetailsError("recipient");
  };

  const openDirectory = () => {
    setIsDirectoryOpen(true);
    clearDetailsError("recipient");
  };

  const selectDirectoryContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setRecipientMode("directory");
    setIsDirectoryOpen(false);
    clearDetailsError("recipient");
  };

  const requestDeleteContact = (
    contactId: string,
    focusDestination: DirectoryFocusDestination,
  ) => {
    if (isDeletingContact) return;
    pendingDeleteFocusRef.current = focusDestination;
    setDeleteError("");
    setContactToDeleteId(contactId);
  };

  const cancelDeleteContact = () => {
    if (isDeletingContact) return;
    pendingDeleteFocusRef.current = null;
    setDeleteError("");
    setContactToDeleteId(null);
  };

  const confirmDeleteContact = () => {
    if (contactToDelete === null || isDeletingContact || deleteRequestRef.current) {
      return;
    }

    const controller = new AbortController();
    const contactId = contactToDelete.id;
    const contactName = contactToDelete.name;
    deleteRequestRef.current = controller;
    setDeleteError("");
    setIsDeletingContact(true);

    void deleteDirectoryContact(contactId, controller.signal)
      .then(() => {
        if (controller.signal.aborted) return;
        setDirectoryEntries((current) => {
          const nextContacts = current.filter((contact) => contact.id !== contactId);
          if (nextContacts.length === 0) setDirectoryStatus("empty");
          return nextContacts;
        });
        if (selectedContactId === contactId) {
          setSelectedContactId(null);
          setRecipientMode("choice");
        }
        setNavigationNotice(`Se eliminó a ${contactName} del directorio`);
        setSuppressDeleteFocusRestore(true);
        setContactToDeleteId(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof MobilePaymentServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
          return;
        }
        setDeleteError(
          `No pudimos eliminar a ${contactName}. Inténtalo nuevamente o cancela para conservarlo en tu directorio.`,
        );
      })
      .finally(() => {
        if (deleteRequestRef.current === controller) {
          deleteRequestRef.current = null;
          setIsDeletingContact(false);
        }
      });
  };

  const completeDeleteDialogExit = () => {
    const focusDestination = pendingDeleteFocusRef.current;
    if (focusDestination !== null && suppressDeleteFocusRestore) {
      focusRequestIdRef.current += 1;
      setDirectoryFocusRequest({
        ...focusDestination,
        requestId: focusRequestIdRef.current,
      });
      pendingDeleteFocusRef.current = null;
    }
    setSuppressDeleteFocusRestore(false);
  };

  const completeDirectoryFocus = (requestId: number) => {
    setDirectoryFocusRequest((current) => (
      current?.requestId === requestId ? null : current
    ));
  };

  const closeDirectory = () => {
    if (isDeletingContact) return;
    cancelDeleteContact();
    setIsDirectoryOpen(false);
  };

  const changeRecipient = () => {
    setStep("details");
    setRecipientMode("choice");
    setSelectedContactId(null);
    setInitiatedPayment(null);
    setTransferResult(null);
    setLineError("");
    setDetailsErrors({});
  };

  const updateManualRecipient = (
    field: keyof ManualRecipientData,
    value: string | boolean,
  ) => {
    setManualRecipient((current) => ({
      ...current,
      [field]: value,
    }) as ManualRecipientData);

    if (field === "bankCode") clearDetailsError("bankCode");
    if (field === "documentNumber") clearDetailsError("documentNumber");
    if (field === "phone") clearDetailsError("phone");
    if (field === "name") clearDetailsError("name");
  };

  const updateAmount = (value: string) => {
    setAmount(value);
    clearDetailsError("amount");
  };

  const continueToReview = () => {
    if (
      contextStatus !== "ready"
      || isInitiating
      || paymentRequestRef.current !== null
    ) {
      return;
    }

    const validation = validateDetails({
      recipientMode,
      manualRecipient,
      selectedContactId,
      amount,
      availableMinorUnits,
    });
    setDetailsErrors(validation.errors);
    setFocusField(validation.firstInvalidField);
    setFocusRequest((current) => current + 1);
    setLineError("");

    if (
      validation.firstInvalidField !== null
      || validation.amountMinorUnits === null
      || resolvedRecipient === null
    ) {
      return;
    }

    const controller = new AbortController();
    paymentRequestRef.current = controller;
    setIsInitiating(true);
    setAmount(formatAmountOnBlur(amount));

    void initiateMobilePayment(
      {
        amountMinorUnits: validation.amountMinorUnits,
        recipient: resolvedRecipient,
      },
      controller.signal,
    )
      .then((payment) => {
        if (controller.signal.aborted) return;
        setInitiatedPayment(payment);
        setTransferResult(null);
        setStep("review");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof MobilePaymentServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
          return;
        }
        setLineError(
          error instanceof MobilePaymentServiceError
            ? serviceErrorMessage(error)
            : "No pudimos preparar la solicitud. Inténtalo nuevamente.",
        );
      })
      .finally(() => {
        if (paymentRequestRef.current === controller) {
          paymentRequestRef.current = null;
          setIsInitiating(false);
        }
      });
  };

  const returnToDetails = () => {
    if (isConfirming) return;
    setInitiatedPayment(null);
    setStep("details");
  };

  const reviewRecipient = initiatedPayment?.recipient ?? null;
  const reviewBank = reviewRecipient
    ? getBank(banks, reviewRecipient.bankCode)
    : undefined;

  const submitTransfer = () => {
    if (
      isConfirming
      || paymentRequestRef.current !== null
      || initiatedPayment === null
      || reviewRecipient === null
      || reviewBank === undefined
    ) {
      return;
    }

    const controller = new AbortController();
    paymentRequestRef.current = controller;
    setIsConfirming(true);
    setLineError("");

    void confirmMobilePayment(initiatedPayment.operationId, controller.signal)
      .then((confirmation) => {
        if (controller.signal.aborted) return;
        const status = mapTransferStatus(confirmation.status);
        const confirmedAmountMinorUnits = parseAmountToMinorUnits(
          confirmation.amountBs,
        );
        if (status === null || confirmedAmountMinorUnits === null) {
          setNavigationNotice(
            "La operación fue recibida, pero no pudimos interpretar su estado. Vuelve al inicio antes de intentar otro pago.",
          );
          return;
        }

        setTransferResult({
          status,
          amountMinorUnits: confirmedAmountMinorUnits,
          beneficiaryName: reviewRecipient.name,
          bankCode: reviewBank.code,
          bankName: reviewBank.name,
          documentType: reviewRecipient.documentType,
          documentNumber: reviewRecipient.documentNumber,
          phone: reviewRecipient.phone,
          transactionDate: confirmation.resolvedAt,
          ...(confirmation.bankReference
            ? { bankReference: confirmation.bankReference }
            : {}),
          ...(confirmation.message ? { userMessage: confirmation.message } : {}),
        });
        setStep("result");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof MobilePaymentServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
          return;
        }
        const message = error instanceof MobilePaymentServiceError
          && (error.type === "network" || error.type === "server")
          ? "No pudimos confirmar la transferencia. Puedes reintentar sin duplicarla."
          : error instanceof MobilePaymentServiceError
            ? serviceErrorMessage(error)
            : "No pudimos confirmar la transferencia. Puedes reintentar sin duplicarla.";
        setLineError(message);
      })
      .finally(() => {
        if (paymentRequestRef.current === controller) {
          paymentRequestRef.current = null;
          setIsConfirming(false);
        }
      });
  };

  const resetTransaction = () => {
    paymentRequestRef.current?.abort();
    paymentRequestRef.current = null;
    setStep("details");
    setRecipientMode("choice");
    setManualRecipient(initialManualRecipient);
    setSelectedContactId(null);
    setAmount("");
    setDetailsErrors({});
    setFocusField(null);
    setLineError("");
    setIsInitiating(false);
    setIsConfirming(false);
    setInitiatedPayment(null);
    setTransferResult(null);
  };

  const retryPaymentContext = () => {
    setContextStatus("loading");
    setDirectoryStatus("loading");
    setLineError("");
    loadPaymentContext();
  };

  const startNewPayment = () => {
    setNavigationNotice("");
    resetTransaction();
    retryPaymentContext();
  };

  const reviewRejectedTransfer = () => {
    setTransferResult(null);
    setInitiatedPayment(null);
    setStep("details");
  };

  const returnHome = () => {
    setNavigationNotice("");
    resetTransaction();
    router.replace("/home");
  };

  const renderPaymentContent = () => {
    if (contextStatus === "loading") {
      return (
        <Stack
          aria-live="polite"
          role="status"
          spacing={2}
          sx={{ flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center" }}
        >
          <CircularProgress aria-hidden="true" />
          <Typography color="text.secondary">Cargando Pago Móvil…</Typography>
        </Stack>
      );
    }

    if (contextStatus === "error") {
      return (
        <Stack spacing={2} sx={{ flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <ErrorOutlineRounded color="error" sx={{ fontSize: 48 }} />
          <Typography component="h1" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            No pudimos cargar Pago Móvil
          </Typography>
          <Typography color="text.secondary">
            Revisa tu conexión e inténtalo nuevamente.
          </Typography>
          <Button onClick={retryPaymentContext} type="button" variant="contained">
            Reintentar
          </Button>
        </Stack>
      );
    }

    if (contextStatus === "unavailable") {
      return (
        <Stack spacing={2} sx={{ flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <ErrorOutlineRounded color="warning" sx={{ fontSize: 48 }} />
          <Typography component="h1" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            Pago Móvil no está disponible
          </Typography>
          <Typography color="text.secondary">
            Tu cuenta o financiamiento no permite realizar esta operación en este momento.
          </Typography>
          <Button component={Link} href="/home" type="button" variant="contained">
            Volver al inicio
          </Button>
        </Stack>
      );
    }

    if (step === "details") {
      return (
        <RecipientDetailsStep
          amount={amount}
          availableLabel={availableLabel}
          banks={banks}
          errors={detailsErrors}
          focusField={focusField}
          focusRequest={focusRequest}
          isSubmitting={isInitiating}
          manualRecipient={manualRecipient}
          onAmountChange={updateAmount}
          onChangeRecipient={changeRecipient}
          onChooseManual={chooseManual}
          onContinue={continueToReview}
          onManualChange={updateManualRecipient}
          onOpenDirectory={openDirectory}
          recipientMode={recipientMode}
          selectedContact={selectedContact}
        />
      );
    }

    if (step === "review" && initiatedPayment && reviewRecipient && reviewBank) {
      return (
        <ReviewStep
          amountLabel={formatBsAmount(initiatedPayment.amountBs)}
          availableLabel={formatBsAmount(initiatedPayment.availableBs)}
          bank={reviewBank}
          feeLabel={`${formatBsAmount(initiatedPayment.feeBs)} (${initiatedPayment.feePercentage}%)`}
          isSubmitting={isConfirming}
          onBack={returnToDetails}
          onConfirm={submitTransfer}
          rateLabel={`Bs. ${initiatedPayment.rateValue.replace(".", ",")} · ${initiatedPayment.rateSource}`}
          recipient={reviewRecipient}
          titleRef={reviewTitleRef}
          totalLabel={formatBsAmount(initiatedPayment.totalBs)}
        />
      );
    }

    if (step === "result" && transferResult) {
      return (
        <TransferResultView
          onBackHome={returnHome}
          onNewPayment={startNewPayment}
          onNotice={setNavigationNotice}
          onReview={reviewRejectedTransfer}
          result={transferResult}
          titleRef={resultTitleRef}
        />
      );
    }

    return null;
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        pt: "calc(16px + env(safe-area-inset-top))",
        pb: "calc(104px + env(safe-area-inset-bottom))",
      }}
    >
      <Container
        maxWidth="md"
        sx={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Stack component="header" direction="row" spacing={1} sx={{ minHeight: 48, alignItems: "center" }}>
          <IconButton aria-label="Volver al inicio" color="primary" component={Link} href="/home">
            <ArrowBackRounded />
          </IconButton>
          <Typography sx={{ color: themeTokens.color.brandLogo, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Impúlsate Móvil
          </Typography>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            maxWidth: 720,
            minHeight: step === "result" ? 0 : { xs: 520, sm: 600 },
            flex: step === "result" ? "0 0 auto" : "1 0 auto",
            display: "flex",
            flexDirection: "column",
            mx: "auto",
            mt: 2,
            p: step === "result" ? 0 : { xs: 2, sm: 3.5 },
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          {lineError && (
            <Typography color="error" role="alert" sx={{ mb: 2 }}>
              {lineError}
            </Typography>
          )}
          {renderPaymentContent()}
        </Paper>
      </Container>

      <DirectoryDialog
        banks={banks}
        contacts={directoryEntries}
        contactToDelete={contactToDelete}
        deleteError={deleteError}
        focusRequest={directoryFocusRequest}
        isDeleting={isDeletingContact}
        onCancelDelete={cancelDeleteContact}
        onClose={closeDirectory}
        onConfirmDelete={confirmDeleteContact}
        onDeleteDialogExited={completeDeleteDialogExit}
        onFocusHandled={completeDirectoryFocus}
        onRequestDelete={requestDeleteContact}
        onRetry={retryPaymentContext}
        onSelect={selectDirectoryContact}
        open={isDirectoryOpen}
        status={directoryStatus}
        suppressDeleteFocusRestore={suppressDeleteFocusRestore}
      />

      <AppBottomNavigation
        activeItem="mobile-payment"
        onUnavailable={(label) => setNavigationNotice(
          `${label} estará disponible en la siguiente etapa.`,
        )}
      />
      <Snackbar
        autoHideDuration={2800}
        message={(
          <Box component="span" aria-live="polite" role="status">
            {navigationNotice}
          </Box>
        )}
        onClose={() => setNavigationNotice("")}
        open={Boolean(navigationNotice)}
        sx={{ bottom: "calc(72px + env(safe-area-inset-bottom)) !important" }}
      />
    </Box>
  );
}
