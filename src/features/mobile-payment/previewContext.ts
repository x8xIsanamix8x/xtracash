import type { Bank, DirectoryContact } from "./types";

// Visual-only fallback for local development when Core is unavailable.
export const previewBanks: readonly Bank[] = [
  { code: "0102", name: "Banco de Venezuela" },
  { code: "0134", name: "Banesco" },
  { code: "0105", name: "Mercantil" },
];

export const previewContacts: readonly DirectoryContact[] = [
  { id: "preview-carlos", name: "Carlos", bankCode: "0134", documentType: "V", documentNumber: "00000000", phone: "04120000000" },
  { id: "preview-andrea", name: "Andrea", bankCode: "0105", documentType: "V", documentNumber: "00000000", phone: "04120000000" },
  { id: "preview-daniel", name: "Daniel", bankCode: "0102", documentType: "V", documentNumber: "00000000", phone: "04120000000" },
  { id: "preview-maria", name: "María", bankCode: "0134", documentType: "V", documentNumber: "00000000", phone: "04120000000" },
  { id: "preview-otto", name: "Otto", bankCode: "0105", documentType: "V", documentNumber: "00000000", phone: "04120000000" },
];

export const previewAvailableBs = "143963.72";
