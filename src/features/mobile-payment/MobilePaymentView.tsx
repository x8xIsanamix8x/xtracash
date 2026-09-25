"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ErrorOutlineRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { AppBackButton } from "@/components/AppBackButton";
import {
  APP_BOTTOM_NAVIGATION_HEIGHT,
  AppBottomNavigation,
  appDestinationHref,
  type AppDestination,
} from "@/components/AppBottomNavigation";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";
import {
  getMobilePaymentRestrictionMessage,
  isMobilePaymentAccessAllowed,
} from "./accessStatus";
import {
  DirectoryDialog,
  type DirectoryFocusDestination,
  type DirectoryFocusRequest,
} from "./components/DirectoryDialog";
import { AddRecipientDialog } from "./components/AddRecipientDialog";
import { RecipientDetailsStep } from "./components/RecipientDetailsStep";
import { ReviewStep } from "./components/ReviewStep";
import { TransferResultView } from "./components/TransferResultView";
import {
  formatAmountOnBlur,
  formatBsAmount,
  formatPercentage,
  formatRateLabel,
  getBank,
  parseAmountToMinorUnits,
} from "./format";
import {
  getMobilePaymentNavigationDecision,
  hasMobilePaymentProgress,
} from "./navigation";
import { recipientDataFromContact } from "./recipientDraft";
import {
  previewAvailableBs,
  previewBanks,
  previewContacts,
} from "./previewContext";
import {
  confirmMobilePayment,
  deleteDirectoryContact,
  getMobilePaymentContext,
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
  MobilePaymentAccessStatus,
  MobilePaymentStep,
  PaymentPurposeDraft,
  RecipientMode,
  ResolvedRecipient,
  TransferResult,
  TransferResultStatus,
} from "./types";
import { validateDetails } from "./validation";

type PaymentContextStatus = "loading" | "ready" | "preview" | "error";

const enableLocalPreview = process.env.NODE_ENV === "development";

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
  if (error.accessStatus !== null) {
    return getMobilePaymentRestrictionMessage(error.accessStatus)
      ?? "No puedes solicitar un Pago Móvil en este momento.";
  }
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

