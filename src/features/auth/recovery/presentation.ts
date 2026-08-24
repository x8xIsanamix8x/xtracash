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
