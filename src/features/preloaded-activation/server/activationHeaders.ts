const DEFAULT_ACTIVATION_KEY = "impulsa-activacion-precargado";

/** Core siempre exige la clave: sin una configurada se envía la misma que Core usa por defecto. */
export function getActivationHeaders(configuredKey: string | undefined): Readonly<Record<string, string>> {
  return { "X-Activation-Key": configuredKey?.trim() || DEFAULT_ACTIVATION_KEY };
}