function initiationErrorMessage(error: MobilePaymentServiceError) {
  if (error.detail) {
    return error.detail;
  }

  if (error.type === "conflict") {
    return "El monto más la comisión puede superar tu disponible. Reduce el monto y pulsa Continuar para intentarlo nuevamente.";
  }

  return serviceErrorMessage(error);
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
  const [purpose, setPurpose] = useState<PaymentPurposeDraft>({ concept: "", iconId: null });
  const [amount, setAmount] = useState("");
  const [availableMinorUnits, setAvailableMinorUnits] = useState(0);
  const [availableLabel, setAvailableLabel] = useState("Bs. 0,00");
  const [accessStatus, setAccessStatus] =
    useState<MobilePaymentAccessStatus>("active");
  const [banks, setBanks] = useState<readonly Bank[]>([]);
  const [detailsErrors, setDetailsErrors] = useState<DetailsErrors>({});
  const [focusField, setFocusField] = useState<DetailsField | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [lineError, setLineError] = useState("");
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isAddRecipientOpen, setIsAddRecipientOpen] = useState(false);
  const [suppressDirectoryFocusRestore, setSuppressDirectoryFocusRestore] =
    useState(false);
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
  const [pendingDestination, setPendingDestination] =
    useState<AppDestination | null>(null);
  const contextRequestRef = useRef<AbortController | null>(null);
  const paymentRequestRef = useRef<AbortController | null>(null);
  const deleteRequestRef = useRef<AbortController | null>(null);
  const pendingDeleteFocusRef = useRef<DirectoryFocusDestination | null>(null);
  const focusRequestIdRef = useRef(0);
  const reviewTitleRef = useRef<HTMLHeadingElement>(null);
  const detailsTitleRef = useRef<HTMLHeadingElement>(null);
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

    if (recipientMode === "manual" || recipientMode === "choice") {
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

    const showLocalPreview = () => {
      setAvailableMinorUnits(parseAmountToMinorUnits(previewAvailableBs) ?? 0);
      setAvailableLabel(formatBsAmount(previewAvailableBs));
      setAccessStatus("active");
      setBanks(previewBanks);
      setDirectoryEntries(previewContacts);
      setDirectoryStatus("ready");
      setContextStatus("preview");
    };

    void (async () => {
      try {
        const paymentContext = await getMobilePaymentContext(controller.signal);
        if (controller.signal.aborted) return;

        const nextAvailableMinorUnits = parseAmountToMinorUnits(
          paymentContext.availableBs,
        );
        if (nextAvailableMinorUnits === null) {
          if (enableLocalPreview) showLocalPreview();
          else setContextStatus("error");
          return;
        }

        setAvailableMinorUnits(nextAvailableMinorUnits);
        setAvailableLabel(formatBsAmount(paymentContext.availableBs));
        setAccessStatus(paymentContext.accessStatus);
        setBanks(paymentContext.banks);
        setDirectoryEntries(paymentContext.contacts);
        setDirectoryStatus(paymentContext.contacts.length > 0 ? "ready" : "empty");
        setContextStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (
          error instanceof MobilePaymentServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
          return;
        }
        if (
          error instanceof MobilePaymentServiceError
          && error.type === "aborted"
        ) {
          return;
        }

        if (enableLocalPreview) {
          showLocalPreview();
        } else {
          setDirectoryStatus("error");
          setContextStatus("error");
        }
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
    if (contextStatus !== "ready" && contextStatus !== "preview") return;

    const animationFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });

      if (step === "details") {
        detailsTitleRef.current?.focus({ preventScroll: true });
      } else if (step === "review") {
        reviewTitleRef.current?.focus({ preventScroll: true });
      } else if (step === "result") {
        resultTitleRef.current?.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [contextStatus, step]);

  const clearDetailsError = (field: DetailsField) => {
    setDetailsErrors((current) => ({ ...current, [field]: undefined }));
    setLineError("");
  };

  const openDirectory = () => {
    setIsDirectoryOpen(true);
    clearDetailsError("recipient");
  };

  const openAddRecipient = useCallback(() => {
    if (recipientMode !== "manual") {
      setManualRecipient(initialManualRecipient);
      setSelectedContactId(null);
    }
    setLineError("");
    setIsAddRecipientOpen(true);
  }, [recipientMode]);

  const closeAddRecipient = () => {
    if (!isInitiating) setIsAddRecipientOpen(false);
  };

  const completeAddRecipient = () => {
    setSelectedContactId(null);
    setRecipientMode("manual");
    closeAddRecipient();
  };

  const fillRecipientFromContact = (contactId: string) => {
    const contact = directoryEntries.find((entry) => entry.id === contactId);
    if (!contact) return false;

    setManualRecipient(recipientDataFromContact(contact));
    setSelectedContactId(contactId);
    setRecipientMode("directory");
    setDetailsErrors((current) => (
      current.amount ? { amount: current.amount } : {}
    ));
    setFocusField(null);
    setLineError("");
    return true;
  };

  const selectDirectoryContact = (contactId: string) => {
    if (!fillRecipientFromContact(contactId)) return;
    setSuppressDirectoryFocusRestore(true);
    setIsDirectoryOpen(false);
  };

  const selectVisibleContact = (contactId: string) => {
    fillRecipientFromContact(contactId);
  };

  const requestDeleteContact = (
    contactId: string,
    focusDestination: DirectoryFocusDestination,
  ) => {
    if (contextStatus === "preview") {
      setNavigationNotice("Los beneficiarios de ejemplo no se pueden modificar.");
      return;
    }
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
          setManualRecipient(initialManualRecipient);
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
    setSuppressDirectoryFocusRestore(false);
    setIsDirectoryOpen(false);
  };

  const completeDirectoryExit = () => {
    if (!suppressDirectoryFocusRestore) return;

    window.requestAnimationFrame(() => {
      detailsTitleRef.current?.focus({ preventScroll: true });
      setSuppressDirectoryFocusRestore(false);
    });
  };

  const changeRecipient = () => {
    setStep("details");
    setRecipientMode("choice");
    setSelectedContactId(null);
    setManualRecipient(initialManualRecipient);
    setInitiatedPayment(null);
    setTransferResult(null);
    setLineError("");
    setDetailsErrors({});
  };

  const updateManualRecipient = (
    field: keyof ManualRecipientData,
    value: string | boolean,
  ) => {
    if (manualRecipient[field] === value) return;
    if (recipientMode !== "manual") {
      setSelectedContactId(null);
      setRecipientMode("manual");
    }
    setManualRecipient((current) => ({
      ...current,
      [field]: value,
    }) as ManualRecipientData);
    setLineError("");

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
      (contextStatus !== "ready" && contextStatus !== "preview")
      || isInitiating
      || paymentRequestRef.current !== null
    ) {
      return;
    }

    if (!isMobilePaymentAccessAllowed(accessStatus)) {
      setLineError(
        getMobilePaymentRestrictionMessage(accessStatus)
          ?? "No puedes solicitar un Pago Móvil en este momento.",
      );
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

    if (contextStatus === "preview") {
      setNavigationNotice("Vista previa: no se enviará ninguna solicitud de pago.");
      return;
    }

    const controller = new AbortController();
    paymentRequestRef.current = controller;
    setIsInitiating(true);
    setAmount(formatAmountOnBlur(amount));

    void initiateMobilePayment(
      {
        amountMinorUnits: validation.amountMinorUnits,
        concept: purpose.concept,
        iconId: purpose.iconId,
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
        if (
          error instanceof MobilePaymentServiceError
          && error.accessStatus !== null
        ) {
          setAccessStatus(error.accessStatus);
          setLineError("");
          return;
        }
        setLineError(
          error instanceof MobilePaymentServiceError
            ? initiationErrorMessage(error)
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
  const reviewBank = reviewRecipient && initiatedPayment
    ? getBank(banks, reviewRecipient.bankCode) ?? {
      code: reviewRecipient.bankCode,
      name: initiatedPayment.recipientBankName,
    }
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
        const status = confirmation.isPending
          ? "processing"
          : mapTransferStatus(confirmation.status);
        const confirmedAmountMinorUnits = parseAmountToMinorUnits(
          confirmation.amountBs,
        );
        const confirmedTotalMinorUnits = parseAmountToMinorUnits(
          confirmation.totalBs,
        );
        const confirmedFeeMinorUnits = parseAmountToMinorUnits(
          confirmation.feeBs,
        );
        if (
          status === null
          || confirmedAmountMinorUnits === null
          || confirmedTotalMinorUnits === null
          || confirmedFeeMinorUnits === null
        ) {
          setNavigationNotice(
            "La operación fue recibida, pero no pudimos interpretar su estado. Vuelve al inicio antes de intentar otro pago.",
          );
          return;
        }

        setTransferResult({
          status,
          amountMinorUnits: confirmedAmountMinorUnits,
          totalMinorUnits: confirmedTotalMinorUnits,
          feeMinorUnits: confirmedFeeMinorUnits,
          feePercentage: confirmation.feePercentage,
          label: confirmation.label,
          beneficiaryName: confirmation.recipient.name,
          bankCode: confirmation.recipient.bankCode,
          bankName: confirmation.recipientBankName,
          documentType: reviewRecipient.documentType,
          documentNumber: reviewRecipient.documentNumber,
          phone: confirmation.recipient.phone,
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
        if (
          error instanceof MobilePaymentServiceError
          && error.accessStatus !== null
        ) {
          setAccessStatus(error.accessStatus);
        }
        const message = error instanceof MobilePaymentServiceError
          && (error.type === "network" || error.type === "server")
          ? "No pudimos confirmar la transferencia. Puedes reintentar sin duplicarla."
          : error instanceof MobilePaymentServiceError
            ? serviceErrorMessage(error)
            : "No pudimos confirmar la transferencia. Puedes reintentar sin duplicarla.";
        setTransferResult({
          status: "rejected",
          amountMinorUnits: parseAmountToMinorUnits(initiatedPayment.amountBs) ?? 0,
          totalMinorUnits: parseAmountToMinorUnits(initiatedPayment.totalBs) ?? 0,
          feeMinorUnits: parseAmountToMinorUnits(initiatedPayment.feeBs) ?? 0,
          feePercentage: initiatedPayment.feePercentage,
          label: initiatedPayment.label,
          beneficiaryName: reviewRecipient.name,
          bankCode: reviewBank.code,
          bankName: reviewBank.name,
          documentType: reviewRecipient.documentType,
          documentNumber: reviewRecipient.documentNumber,
          phone: reviewRecipient.phone,
          transactionDate: null,
          userMessage: message,
        });
        setLineError("");
        setStep("result");
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
    setPurpose({ concept: "", iconId: null });
    setAmount("");
    setDetailsErrors({});
    setFocusField(null);
    setLineError("");
    setIsInitiating(false);
    setIsConfirming(false);
    setInitiatedPayment(null);
    setTransferResult(null);
    setIsAddRecipientOpen(false);
  };

  const retryPaymentContext = () => {
    setContextStatus("loading");
    setDirectoryStatus("loading");
    setLineError("");
    loadPaymentContext();
  };

  const returnHome = () => {
    setNavigationNotice("");
    resetTransaction();
    router.replace("/home");
  };

  const hasEnteredPaymentData = hasMobilePaymentProgress({
    amount,
    concept: purpose.concept,
    recipientMode,
    selectedContactId,
    selectedIcon: purpose.iconId,
    step,
  });
  const isTransactionPending = isInitiating || isConfirming;

  const handleBottomNavigation = (destination: AppDestination) => {
    const decision = getMobilePaymentNavigationDecision({
      destination,
      hasEnteredData: hasEnteredPaymentData,
      isTransactionPending,
      step,
    });

    if (decision === "stay") return false;
    if (decision === "allow") return true;

    setPendingDestination(destination);
    return false;
  };

  const continuePayment = () => setPendingDestination(null);

  const exitPayment = () => {
    if (pendingDestination === null || isTransactionPending) return;
    const destination = appDestinationHref[pendingDestination];
    setPendingDestination(null);
    router.push(destination);
  };

  const navigateBack = () => {
    if (isInitiating || isConfirming) return;

    if (step === "review") {
      returnToDetails();
      return;
    }

    if (step === "details" && hasEnteredPaymentData) {
      setPendingDestination("home");
      return;
    }

    returnHome();
  };

  const backLabel = step === "review"
    ? "Volver a los datos del pago"
    : "Volver al inicio";

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

    if (step === "details") {
      return (
        <RecipientDetailsStep
          accessStatus={accessStatus}
          amount={amount}
          availableLabel={availableLabel}
          banks={banks}
          concept={purpose.concept}
          contacts={directoryEntries}
          errors={detailsErrors}
          focusField={focusField}
          focusRequest={focusRequest}
          isSubmitting={isInitiating}
          isPreview={contextStatus === "preview"}
          manualRecipient={manualRecipient}
          onAmountChange={updateAmount}
          onChangeRecipient={changeRecipient}
          onConceptChange={(value) => {
            setPurpose((current) => ({ ...current, concept: value }));
            setLineError("");
          }}
          onContinue={continueToReview}
          onManualChange={updateManualRecipient}
          onOpenDirectory={openDirectory}
          onOpenAddRecipient={openAddRecipient}
          onSelectContact={selectVisibleContact}
          onSelectIcon={(iconId) => {
            setPurpose((current) => ({ ...current, iconId }));
            setLineError("");
          }}
          recipientMode={recipientMode}
          selectedContact={selectedContact}
          selectedIcon={purpose.iconId}
          submitError={lineError}
        />
      );
    }

    if (step === "review" && initiatedPayment && reviewRecipient && reviewBank) {
      return (
        <ReviewStep
          amountLabel={formatBsAmount(initiatedPayment.amountBs)}
          availableLabel={formatBsAmount(initiatedPayment.availableBs)}
          bank={reviewBank}
          feeLabel={`${formatBsAmount(initiatedPayment.feeBs)} (${formatPercentage(initiatedPayment.feePercentage)})`}
          financing={initiatedPayment.financing}
          iconId={initiatedPayment.iconId}
          isSubmitting={isConfirming}
          label={initiatedPayment.label}
          onBack={returnToDetails}
          onConfirm={submitTransfer}
          rateLabel={formatRateLabel(
            initiatedPayment.rateValue,
            initiatedPayment.rateSource,
          )}
          recipient={reviewRecipient}
          totalLabel={formatBsAmount(initiatedPayment.totalBs)}
        />
      );
    }

    if (step === "result" && transferResult) {
      return (
        <TransferResultView
          onBackHome={returnHome}
          result={transferResult}
          titleRef={resultTitleRef}
        />
      );
    }

    return null;
  };

  const isPaymentFlowReady = (contextStatus === "ready" || contextStatus === "preview")
    && (step === "details" || step === "review" || step === "result");
  const detailsHorizontalGutter = { xs: "1rem", sm: "1.5rem" };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: isPaymentFlowReady
          ? themeTokens.color.preLoginBackground
          : "background.default",
        pt: isPaymentFlowReady
            ? "max(2.1875rem, env(safe-area-inset-top))"
            : "calc(1rem + env(safe-area-inset-top))",
        pb: step === "result"
          ? "calc(1rem + env(safe-area-inset-bottom))"
          : isPaymentFlowReady
            ? `calc(${APP_BOTTOM_NAVIGATION_HEIGHT}px + env(safe-area-inset-bottom))`
            : `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 24}px + env(safe-area-inset-bottom))`,
      }}
    >
      <Container
        disableGutters={isPaymentFlowReady}
        maxWidth="md"
        sx={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}
      >
        {isPaymentFlowReady ? (
          <Stack
            component="header"
            direction="row"
            sx={{
              width: "100%",
              maxWidth: 480,
              minHeight: "3rem",
              alignItems: "center",
              justifyContent: "space-between",
              mx: "auto",
              px: detailsHorizontalGutter,
            }}
          >
            <AppBackButton
              disabled={isInitiating || isConfirming}
              label={backLabel}
              onClick={navigateBack}
            />
            <Typography
              component={step === "result" ? "p" : "h1"}
              id={step === "result"
                ? undefined
                : step === "review"
                  ? "mobile-payment-review-title"
                  : "mobile-payment-details-title"}
              ref={step === "result"
                ? undefined
                : step === "review"
                  ? reviewTitleRef
                  : detailsTitleRef}
              tabIndex={step === "result" ? undefined : -1}
              sx={{ color: "secondary.main", fontSize: "1rem", fontWeight: 600 }}
            >
              {step === "review" ? "Confirmar pago" : "Usar disponible"}
            </Typography>
            <Box sx={{ width: "2.75rem", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <Image
                alt="Impúlsate"
                height={32}
                src="/icons/impulsate-icon-master.png"
                style={{ borderRadius: "50%" }}
                width={32}
              />
            </Box>
          </Stack>
        ) : (
          <Stack
            component="header"
            direction="row"
            sx={{ minHeight: step === "result" ? 44 : 48, alignItems: "center" }}
          >
            <AppBackButton
              disabled={isInitiating || isConfirming}
              label={backLabel}
              onClick={navigateBack}
            />
          </Stack>
        )}

        <Box
          component="section"
          aria-labelledby={step === "result"
            ? "mobile-payment-result-title"
            : step === "review"
              ? "mobile-payment-review-title"
              : "mobile-payment-details-title"}
          sx={{
            width: "100%",
            maxWidth: isPaymentFlowReady ? 480 : 720,
            minHeight: isPaymentFlowReady ? "auto" : 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            mx: "auto",
            mt: step === "result" ? "1.5rem" : isPaymentFlowReady ? "2.1875rem" : { xs: 1, sm: 2 },
            p: step === "result" || isPaymentFlowReady ? 0 : { xs: 1, sm: 2.5 },
            px: isPaymentFlowReady ? detailsHorizontalGutter : undefined,
          }}
        >
          {lineError && step !== "details" && (
            <Typography color="error" role="alert" sx={{ mb: 2, px: isPaymentFlowReady ? 2 : 0 }}>
              {lineError}
            </Typography>
          )}
          {renderPaymentContent()}
        </Box>
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
        onExited={completeDirectoryExit}
        onFocusHandled={completeDirectoryFocus}
        onRequestDelete={requestDeleteContact}
        onRetry={retryPaymentContext}
        onSelect={selectDirectoryContact}
        open={isDirectoryOpen}
        status={directoryStatus}
        suppressFocusRestore={suppressDirectoryFocusRestore}
        suppressDeleteFocusRestore={suppressDeleteFocusRestore}
      />

      <AddRecipientDialog
        banks={banks}
        errors={detailsErrors}
        focusField={focusField}
        focusRequest={focusRequest}
        isSubmitting={isInitiating}
        manualRecipient={manualRecipient}
        onClose={closeAddRecipient}
        onDone={completeAddRecipient}
        onManualChange={updateManualRecipient}
        open={isAddRecipientOpen}
      />

      <Dialog
        aria-describedby="mobile-payment-exit-description"
        aria-labelledby="mobile-payment-exit-title"
        fullWidth
        maxWidth="xs"
        onClose={continuePayment}
        open={pendingDestination !== null}
      >
        <DialogTitle
          id="mobile-payment-exit-title"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          ¿Salir del Pago Móvil?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="mobile-payment-exit-description">
            Los datos ingresados se perderán.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, p: 2 }}>
          <Button onClick={continuePayment} type="button" variant="outlined">
            Continuar con el pago
          </Button>
          <Button onClick={exitPayment} type="button" variant="contained">
            Salir
          </Button>
        </DialogActions>
      </Dialog>

      {step !== "result" && (
        <AppBottomNavigation
          activeItem="mobile-payment"
          disabled={isTransactionPending}
          onNavigate={handleBottomNavigation}
        />
      )}

      <Snackbar
        autoHideDuration={2800}
        message={(
          <Box component="span" aria-live="polite" role="status">
            {navigationNotice}
          </Box>
        )}
        onClose={() => setNavigationNotice("")}
        open={Boolean(navigationNotice)}
        sx={{
          bottom: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 16}px + env(safe-area-inset-bottom)) !important`,
        }}
      />
    </Box>
  );
}
