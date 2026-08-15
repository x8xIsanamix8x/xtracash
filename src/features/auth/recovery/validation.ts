const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeRecoveryIdentifier = (identifier: string) =>
  identifier.trim().toLowerCase();

export function validateRecoveryIdentifier(identifier: string) {
  const value = normalizeRecoveryIdentifier(identifier);

  if (!value) {
    return "Ingresa tu correo electrónico.";
  }

  return emailPattern.test(value) ? "" : "Ingresa un correo electrónico válido.";
}
