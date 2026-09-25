"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { CloudOffRounded, HourglassTopRounded, ReplayRounded, TaskAltRounded } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, Skeleton, Stack } from "@mui/material";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";
import { formatBolivars } from "@/features/home/presentation";
import { getCaracasCalendarDate } from "./calendarDate";
import {
  getPaymentSupportErrorMessage,
  validatePaymentSupportFileMetadata,
} from "./paymentSupport";
import { encodePaymentSupportFile } from "./services/paymentSupport";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { InstallmentsHeader } from "./components/InstallmentsHeader";
import { InstallmentsScreen, panelSlotSx, panelToBottomSx } from "./components/InstallmentsScreen";
import { ReportForm } from "./components/ReportForm";
import type { ExpectedAmount } from "./components/ReportForm";
import { ReportFailure, ReportSuccess } from "./components/ReportResult";
import type { ReportSummaryRow } from "./components/ReportResult";
import { pillButton, StateCard } from "./components/StateCard";
import {
  useConsumptionDetail,
  useInstallmentsCache,
  usePaymentData,
} from "./InstallmentsProvider";
import {
  createAmountBreakdown,
  createPaymentChoices,
  getSelectedOption,
  normalizePaymentSelection,
  paymentBackLink,
  paymentSelectionToQuery,
  type PaymentOrigin,
} from "./paymentOptions";
import type { PaymentSelection } from "./paymentOptions";
import { createConsumptionDetailViewModel } from "./presentation";
import {
  formatAmountInput,
  normalizePhoneInput,
  normalizeReferenceInput,
  parseAmountInput,
  toCreateReportRequest,
  validatePaymentDate,
  validateReportForm,
} from "./reportForm";
import type { ReportFormErrors, ReportFormField, ReportFormValues } from "./reportForm";
import { createSuccessRows, formatReportedInstallments, getReportFailure } from "./reportOutcome";
import {
  createInstallmentReport,
  getPaymentData,
  InstallmentsServiceError,
} from "./services/installments";
import type { PaymentQuote } from "./types";

type DatedQuote = Readonly<{
  date: string;
  status: "ready" | "error" | "rate_unavailable";
  quote?: PaymentQuote;
}>;

type FailureScreen = Readonly<{
  reason: string;
  canRetry: boolean;
  showSupport: boolean;
  attemptedAmount: string | null;
}>;

type Phase = "form" | "submitting" | "success" | "failure";

function ReportSkeleton() {
  return (
    <Stack aria-busy="true" aria-label="Cargando el reporte de pago" role="status" spacing={1.5}>
      <Skeleton animation="wave" height={140} sx={{ borderRadius: 4 }} variant="rounded" />
      {[0, 1, 2, 3].map((key) => (
        <Skeleton animation="wave" height={50} key={key} sx={{ borderRadius: 99 }} variant="rounded" />
      ))}
    </Stack>
  );
}

type PaymentReportViewProps = Readonly<{
  consumptionId: string;
  requestedSelection: PaymentSelection | null;
  origin: PaymentOrigin;
}>;

