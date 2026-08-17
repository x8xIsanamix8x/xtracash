export type CoreApiConfigurationError = Readonly<{
  type: "configuration";
}>;

export type CoreApiConfigurationResult =
  | Readonly<{ ok: true; baseUrl: string }>
  | Readonly<{ ok: false; error: CoreApiConfigurationError }>;

export function getCoreApiBaseUrl(): CoreApiConfigurationResult {
  const configuredUrl = process.env.NEXT_PUBLIC_CORE_API_URL?.trim();

  if (!configuredUrl) {
    return { ok: false, error: { type: "configuration" } };
  }

  try {
    const parsedUrl = new URL(configuredUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { ok: false, error: { type: "configuration" } };
    }

    return { ok: true, baseUrl: configuredUrl.replace(/\/+$/, "") };
  } catch {
    return { ok: false, error: { type: "configuration" } };
  }
}
