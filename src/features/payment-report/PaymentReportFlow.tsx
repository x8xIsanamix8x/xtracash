"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowBackRounded,
  CloseRounded,
} from "@mui/icons-material";
import {
  Box,
  Container,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { getCaracasCalendarDate } from "./calendarDate";
import { ContactSupportStep } from "./components/ContactSupportStep";
import { PaymentAmountSelection } from "./components/PaymentAmountSelection";
import { PaymentAmountStep } from "./components/PaymentAmountStep";
import { PaymentConfirmationStep } from "./components/PaymentConfirmationStep";
import { PaymentReportDataState } from "./components/PaymentReportDataState";
import { PaymentInstructionsStep } from "./components/PaymentInstructionsStep";
import { PaymentMethodStep } from "./components/PaymentMethodStep";
import { PaymentReportFormStep } from "./components/PaymentReportFormStep";
import { PaymentReportPendingStep } from "./components/PaymentReportPendingStep";
import { PaymentReportResultStep } from "./components/PaymentReportResultStep";
import { PaymentReportSubmittingStep } from "./components/PaymentReportSubmittingStep";
import { getSubmissionFailureStep } from "./pendingPaymentReport";
import { createPaymentAmountOptions } from "./presentation";
import {
  createPaymentReport,
  getPaymentReportData,
  PaymentReportServiceError,
} from "./services/paymentReport";
import type {
  PaymentAmountOption,
  PaymentReportData,
  PaymentReportFormErrors,
  PaymentReportResult,
  PaymentReportStep,
} from "./types";
import {
  isPaymentReportFormValid,
  normalizeReference,
  normalizeSenderPhone,
  validatePaymentReportForm,
} from "./validation";

type PaymentReportFlowProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

type PaymentReportDataStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unconfigured"
  | "error";

function PaymentReportTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function PaymentReportFlow({
  open,
  onClose,
}: PaymentReportFlowProps) {
  const router = useRouter();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [dataStatus, setDataStatus] = useState<PaymentReportDataStatus>("idle");
  const [paymentData, setPaymentData] = useState<PaymentReportData | null>(null);
  const amountOptions = useMemo(
    () => createPaymentAmountOptions(
      paymentData?.debt.currentBs ?? null,
      paymentData?.debt.minimumBs ?? null,
    ),
    [paymentData],
  );
  const [step, setStep] = useState<PaymentReportStep>("selection");
  const [selectedAmount, setSelectedAmount] =
    useState<PaymentAmountOption | null>(null);
  const [originBank, setOriginBank] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [reference, setReference] = useState("");
  const [formErrors, setFormErrors] = useState<PaymentReportFormErrors>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [submissionError, setSubmissionError] = useState("");
  const [result, setResult] = useState<PaymentReportResult | null>(null);
  const [notice, setNotice] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dataControllerRef = useRef<AbortController | null>(null);
  const submissionRef = useRef(false);
  const submissionControllerRef = useRef<AbortController | null>(null);

  const isSubmitting = step === "submitting";
  const selectedAmountBs = selectedAmount?.amountBs ?? null;
  const today = getCaracasCalendarDate();
  const sourceBanks = paymentData?.sourceBanks ?? [];
  const isFormValid = isPaymentReportFormValid(
    originBank,
    senderPhone,
    paymentDate,
    reference,
    sourceBanks,
    today,
  );

  const loadPaymentData = useCallback(() => {
    dataControllerRef.current?.abort();
    const controller = new AbortController();
    dataControllerRef.current = controller;

    void getPaymentReportData(controller.signal)
      .then((data) => {
        if (dataControllerRef.current !== controller) return;
        setPaymentDate(getCaracasCalendarDate());
        setPaymentData(data);
        setDataStatus("ready");
      })
      .catch((error: unknown) => {
        if (dataControllerRef.current !== controller) return;
        if (
          error instanceof PaymentReportServiceError
          && error.type === "aborted"
        ) {
          return;
        }
        if (
          error instanceof PaymentReportServiceError
          && error.type === "unauthenticated"
        ) {
          onClose();
          router.replace(sessionExpiredUrl);
          return;
        }

        setDataStatus(
          error instanceof PaymentReportServiceError
          && error.type === "unconfigured"
            ? "unconfigured"
            : "error",
        );
      })
      .finally(() => {
        if (dataControllerRef.current === controller) {
          dataControllerRef.current = null;
        }
      });
  }, [onClose, router]);

  const retryPaymentData = () => {
    setDataStatus("loading");
    setPaymentData(null);
    loadPaymentData();
  };

  useEffect(() => {
    if (!open) {
      dataControllerRef.current?.abort();
      return;
    }

    void loadPaymentData();
    return () => dataControllerRef.current?.abort();
  }, [loadPaymentData, open]);

  useEffect(() => {
    if (!open) return;

    const animationFrame = window.requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [dataStatus, open, step]);

  useEffect(() => () => {
    dataControllerRef.current?.abort();
    submissionControllerRef.current?.abort();
  }, []);

  const resetFlow = () => {
    dataControllerRef.current?.abort();
    dataControllerRef.current = null;
    submissionControllerRef.current?.abort();
    submissionControllerRef.current = null;
    submissionRef.current = false;
    setStep("selection");
    setDataStatus("idle");
    setPaymentData(null);
    setSelectedAmount(null);
    setOriginBank("");
    setSenderPhone("");
    setPaymentDate("");
    setReference("");
    setFormErrors({});
    setFocusRequest(0);
    setSubmissionError("");
    setResult(null);
    setNotice("");
  };

  const closeFlow = () => {
    if (isSubmitting) return;
    dataControllerRef.current?.abort();
    onClose();
  };

  const selectAmount = (option: PaymentAmountOption) => {
    if (option.amountBs === null) return;
    setSelectedAmount(option);
    setStep("amount");
  };

  const goBack = () => {
    if (isSubmitting) return;

    if (step === "amount") {
      setStep("selection");
    } else if (step === "method") {
      setStep("amount");
    } else if (step === "instructions") {
      setStep("method");
    } else if (step === "confirmation") {
      setStep("instructions");
    } else if (step === "contact" || step === "form") {
      setStep("confirmation");
    }
  };

  const confirmPayment = () => {
    setStep("form");
  };

  const reportMistake = () => {
    setStep("contact");
  };

  const updateOriginBank = (value: string) => {
    setOriginBank(value);
    setFormErrors((current) => ({ ...current, originBank: undefined }));
    setSubmissionError("");
  };

  const updateSenderPhone = (value: string) => {
    setSenderPhone(normalizeSenderPhone(value));
    setFormErrors((current) => ({ ...current, senderPhone: undefined }));
    setSubmissionError("");
  };

  const updatePaymentDate = (value: string) => {
    setPaymentDate(value);
    setFormErrors((current) => ({ ...current, paymentDate: undefined }));
    setSubmissionError("");
  };

  const updateReference = (value: string) => {
    setReference(normalizeReference(value));
    setFormErrors((current) => ({ ...current, reference: undefined }));
    setSubmissionError("");
  };

  const submitReport = () => {
    if (
      selectedAmountBs === null
      || submissionRef.current
      || submissionControllerRef.current !== null
    ) {
      return;
    }

    const errors = validatePaymentReportForm(
      originBank,
      senderPhone,
      paymentDate,
      reference,
      sourceBanks,
      today,
    );
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFocusRequest((current) => current + 1);
      return;
    }

    const controller = new AbortController();
    submissionRef.current = true;
    submissionControllerRef.current = controller;
    setSubmissionError("");
    setStep("submitting");

    void createPaymentReport({
      amountBs: selectedAmountBs,
      originBankCode: originBank,
      senderPhone,
      paymentDate,
      bankReference: reference,
    }, controller.signal)
      .then((nextResult) => {
        if (controller.signal.aborted) return;
        setResult(nextResult);
        setStep("result");
      })
      .catch((error: unknown) => {
        if (
          error instanceof PaymentReportServiceError
          && error.type === "aborted"
        ) {
          return;
        }
        if (
          error instanceof PaymentReportServiceError
          && error.type === "unauthenticated"
        ) {
          onClose();
          router.replace(sessionExpiredUrl);
          return;
        }

        const errorType = error instanceof PaymentReportServiceError
          ? error.type
          : "server";
        const failureStep = getSubmissionFailureStep(errorType);
        if (failureStep === "pending") {
          setSubmissionError("");
          setStep(failureStep);
          return;
        }

        setSubmissionError(
          error instanceof PaymentReportServiceError
          && error.type === "conflict"
            ? "Este pago ya fue reportado o existe un reporte pendiente. Evita enviarlo nuevamente."
            : error instanceof PaymentReportServiceError
              && error.type === "invalid"
              ? "Revisa los datos e inténtalo nuevamente."
              : "No pudimos enviar el reporte. Inténtalo nuevamente.",
        );
        setStep(failureStep);
      })
      .finally(() => {
        if (submissionControllerRef.current === controller) {
          submissionControllerRef.current = null;
          submissionRef.current = false;
        }
      });
  };

  const canGoBack = step === "amount"
    || step === "method"
    || step === "instructions"
    || step === "confirmation"
    || step === "contact"
    || step === "form";

  const renderStep = () => {
    if (
      paymentData === null
      || selectedAmount === null
      || selectedAmountBs === null
    ) {
      return null;
    }

    if (step === "amount") {
      return (
        <PaymentAmountStep
          amount={selectedAmount}
          onContinue={() => setStep("method")}
          titleRef={titleRef}
        />
      );
    }

    if (step === "method") {
      return (
        <PaymentMethodStep
          amountBs={selectedAmountBs}
          onSelect={() => setStep("instructions")}
          titleRef={titleRef}
        />
      );
    }

    if (step === "instructions") {
      return (
        <PaymentInstructionsStep
          amountBs={selectedAmountBs}
          destination={paymentData.destination}
          onNotice={setNotice}
          onNext={() => setStep("confirmation")}
          titleRef={titleRef}
        />
      );
    }

    if (step === "confirmation") {
      return (
        <PaymentConfirmationStep
          amountBs={selectedAmountBs}
          destination={paymentData.destination}
          onConfirm={confirmPayment}
          onMistake={reportMistake}
          titleRef={titleRef}
        />
      );
    }

    if (step === "contact") {
      return <ContactSupportStep onBackHome={closeFlow} titleRef={titleRef} />;
    }

    if (step === "form") {
      return (
        <PaymentReportFormStep
          errors={formErrors}
          focusRequest={focusRequest}
          isValid={isFormValid}
          onOriginBankChange={updateOriginBank}
          onPaymentDateChange={updatePaymentDate}
          onReferenceChange={updateReference}
          onSenderPhoneChange={updateSenderPhone}
          onSubmit={submitReport}
          originBank={originBank}
          paymentDate={paymentDate}
          reference={reference}
          senderPhone={senderPhone}
          sourceBanks={sourceBanks}
          submissionError={submissionError}
          titleRef={titleRef}
          today={today}
        />
      );
    }

    if (step === "submitting") {
      return <PaymentReportSubmittingStep titleRef={titleRef} />;
    }

    if (step === "pending") {
      return (
        <PaymentReportPendingStep
          onBackHome={closeFlow}
          titleRef={titleRef}
        />
      );
    }

    if (step === "result") {
      if (result === null) return null;
      return (
        <PaymentReportResultStep
          onBackHome={closeFlow}
          result={result}
          titleRef={titleRef}
        />
      );
    }

    return null;
  };

  const isSelection = step === "selection";

  return (
    <>
      <Dialog
        aria-labelledby={isSelection
          ? "payment-report-selection-title"
          : `payment-report-${step}-title`}
        fullWidth
        maxWidth={false}
        onClose={closeFlow}
        open={open}
        scroll="paper"
        slots={{ transition: PaymentReportTransition }}
        slotProps={{
          backdrop: {
            sx: (theme) => ({
              bgcolor: alpha(theme.palette.common.black, 0.48),
            }),
          },
          container: {
            sx: {
              minWidth: 0,
              alignItems: isSelection
                ? { xs: "flex-end", md: "center" }
                : "center",
              overflowX: "hidden",
            },
          },
          paper: {
            sx: {
              boxSizing: "border-box",
              m: isSelection ? { xs: 0, md: 2 } : { xs: 0, md: 2 },
              width: "100%",
              minWidth: 0,
              maxWidth: isSelection
                ? { xs: "100%", md: 520 }
                : { xs: "100%", md: 760 },
              height: isSelection
                ? "auto"
                : { xs: "100dvh", md: "min(780px, calc(100dvh - 32px))" },
              maxHeight: isSelection
                ? { xs: "82dvh", md: "calc(100dvh - 32px)" }
                : { xs: "100dvh", md: "calc(100dvh - 32px)" },
              borderRadius: isSelection
                ? { xs: "24px 24px 0 0", md: 3 }
                : { xs: 0, md: 3 },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
          transition: { onExited: resetFlow },
        }}
        transitionDuration={prefersReducedMotion ? 0 : undefined}
      >
        {isSelection ? (
          dataStatus === "ready" && paymentData ? (
            <PaymentAmountSelection
              onClose={closeFlow}
              onSelect={selectAmount}
              options={amountOptions}
              titleRef={titleRef}
            />
          ) : (
            <PaymentReportDataState
              onClose={closeFlow}
              onRetry={retryPaymentData}
              status={dataStatus === "unconfigured"
                ? "unconfigured"
                : dataStatus === "error"
                  ? "error"
                  : "loading"}
              titleRef={titleRef}
            />
          )
        ) : (
          <>
            <Stack
              component="header"
              direction="row"
              spacing={1}
              sx={{
                minHeight: "calc(64px + env(safe-area-inset-top))",
                alignItems: "flex-end",
                px: { xs: 1, sm: 2 },
                pb: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {canGoBack ? (
                <IconButton
                  aria-label="Volver al paso anterior"
                  color="primary"
                  onClick={goBack}
                  type="button"
                >
                  <ArrowBackRounded />
                </IconButton>
              ) : (
                <Box sx={{ width: 44, height: 44 }} />
              )}
              <Typography
                noWrap
                sx={{
                  minWidth: 0,
                  flex: 1,
                  alignSelf: "center",
                  color: themeTokens.color.brandLogo,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  textAlign: "center",
                }}
              >
                Impúlsate Móvil
              </Typography>
              <IconButton
                aria-label="Cerrar reporte de pago"
                disabled={isSubmitting}
                onClick={closeFlow}
                type="button"
              >
                <CloseRounded />
              </IconButton>
            </Stack>
            <DialogContent
              sx={{
                minHeight: 0,
                flex: 1,
                p: 0,
                overflowX: "hidden",
                overflowY: "hidden",
                bgcolor: "background.default",
              }}
            >
              <Container
                disableGutters
                maxWidth="sm"
                sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: 0,
                  display: "flex",
                }}
              >
                {renderStep()}
              </Container>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar
        autoHideDuration={2800}
        message={(
          <Box component="span" aria-live="polite" role="status">
            {notice}
          </Box>
        )}
        onClose={() => setNotice("")}
        open={Boolean(notice)}
        sx={{ bottom: "calc(24px + env(safe-area-inset-bottom)) !important" }}
      />
    </>
  );
}
