/** Devuelve el header privado solo si el despliegue configuró una clave explícita. */
export function getActivationHeaders(configuredKey: string | undefined): Readonly<Record<string, string>> {
  const key = configuredKey?.trim();
  return key ? { "X-Activation-Key": key } : {};
}
