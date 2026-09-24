import Image from "next/image";
import Link from "next/link";
import {
  LockRounded,
  NotificationsNoneRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PrimaryFinancialCard } from "@/components/PrimaryFinancialCard";
import type { HomeDashboardViewModel } from "../newBusinessTypes";
import { homeVisualTokens } from "../homeVisualTokens";
import { ConsumptionCard } from "./ConsumptionCard";

type NewBusinessHomeDashboardProps = Readonly<{
  greeting: string;
  viewModel: HomeDashboardViewModel;
  onNotifications: () => void;
  onReportInstallment: () => void;
}>;

function HomeHeader({
  greeting,
  firstName,
  onNotifications,
}: Readonly<{
  greeting: string;
  firstName: string;
  onNotifications: () => void;
}>) {
  return (
    <Stack component="header" spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: homeVisualTokens.color.logoSurface,
          }}
        >
          <Image
            alt=""
            aria-hidden="true"
            height={32}
            priority
            src="/entry/isotipo-impulsa.png"
            width={26}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <IconButton
          aria-label="Ver notificaciones"
          onClick={onNotifications}
          sx={{
            flexShrink: 0,
            color: homeVisualTokens.color.neutral,
            "&:hover": { bgcolor: homeVisualTokens.color.neutralSurface },
            "&:active": { bgcolor: homeVisualTokens.color.neutralSurface },
          }}
        >
          <NotificationsNoneRounded />
        </IconButton>
      </Stack>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <Typography
          component="h1"
          sx={{
            color: homeVisualTokens.color.navy,
            fontSize: { xs: "1.125rem", sm: "1.375rem" },
            fontWeight: 700,
            lineHeight: 1.2,
            overflowWrap: "anywhere",
          }}
        >
          {greeting}, {" "}
          <Box component="span" sx={{ color: homeVisualTokens.color.orange }}>
            {firstName}
          </Box>
        </Typography>
      </Stack>
    </Stack>
  );
}

