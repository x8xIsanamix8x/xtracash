export const RECOVERY_COOLDOWN_STORAGE_KEY = "impulsate:recovery-cooldown-until";
export const RECOVERY_COOLDOWN_DURATION_MS = 12 * 60 * 1000;

let memoryCooldownUntil: number | null = null;

function removeStoredCooldown(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(RECOVERY_COOLDOWN_STORAGE_KEY);
  } catch {
    // El respaldo en memoria mantiene operativo el flujo si Web Storage no está disponible.
  }
}

function readStoredCooldown(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const storedValue = window.localStorage.getItem(RECOVERY_COOLDOWN_STORAGE_KEY);
    if (storedValue === null) return null;

    const cooldownUntil = Number(storedValue);
    if (!Number.isFinite(cooldownUntil) || cooldownUntil <= 0) {
      removeStoredCooldown();
      return null;
    }

    return cooldownUntil;
  } catch {
    return null;
  }
}

export function clearRecoveryCooldown(): void {
  memoryCooldownUntil = null;
  removeStoredCooldown();
}

export function getRecoveryCooldownUntil(now = Date.now()): number | null {
  const storedCooldownUntil = readStoredCooldown();
  const cooldownUntil = Math.max(storedCooldownUntil ?? 0, memoryCooldownUntil ?? 0);

  if (cooldownUntil <= now) {
    clearRecoveryCooldown();
    return null;
  }

  memoryCooldownUntil = cooldownUntil;
  return cooldownUntil;
}

export function getRecoveryCooldownRemainingSeconds(
  cooldownUntil: number,
  now = Date.now(),
): number {
  return Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
}

export function formatRecoveryCooldownTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function startRecoveryCooldown(now = Date.now()): number {
  // Protección de experiencia de usuario: no sustituye el rate limiting del backend.
  const cooldownUntil = now + RECOVERY_COOLDOWN_DURATION_MS;
  memoryCooldownUntil = cooldownUntil;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RECOVERY_COOLDOWN_STORAGE_KEY, String(cooldownUntil));
    } catch {
      // El timestamp ya quedó disponible mediante el respaldo en memoria.
    }
  }

  return cooldownUntil;
}
