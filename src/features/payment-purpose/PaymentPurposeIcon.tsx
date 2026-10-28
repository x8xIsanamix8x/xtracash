import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import type { PaymentIconId } from "./types";

export type PaymentPurposeIconProps = Readonly<{
  sx?: SxProps<Theme>;
}>;

type PaymentIconComponent = (props: PaymentPurposeIconProps) => React.ReactNode;

const paymentIconSources = {
  house: "/payment-icons/house.webp",
  wallet: "/payment-icons/wallet.webp",
  card: "/payment-icons/devices.webp",
  car: "/payment-icons/car.webp",
  fuel: "/payment-icons/fuel.webp",
  scooter: "/payment-icons/scooter.png",
  calendar: "/payment-icons/calendar.webp",
  people: "/payment-icons/people.png",
  school: "/payment-icons/school.webp",
  badge: "/payment-icons/percent.webp",
  sofa: "/payment-icons/paintbrush.webp",
  envelope: "/payment-icons/envelope.png",
  gift: "/payment-icons/gift.webp",
  coffee: "/payment-icons/coffee.webp",
  heart: "/payment-icons/heart.webp",
  "paw-print": "/payment-icons/paw-print.webp",
  receipt: "/payment-icons/wifi-home.webp",
  "shopping-cart": "/payment-icons/candy.webp",
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
