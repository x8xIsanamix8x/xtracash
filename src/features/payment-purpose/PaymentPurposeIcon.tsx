import type { SvgIconComponent } from "@mui/icons-material";
import {
  CategoryOutlined,
  DirectionsCarOutlined,
  HomeOutlined,
  LocalGroceryStoreOutlined,
  MedicalServicesOutlined,
  PetsOutlined,
  ReceiptLongOutlined,
  SchoolOutlined,
  ShoppingBagOutlined,
  WorkOutlineRounded,
} from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material/SvgIcon";

import type { PaymentIconId } from "./types";

export const paymentIconComponents = {
  school: SchoolOutlined,
  stethoscope: MedicalServicesOutlined,
  "paw-print": PetsOutlined,
  receipt: ReceiptLongOutlined,
  "shopping-cart": LocalGroceryStoreOutlined,
  car: DirectionsCarOutlined,
  house: HomeOutlined,
  "shopping-bag": ShoppingBagOutlined,
  briefcase: WorkOutlineRounded,
  shapes: CategoryOutlined,
} as const satisfies Record<PaymentIconId, SvgIconComponent>;

type PaymentPurposeIconProps = SvgIconProps & Readonly<{
  iconId: PaymentIconId;
}>;

export function PaymentPurposeIcon({
  iconId,
  ...props
}: PaymentPurposeIconProps) {
  const Icon = paymentIconComponents[iconId];
  return <Icon {...props} />;
}
