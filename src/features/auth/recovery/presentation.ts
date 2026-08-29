export const PUBLIC_RECOVERY_SUCCESS_MESSAGE =
  "Si el correo se encuentra registrado, recibirás un enlace válido por 12 horas. Revisa tu bandeja de entrada o en la carpeta de correo no deseado.";

export const PROFILE_RECOVERY_SUCCESS_MESSAGE =
  "Enviamos un enlace para cambiar tu contraseña al correo asociado a tu cuenta. El enlace será válido durante 12 horas. Revisa tu bandeja de entrada y la carpeta de correo no deseado.";

export function maskRecoveryEmail(email: string): string {
  const separatorIndex = email.indexOf("@");
  if (separatorIndex <= 0 || separatorIndex === email.length - 1) return "••••••";

  const localPart = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);
  const visibleLocal = localPart.length <= 2
    ? `${localPart[0]}••`
    : `${localPart[0]}${"•".repeat(Math.min(6, localPart.length - 2))}${localPart.at(-1)}`;

  return `${visibleLocal}@${domain}`;
}
