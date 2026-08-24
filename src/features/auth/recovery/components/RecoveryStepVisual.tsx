import { CheckCircleRounded, LockResetRounded } from "@mui/icons-material";

import { SecurityFlowVisual } from "../../shared/components/SecurityFlowVisual";

type RecoveryStepVisualProps = Readonly<{
  success?: boolean;
}>;

export function RecoveryStepVisual({ success = false }: RecoveryStepVisualProps) {
  return (
    <SecurityFlowVisual
      icon={success ? CheckCircleRounded : LockResetRounded}
      message={success
        ? "Tu solicitud se procesó correctamente."
        : "Recupera tu acceso de forma segura."}
    />
  );
}