export function PaymentReportView({ consumptionId, requestedSelection, origin }: PaymentReportViewProps) {
  const router = useRouter();
  const detail = useConsumptionDetail(consumptionId);
  const todayData = usePaymentData(consumptionId);
  const { invalidate, paymentSelections } = useInstallmentsCache();

  const [today] = useState(getCaracasCalendarDate);
  const [values, setValues] = useState<ReportFormValues>({
    senderBank: "",
    bankReference: "",
    paymentDate: today,
    senderPhone: "",
    amount: "",
    confirmed: false,
  });
  const [amountTouched, setAmountTouched] = useState(false);
  const [errors, setErrors] = useState<ReportFormErrors>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string>();
  const [formMessage, setFormMessage] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [successRows, setSuccessRows] = useState<readonly ReportSummaryRow[]>([]);
  const [failure, setFailure] = useState<FailureScreen | null>(null);
  const [datedQuote, setDatedQuote] = useState<DatedQuote | null>(null);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const submitControllerRef = useRef<AbortController | null>(null);

  // "Volver a cuotas" del resultado: a la lista o al detalle, según desde dónde se abrió el pago.
  const detailHref = paymentBackLink(consumptionId, origin).href;
  const todayQuote = todayData.status === "ready" ? todayData.data.quote : null;
  const minDate = detail.status === "ready" ? detail.data.consumption.consumedOn : today;
  const dateIsValid = validatePaymentDate(values.paymentDate, { today, minDate }) === null;
  const needsDatedQuote = todayQuote !== null
    && dateIsValid
    && values.paymentDate !== todayQuote.paymentDate;

  // Con otra fecha, el monto se recalcula con la tasa de ese día (pausa corta al escribir).
  useEffect(() => {
    if (!needsDatedQuote) return;
    const date = values.paymentDate;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getPaymentData(consumptionId, date, controller.signal)
        .then((data) => setDatedQuote({ date, status: "ready", quote: data.quote }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          const type = error instanceof InstallmentsServiceError ? error.type : "server";
          if (type === "aborted") return;
          if (type === "unauthenticated") {
            router.replace(sessionExpiredUrl);
            return;
          }
          setDatedQuote({ date, status: type === "rate_unavailable" ? "rate_unavailable" : "error" });
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [consumptionId, needsDatedQuote, quoteAttempt, router, values.paymentDate]);

  useEffect(() => () => submitControllerRef.current?.abort(), []);

  if (phase === "success") {
    return (
      <InstallmentsScreen>
        <Stack spacing={2.5}>
          <InstallmentsHeader title="Reportar pago" />
          <ReportSuccess rows={successRows} />
        </Stack>
      </InstallmentsScreen>
    );
  }

  if (
    (detail.status === "error" && detail.error === "not_found")
    || (todayData.status === "error" && todayData.error === "not_found")
  ) {
    notFound();
  }

  const choices = todayQuote ? createPaymentChoices(todayQuote) : null;
  const selection = choices
    ? normalizePaymentSelection(choices, requestedSelection ?? paymentSelections[consumptionId])
    : null;
  const instructionsHref = selection
    ? `/installments/${consumptionId}/payment?${paymentSelectionToQuery(selection, origin)}`
    : detailHref;

  const activeQuote = !dateIsValid
    ? null
    : values.paymentDate === todayQuote?.paymentDate
      ? todayQuote
      : datedQuote?.date === values.paymentDate && datedQuote.status === "ready"
        ? datedQuote.quote ?? null
        : null;
  const option = activeQuote && selection ? getSelectedOption(activeQuote, selection) : null;
  const expected: ExpectedAmount = !dateIsValid
    ? { status: "idle" }
    : option
      ? { status: "ready", amountBs: option.total.bs }
      : datedQuote?.date === values.paymentDate && datedQuote.status === "rate_unavailable"
        ? { status: "rate_unavailable" }
        : datedQuote?.date === values.paymentDate && datedQuote.status === "error"
          ? { status: "error", retry: () => { setDatedQuote(null); setQuoteAttempt((n) => n + 1); } }
          : { status: "loading" };
  const expectedAmountBs = expected.status === "ready" ? expected.amountBs : null;
  const amountInput = amountTouched
    ? values.amount
    : expectedAmountBs ? formatAmountInput(expectedAmountBs) : "";

  const change = (field: ReportFormField, value: string | boolean) => {
    setFormMessage("");
    if (field === "amount") setAmountTouched(true);
    const nextValue = field === "bankReference"
      ? normalizeReferenceInput(String(value))
      : field === "senderPhone"
        ? normalizePhoneInput(String(value))
        : value;
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => {
      const next = { ...current, [field]: undefined };
      if (field === "paymentDate") {
        next.paymentDate = validatePaymentDate(String(value), { today, minDate }) ?? undefined;
      }
      return next;
    });
  };

  const selectReceipt = (file: File) => {
    const error = validatePaymentSupportFileMetadata(file);
    if (error) {
      setReceiptFile(null);
      setReceiptError(getPaymentSupportErrorMessage(error));
      return;
    }
    setReceiptFile(file);
    setReceiptError(undefined);
  };

  const submit = async () => {
    // El ref se actualiza al instante: evita dos envíos con doble clic.
    if (
      submitControllerRef.current
      || !selection
      || detail.status !== "ready"
      || todayData.status !== "ready"
    ) {
      return;
    }
    const formValues: ReportFormValues = { ...values, amount: amountInput };
    const nextErrors = validateReportForm(formValues, {
      sourceBanks: todayData.data.sourceBanks,
      today,
      minDate,
      expectedAmountBs,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || receiptError) {
      setFocusRequest((current) => current + 1);
      return;
    }

    const controller = new AbortController();
    submitControllerRef.current = controller;
    setFormMessage("");
    setPhase("submitting");

    try {
      const receipt = receiptFile
        ? await encodePaymentSupportFile(receiptFile, controller.signal)
        : undefined;
      const result = await createInstallmentReport(
        consumptionId,
        toCreateReportRequest(formValues, selection, receipt),
        controller.signal,
      );
      setSuccessRows(createSuccessRows({
        consumptionLabel: detail.data.consumption.label,
        installmentsLabel: formatReportedInstallments(option?.installments ?? []),
        senderBank: formValues.senderBank,
        sourceBanks: todayData.data.sourceBanks,
        bankReference: formValues.bankReference,
        senderPhone: formValues.senderPhone,
        result,
      }));
      setReceiptFile(null);
      setPhase("success");
      // Las cuotas pasan a "En revisión": se vuelven a pedir al volver a Mis cuotas.
      invalidate();
    } catch (error) {
      if (controller.signal.aborted) return;
      const serviceError = error instanceof InstallmentsServiceError ? error : null;
      const type = serviceError?.type ?? (receiptFile ? "invalid_support" : "server");
      if (type === "aborted") return;
      if (type === "unauthenticated") {
        router.replace(sessionExpiredUrl);
        return;
      }

      const outcome = getReportFailure(type, {
        expectedAmountBs: serviceError?.expectedAmountBs ?? null,
        reportedAmountBs: serviceError?.reportedAmountBs ?? null,
      });
      if (outcome.kind === "form") {
        if (outcome.field === "receipt") {
          setReceiptFile(null);
          setReceiptError(outcome.message);
        } else if (outcome.field === "paymentDate") {
          setErrors({ paymentDate: outcome.message });
          setFocusRequest((current) => current + 1);
        } else {
          setFormMessage(outcome.message);
        }
        setPhase("form");
        return;
      }

      const attempted = parseAmountInput(formValues.amount);
      setFailure({
        reason: outcome.reason,
        canRetry: outcome.canRetry,
        showSupport: outcome.showSupport,
        attemptedAmount: attempted ? formatBolivars(attempted) : null,
      });
      setPhase("failure");
    } finally {
      if (submitControllerRef.current === controller) submitControllerRef.current = null;
    }
  };

  const content = (() => {
    if (phase === "failure" && failure) {
      return (
        <ReportFailure
          attemptedAmount={failure.attemptedAmount}
          canRetry={failure.canRetry}
          detailHref={detailHref}
          onRetry={() => setPhase("form")}
          reason={failure.reason}
          supportHref={failure.showSupport ? "/help" : undefined}
        />
      );
    }

    if (detail.status === "loading" || todayData.status === "loading") return <ReportSkeleton />;

    if (detail.status === "error" || todayData.status === "error") {
      return (
        <StateCard
          action={(
            <Button
              onClick={() => {
                if (detail.status === "error") detail.retry();
                if (todayData.status === "error") todayData.retry();
              }}
              startIcon={<ReplayRounded />}
              sx={pillButton}
              variant="contained"
            >
              Reintentar
            </Button>
          )}
          description="Ocurrió un problema al preparar el reporte. Inténtalo nuevamente."
          icon={<CloudOffRounded />}
          title="No pudimos cargar el reporte"
        />
      );
    }

    const viewModel = createConsumptionDetailViewModel(detail.data);
    if (!choices || !selection || viewModel.isPaid) {
      return (
        <StateCard
          action={(
            <Button component={Link} href="/installments" sx={pillButton} variant="contained">
              Ver mis cuotas
            </Button>
          )}
          description="Este consumo no tiene pagos pendientes."
          icon={<TaskAltRounded />}
          title="Estás al día"
        />
      );
    }
    if (viewModel.hasPaymentInReview) {
      return (
        <StateCard
          action={(
            <Button component={Link} href="/installments" sx={pillButton} variant="contained">
              Ver mis cuotas
            </Button>
          )}
          description="Ya tienes un pago en validación para este consumo. Espera a que el equipo lo revise."
          icon={<HourglassTopRounded />}
          title="Pago en revisión"
        />
      );
    }

    const todayOption = getSelectedOption(todayData.data.quote, selection);
    const payingLabel = createAmountBreakdown(option ?? todayOption!).description;

    return (
      <Card
        sx={{
          ...panelToBottomSx,
          borderRadius: `${homeVisualTokens.radius.card}px`,
          bgcolor: homeVisualTokens.color.white,
          boxShadow: "0 8px 24px rgba(0, 0, 75, 0.08)",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {formMessage && (
            <Alert role="alert" severity="error" sx={{ mb: 1.5, borderRadius: 3 }}>{formMessage}</Alert>
          )}
          <ReportForm
            amountInput={amountInput}
            detailHref={detailHref}
            errors={errors}
            expected={expected}
            focusRequest={focusRequest}
            header={viewModel.header}
            minDate={minDate}
            onChange={change}
            onReceiptRemove={() => {
              setReceiptFile(null);
              setReceiptError(undefined);
            }}
            onReceiptSelect={selectReceipt}
            onSubmit={() => void submit()}
            payingLabel={payingLabel}
            receiptError={receiptError}
            receiptFile={receiptFile}
            sourceBanks={todayData.data.sourceBanks}
            submitting={phase === "submitting"}
            today={today}
            values={values}
          />
        </CardContent>
      </Card>
    );
  })();

  return (
    <InstallmentsScreen>
      <Stack spacing={2.5} sx={panelSlotSx}>
        <InstallmentsHeader backHref={instructionsHref} backLabel="Volver a las instrucciones" title="Reportar pago" />
        <Box sx={panelSlotSx}>{content}</Box>
      </Stack>
    </InstallmentsScreen>
  );
}
