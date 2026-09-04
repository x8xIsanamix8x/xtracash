export { biometricAccessFeatureEnabled } from "./config";
export { biometricBffRequestPolicy } from "./bffContract";
export { BiometricLoginAction } from "./components/BiometricLoginAction";
export { BiometricProfileSection } from "./components/BiometricProfileSection";
export {
  getBiometricAccessIntegration,
  getBiometricAccessPreviewIntegration,
} from "./integration";
export type {
  BiometricAccessIntegration,
  BiometricAccessStatus,
  StartBiometricFlow,
} from "./types";
export type { BiometricBffRoutes, SameOriginBffPath } from "./bffContract";
