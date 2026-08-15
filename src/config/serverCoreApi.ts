import "server-only";

export type ServerCoreApiConfigurationResult =
  | Readonly<{ ok: true; baseUrl: string }>
  | Readonly<{ ok: false; error: "configuration" }>;

export function getServerCoreApiBaseUrl(): ServerCoreApiConfigurationResult {
  const configuredUrl = process.env.CORE_API_URL?.trim();

  if (!configuredUrl) {
    return { ok: false, error: "configuration" };
  }

  try {
    const parsedUrl = new URL(configuredUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { ok: false, error: "configuration" };
    }

    return { ok: true, baseUrl: configuredUrl.replace(/\/+$/, "") };
  } catch {
    return { ok: false, error: "configuration" };
  }
}
