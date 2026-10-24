/**
 * Lista temporal de usuarios habilitados para el promocional de marketplace.
 * Agrega o quita correos aquí; se comparan normalizados (sin espacios y en minúsculas).
 */
export const MARKETPLACE_ALLOWED_EMAILS = [
  "lmelo@impulsatechs.com",
  "molinagabriel9678@gmail.com",
] as const;

export function canAccessMarketplace(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
  return MARKETPLACE_ALLOWED_EMAILS.some(
    (allowedEmail) => allowedEmail.toLocaleLowerCase("en-US") === normalizedEmail,
  );
}
