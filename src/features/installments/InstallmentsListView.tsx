"use client";

import Link from "next/link";
import {
  CloudOffRounded,
  ReplayRounded,
  TaskAltRounded,
} from "@mui/icons-material";
import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";

import { ConsumptionCard } from "@/features/home/components/ConsumptionCard";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";

import { InstallmentsHeader } from "./components/InstallmentsHeader";
import { pillButton, StateCard } from "./components/StateCard";
import { InstallmentsScreen } from "./components/InstallmentsScreen";
import { useInstallmentsOverview } from "./InstallmentsProvider";
import { createInstallmentsListItems } from "./presentation";

const reducedMotion = {
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
} as const;

function ListSkeleton() {
  return (
    <Stack aria-busy="true" aria-label="Cargando tus cuotas" role="status" spacing={1.5}>
      {[0, 1].map((key) => (
        <Skeleton
          animation="wave"
          aria-hidden="true"
          height={150}
          key={key}
          sx={{ borderRadius: `${homeVisualTokens.radius.card}px`, ...reducedMotion }}
          variant="rounded"
        />
      ))}
    </Stack>
  );
}

export function InstallmentsListView() {
  const overview = useInstallmentsOverview();

  const content = (() => {
    if (overview.status === "loading") return <ListSkeleton />;

    if (overview.status === "error") {
      return (
        <StateCard
          action={(
            <Button
              onClick={overview.retry}
              startIcon={<ReplayRounded />}
              sx={pillButton}
              variant="contained"
            >
              Reintentar
            </Button>
          )}
          description={overview.error === "network"
            ? "Revisa tu conexión a internet e inténtalo nuevamente."
            : "Ocurrió un problema al consultar tus cuotas. Inténtalo nuevamente."}
          icon={<CloudOffRounded />}
          title="No pudimos cargar tus cuotas"
        />
      );
    }

    const items = createInstallmentsListItems(overview.data);
    if (items.length === 0) {
      return (
        <StateCard
          action={(
            <Button component={Link} href="/home" sx={pillButton} variant="contained">
              Volver al inicio
            </Button>
          )}
          description="No tienes cuotas pendientes por pagar."
          icon={<TaskAltRounded />}
          title="Estás al día"
        />
      );
    }

    return (
      <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: "none" }}>
        {items.map((item) => (
          <li key={item.card.id}>
            <ConsumptionCard
              highlightLabel={item.isNext ? "Próxima" : undefined}
              href={item.href}
              item={item.card}
            />
          </li>
        ))}
      </Stack>
    );
  })();

  return (
    <InstallmentsScreen>
      <Stack spacing={2.5}>
        <InstallmentsHeader title="Mis cuotas" />
        <Box component="section" aria-labelledby="installments-list-title">
          <Typography
            component="h2"
            id="installments-list-title"
            sx={{
              mb: 1.5,
              color: homeVisualTokens.color.navy,
              fontSize: "1.25rem",
              fontWeight: 800,
            }}
          >
            Próximas cuotas
          </Typography>
          {content}
        </Box>
      </Stack>
    </InstallmentsScreen>
  );
}
