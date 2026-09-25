import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import type { PaymentIconId } from "./types";

export type PaymentPurposeIconProps = Readonly<{
  sx?: SxProps<Theme>;
}>;

type PaymentIconComponent = (props: PaymentPurposeIconProps) => React.ReactNode;

const paymentIconSources = {
  house: "/payment-icons/house.png",
  wallet: "/payment-icons/wallet.png",
  card: "/payment-icons/card.png",
  car: "/payment-icons/car.png",
  fuel: "/payment-icons/fuel.png",
  scooter: "/payment-icons/scooter.png",
  calendar: "/payment-icons/calendar.png",
  people: "/payment-icons/people.png",
  school: "/payment-icons/school.png",
  badge: "/payment-icons/badge.png",
  sofa: "/payment-icons/sofa.png",
  envelope: "/payment-icons/envelope.png",
  gift: "/payment-icons/gift.png",
  coffee: "/payment-icons/coffee.png",
  heart: "/payment-icons/heart.png",
} as const;

function createPaymentIcon(source: string): PaymentIconComponent {
  return function PaymentIcon({ sx }: PaymentPurposeIconProps) {
    return (
      <Box
        alt=""
        aria-hidden="true"
        component="img"
        src={source}
        style={{ width: "1em", height: "1em", display: "block", objectFit: "contain" }}
        sx={sx}
      />
    );
  };
}

const newPaymentIconComponents = Object.fromEntries(
  Object.entries(paymentIconSources).map(([id, source]) => [id, createPaymentIcon(source)]),
) as Record<keyof typeof paymentIconSources, PaymentIconComponent>;

export const paymentIconComponents = {
  ...newPaymentIconComponents,
  // Mantiene visibles los pagos históricos mientras Core migra el catálogo.
  stethoscope: newPaymentIconComponents.heart,
  "paw-print": newPaymentIconComponents.heart,
  receipt: newPaymentIconComponents.calendar,
  "shopping-cart": newPaymentIconComponents.wallet,
  "shopping-bag": newPaymentIconComponents.gift,
  briefcase: newPaymentIconComponents.badge,
  shapes: newPaymentIconComponents.badge,
} as const satisfies Record<PaymentIconId, PaymentIconComponent>;

type PaymentPurposeIconComponentProps = PaymentPurposeIconProps & Readonly<{
  iconId: PaymentIconId;
}>;

export function PaymentPurposeIcon({
  iconId,
  ...props
}: PaymentPurposeIconComponentProps) {
  const Icon = paymentIconComponents[iconId];
  return <Icon {...props} />;
}
