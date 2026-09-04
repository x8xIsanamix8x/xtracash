import type { StartBiometricFlow } from "../types";
import { BiometricActionControl } from "./BiometricActionControl";

type BiometricLoginActionProps = Readonly<{
  onAuthenticate: StartBiometricFlow;
}>;

export function BiometricLoginAction({
  onAuthenticate,
}: BiometricLoginActionProps) {
  return (
    <BiometricActionControl
      actionLabel="Identificación biométrica"
      onAction={onAuthenticate}
      presentation="login-icon"
    />
  );
}