function BalanceCard({
  balance,
  onReportInstallment,
}: Readonly<{
  balance: HomeDashboardViewModel["balance"];
  onReportInstallment: () => void;
}>) {
  const isReportAction = balance.primaryAction === "reportInstallment";
  const actionStyles = {
    minHeight: 48,
    bgcolor: homeVisualTokens.color.orange,
    color: homeVisualTokens.color.white,
    fontSize: "1rem",
    fontWeight: 800,
    "&:hover": { bgcolor: homeVisualTokens.color.orange },
    "&:active": { bgcolor: homeVisualTokens.color.orange },
  } as const;

  return (
    <PrimaryFinancialCard labelledBy="home-balance-title">
      <Stack spacing={2} sx={{ alignItems: "stretch" }}>
        <Stack spacing={0.5} sx={{ textAlign: "left", alignItems: "flex-start" }}>
          <Typography
            component="div"
            id="home-balance-title"
            sx={{ color: homeVisualTokens.color.white, fontWeight: 700 }}
          >
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              {isReportAction && <LockRounded aria-hidden="true" sx={{ fontSize: 20 }} />}
              <span>Disponible</span>
            </Stack>
          </Typography>
          <Typography
            sx={{
              color: homeVisualTokens.color.white,
              fontSize: "clamp(1.875rem, 9vw, 2.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              overflowWrap: "anywhere",
            }}
          >
            {balance.available}
          </Typography>
          <Typography
            sx={{
              color: homeVisualTokens.color.white,
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Línea total: {balance.totalCredit}
          </Typography>
        </Stack>
        {isReportAction ? (
          <Button
            fullWidth
            onClick={onReportInstallment}
            sx={actionStyles}
            type="button"
            variant="contained"
          >
            {balance.primaryActionLabel}
          </Button>
        ) : (
          <Button
            component={Link}
            fullWidth
            href="/mobile-payment"
            sx={actionStyles}
            variant="contained"
          >
            {balance.primaryActionLabel}
          </Button>
        )}
      </Stack>
    </PrimaryFinancialCard>
  );
}

function AttentionNotice({ message, suspended }: Readonly<{ message: string; suspended: boolean }>) {
  return (
    <Card
      component="section"
      role="status"
      variant="outlined"
      sx={{
        borderWidth: 2,
        borderColor: suspended ? homeVisualTokens.color.danger : homeVisualTokens.color.orange,
        borderRadius: `${homeVisualTokens.radius.inset}px`,
        bgcolor: homeVisualTokens.color.white,
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
          {suspended ? (
            <LockRounded
              aria-hidden="true"
              sx={{ flexShrink: 0, color: homeVisualTokens.color.danger }}
            />
          ) : (
            <WarningAmberRounded
            aria-hidden="true"
            sx={{ flexShrink: 0, color: homeVisualTokens.color.orange }}
            />
          )}
          <Typography sx={{ color: homeVisualTokens.color.navy, fontWeight: 700 }}>
            {message}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ConsumptionsSection({
  items,
}: Readonly<{ items: HomeDashboardViewModel["consumptions"] }>) {
  return (
    <Box component="section" aria-labelledby="home-consumptions-title">
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 1.5, alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography
          component="h2"
          id="home-consumptions-title"
          sx={{
            color: homeVisualTokens.color.navy,
            fontSize: "1.25rem",
            fontWeight: 800,
          }}
        >
          Mis consumos
        </Typography>
        {items.length > 0 && (
          <Button
            component={Link}
            href="/movements"
            size="small"
            sx={{ minWidth: 44 }}
          >
            Ver todos
          </Button>
        )}
      </Stack>
      {items.length === 0 ? (
        <Card
          role="status"
          variant="outlined"
          sx={{
            borderColor: homeVisualTokens.color.lavender,
            borderRadius: `${homeVisualTokens.radius.card}px`,
            bgcolor: homeVisualTokens.color.white,
            boxShadow: "none",
          }}
        >
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
              <Box
                component="img"
                src="/entry/LoginIlustration.webp"
                alt=""
                aria-hidden="true"
                sx={{ width: "min(100%, 220px)", height: 120, objectFit: "contain" }}
              />
              <Typography sx={{ color: homeVisualTokens.color.navy, fontWeight: 700 }}>
                Aún no tienes movimientos ni cuotas ejecutadas.
              </Typography>
              <Typography sx={{ color: homeVisualTokens.color.neutral }}>
                Cuando uses tu disponible, podrás consultar aquí tus consumos, cuotas y próximos pagos.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => <ConsumptionCard item={item} key={item.id} />)}
        </Stack>
      )}
    </Box>
  );
}

function DebtOverview({
  debt,
  showReportAction,
  onReportInstallment,
  isDebtFree,
}: Readonly<{
  debt: NonNullable<HomeDashboardViewModel["debt"]>;
  showReportAction: boolean;
  onReportInstallment: () => void;
  isDebtFree: boolean;
}>) {
  return (
    <Card
      component="section"
      aria-labelledby="home-debt-title"
      sx={{
        borderRadius: `${homeVisualTokens.radius.card}px`,
        bgcolor: homeVisualTokens.color.white,
        boxShadow: `0 8px 24px ${alpha(homeVisualTokens.color.navy, 0.08)}`,
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography
              component="h2"
              id="home-debt-title"
              sx={{ color: homeVisualTokens.color.navy, fontWeight: 700 }}
            >
              Deuda total acumulada
            </Typography>
            <Typography
              sx={{
                color: homeVisualTokens.color.navy,
                fontSize: "clamp(1.625rem, 8vw, 2.25rem)",
                fontWeight: 800,
                overflowWrap: "anywhere",
              }}
            >
              {isDebtFree ? "Estás al día" : debt.total}
            </Typography>
            {isDebtFree && (
              <Typography sx={{ color: homeVisualTokens.color.neutral }}>
                Continúas al día con tus cuotas y pagos.
              </Typography>
            )}
          </Stack>
          {(debt.nextPaymentDate || debt.nextPaymentAmount) && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1.5,
                p: 2,
                borderRadius: `${homeVisualTokens.radius.inset}px`,
                bgcolor: homeVisualTokens.color.surfaceTint,
              }}
            >
              {debt.nextPaymentDate && (
                <Box>
                  <Typography sx={{ color: homeVisualTokens.color.neutral, fontSize: "0.8125rem" }}>
                    Próxima cuota más cercana
                  </Typography>
                  <Typography sx={{ color: homeVisualTokens.color.navy, fontWeight: 800 }}>
                    {debt.nextPaymentDate}
                  </Typography>
                </Box>
              )}
              {debt.nextPaymentAmount && (
                <Box>
                  <Typography sx={{ color: homeVisualTokens.color.neutral, fontSize: "0.8125rem" }}>
                    Monto próximo a cancelar
                  </Typography>
                  <Typography sx={{ color: homeVisualTokens.color.violet, fontWeight: 800 }}>
                    {debt.nextPaymentAmount}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          {showReportAction && (
            <Button
              fullWidth
              onClick={onReportInstallment}
              sx={{ bgcolor: homeVisualTokens.color.navy }}
              type="button"
              variant="contained"
            >
              Reportar cuota
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function NewBusinessHomeDashboard({
  greeting,
  viewModel,
  onNotifications,
  onReportInstallment,
}: NewBusinessHomeDashboardProps) {
  return (
    <Stack spacing={2.5}>
      <HomeHeader
        greeting={greeting}
        firstName={viewModel.firstName}
        onNotifications={onNotifications}
      />
      <BalanceCard
        balance={viewModel.balance}
        onReportInstallment={onReportInstallment}
      />
      {viewModel.notice && (
        <AttentionNotice
          message={viewModel.notice.message}
          suspended={viewModel.balance.primaryActionLabel === "Reactivar"}
        />
      )}
      <ConsumptionsSection items={viewModel.consumptions} />
      {viewModel.debt && (
        <DebtOverview
          debt={viewModel.debt}
          onReportInstallment={onReportInstallment}
          showReportAction={viewModel.showReportInstallmentAction}
          isDebtFree={viewModel.consumptions.length === 0}
        />
      )}
    </Stack>
  );
}
