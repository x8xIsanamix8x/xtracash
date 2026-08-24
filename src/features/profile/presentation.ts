import type { ProfileData, ProfilePersonalInfo } from "./types";

function groupDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function getProfileInitials(fullName: string): string {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) return "";

  const firstNameCharacters = Array.from(names[0]);
  const initials = names.length === 1
    ? firstNameCharacters.slice(0, 2).join("")
    : `${firstNameCharacters[0] ?? ""}${Array.from(names.at(-1) ?? "")[0] ?? ""}`;

  return initials.toLocaleUpperCase("es-VE");
}

export function formatProfileDocument(
  documentType: string,
  documentNumber: string,
): string {
  const displayedNumber = /^\d+$/.test(documentNumber)
    ? groupDigits(documentNumber)
    : documentNumber;
  return `${documentType}-${displayedNumber}`;
}

export function formatProfilePhone(phone: string): string {
  return /^04\d{9}$/.test(phone)
    ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
    : phone;
}

export function createProfileData(
  personalInfo: ProfilePersonalInfo,
): ProfileData {
  return {
    fullName: personalInfo.fullName,
    initials: getProfileInitials(personalInfo.fullName),
    document: formatProfileDocument(
      personalInfo.documentType,
      personalInfo.documentNumber,
    ),
    email: personalInfo.email,
    phone: formatProfilePhone(personalInfo.phone),
  };
}
