"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowBackRounded } from "@mui/icons-material";
import {
  Box,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import {
  demoCreditLineSnapshot,
  isCreditLineUsable,
} from "@/features/credit-line";
import { themeTokens } from "@/theme/tokens";

import { DirectoryDialog } from "./components/DirectoryDialog";
import { RecipientDetailsStep } from "./components/RecipientDetailsStep";
import { ReviewStep } from "./components/ReviewStep";
import {
  formatAmountOnBlur,
  formatMinorUnits,
  getBank,
} from "./format";
import {
  destinationBanks,
  directoryContacts,
  mobilePaymentMock,
} from "./mocks/mobilePayment";
import type {
  DetailsErrors,
  DetailsField,
  DirectoryStatus,
  ManualRecipientData,
  RecipientMode,
  ResolvedRecipient,
} from "./types";
import { validateDetails } from "./validation";

const initialManualRecipient: ManualRecipientData = {
  bankCode: "",
  nationality: "V",
  documentNumber: "",
  phone: "",
  saveToDirectory: false,
  alias: "",
};

export function MobilePaymentView() {
  const [step, setStep] = useState<"details" | "review">("details");
  const [recipientMode, setRecipientMode] =
    useState<RecipientMode>("choice");
  const [manualRecipient, setManualRecipient] =
    useState<ManualRecipientData>(initialManualRecipient);
  const [selectedContactId, setSelectedContactId] =
    useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [amountMinorUnits, setAmountMinorUnits] =
    useState<number | null>(null);
  const [detailsErrors, setDetailsErrors] =
    useState<DetailsErrors>({});
  const [focusField, setFocusField] =
    useState<DetailsField | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [lineError, setLineError] = useState("");
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [directoryStatus, setDirectoryStatus] =
    useState<DirectoryStatus>(mobilePaymentMock.initialDirectoryStatus);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [navigationNotice, setNavigationNotice] = useState("");
  const directoryTimerRef = useRef<number | null>(null);
  const directoryOperationRef = useRef(0);
  const reviewTitleRef = useRef<HTMLHeadingElement>(null);

  const selectedContact = useMemo(
    () => directoryContacts.find(
      (contact) => contact.id === selectedContactId,
    ) ?? null,
    [selectedContactId],
  );

  const resolvedRecipient = useMemo<ResolvedRecipient | null>(() => {
    if (recipientMode === "directory" && selectedContact) {
      return {
        name: selectedContact.name,
        bankCode: selectedContact.bankCode,
        nationality: selectedContact.nationality,
        documentNumber: selectedContact.documentNumber,
        phone: selectedContact.phone,
        saveToDirectory: false,
        alias: "",
      };
    }

    if (recipientMode === "manual") {
      return {
        name: manualRecipient.alias.trim() || "Destinatario nuevo",
        ...manualRecipient,
      };
    }

    return null;
  }, [manualRecipient, recipientMode, selectedContact]);

  useEffect(() => {
    if (step === "review") {
      reviewTitleRef.current?.focus();
    }
  }, [step]);

  useEffect(() => () => {
    directoryOperationRef.current += 1;

    if (directoryTimerRef.current !== null) {
      window.clearTimeout(directoryTimerRef.current);
    }
  }, []);

  const clearDetailsError = (field: DetailsField) => {
    setDetailsErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setLineError("");
    setConfirmationPending(false);
  };

  const chooseManual = () => {
    setRecipientMode("manual");
    clearDetailsError("recipient");
  };

  const startDirectoryLoading = () => {
    directoryOperationRef.current += 1;
    const operation = directoryOperationRef.current;

    if (directoryTimerRef.current !== null) {
      window.clearTimeout(directoryTimerRef.current);
    }

    setDirectoryStatus("loading");
    directoryTimerRef.current = window.setTimeout(() => {
      if (directoryOperationRef.current !== operation) {
        return;
      }

      directoryTimerRef.current = null;
      setDirectoryStatus("ready");
    }, mobilePaymentMock.directoryRetryDelay);
  };

  const openDirectory = () => {
    setIsDirectoryOpen(true);
    clearDetailsError("recipient");

    if (directoryStatus === "loading") {
      startDirectoryLoading();
    }
  };

  const selectDirectoryContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setRecipientMode("directory");
    setIsDirectoryOpen(false);
    clearDetailsError("recipient");
  };

  const changeRecipient = () => {
    setStep("details");
    setRecipientMode("choice");
    setSelectedContactId(null);
    setConfirmationPending(false);
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

    if (field === "bankCode") {
      clearDetailsError("bankCode");
    } else if (field === "documentNumber") {
      clearDetailsError("documentNumber");
    } else if (field === "phone") {
      clearDetailsError("phone");
    } else if (field === "alias") {
      clearDetailsError("alias");
    } else if (field === "saveToDirectory" && value === false) {
      clearDetailsError("alias");
    }
  };

  const updateAmount = (
    value: string,
    minorUnits: number | null,
  ) => {
    setAmount(value);
    setAmountMinorUnits(minorUnits);
    clearDetailsError("amount");
  };

  const continueToReview = () => {
    if (!isCreditLineUsable(demoCreditLineSnapshot.status)) {
      setLineError(
        "Tu financiamiento no permite solicitar Pago Móvil en este momento.",
      );
      return;
    }

    const validation = validateDetails({
      recipientMode,
      manualRecipient,
      selectedContactId,
      amount,
      availableMinorUnits:
        demoCreditLineSnapshot.usableAvailableMinorUnits,
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

    setAmountMinorUnits(validation.amountMinorUnits);
    setAmount(formatAmountOnBlur(amount));
    setConfirmationPending(false);
    setStep("review");
  };

  const returnToDetails = () => {
    setConfirmationPending(false);
    setStep("details");
  };

  const reviewBank = resolvedRecipient
    ? getBank(destinationBanks, resolvedRecipient.bankCode)
    : undefined;

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
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          component="header"
          direction="row"
          spacing={1}
          sx={{ minHeight: 48, alignItems: "center" }}
        >
          <IconButton
            aria-label="Volver al inicio"
            color="primary"
            component={Link}
            href="/home"
          >
            <ArrowBackRounded />
          </IconButton>
          <Typography
            sx={{
              color: themeTokens.color.brandLogo,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Impúlsate Móvil
          </Typography>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            maxWidth: 720,
            minHeight: { xs: 520, sm: 600 },
            flex: "1 0 auto",
            display: "flex",
            flexDirection: "column",
            mx: "auto",
            mt: 2,
            p: { xs: 2, sm: 3.5 },
            boxShadow: "none",
          }}
        >
          {lineError && (
            <Typography
              color="error"
              role="alert"
              sx={{ mb: 2 }}
            >
              {lineError}
            </Typography>
          )}

          {step === "details" ? (
            <RecipientDetailsStep
              amount={amount}
              availableLabel={
                demoCreditLineSnapshot.usableAvailableLabel
              }
              banks={destinationBanks}
              errors={detailsErrors}
              focusField={focusField}
              focusRequest={focusRequest}
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
          ) : (
            resolvedRecipient
            && reviewBank
            && amountMinorUnits !== null
            && (
              <ReviewStep
                amountLabel={formatMinorUnits(amountMinorUnits)}
                availableLabel={
                  demoCreditLineSnapshot.usableAvailableLabel
                }
                bank={reviewBank}
                confirmationPending={confirmationPending}
                onBack={returnToDetails}
                onConfirm={() => setConfirmationPending(true)}
                recipient={resolvedRecipient}
                titleRef={reviewTitleRef}
              />
            )
          )}
        </Paper>
      </Container>

      <DirectoryDialog
        banks={destinationBanks}
        contacts={directoryContacts}
        onClose={() => setIsDirectoryOpen(false)}
        onRetry={startDirectoryLoading}
        onSelect={selectDirectoryContact}
        open={isDirectoryOpen}
        status={directoryStatus}
      />

      <AppBottomNavigation
        activeItem="mobile-payment"
        onUnavailable={(label) => setNavigationNotice(
          `${label} estará disponible en la siguiente etapa.`,
        )}
      />
      <Snackbar
        autoHideDuration={2800}
        message={
          <Box component="span" aria-live="polite" role="status">
            {navigationNotice}
          </Box>
        }
        onClose={() => setNavigationNotice("")}
        open={Boolean(navigationNotice)}
        sx={{
          bottom: "calc(72px + env(safe-area-inset-bottom)) !important",
        }}
      />
    </Box>
  );
}
