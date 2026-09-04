export type SameOriginBffPath = `/api/${string}`;

export type BiometricBffRoutes = Readonly<{
  activation: SameOriginBffPath;
  authentication: SameOriginBffPath;
  deactivation: SameOriginBffPath;
}>;

export const biometricBffRequestPolicy = {
  cache: "no-store",
  credentials: "same-origin",
} as const satisfies Pick<RequestInit, "cache" | "credentials">;
