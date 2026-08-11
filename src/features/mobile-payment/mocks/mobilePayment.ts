import type {
  Bank,
  DirectoryContact,
  DirectoryStatus,
} from "../types";

export const destinationBanks = [
  { code: "0171", name: "Banco Activo" },
  { code: "0102", name: "Banco de Venezuela" },
  { code: "0134", name: "Banesco" },
  { code: "0108", name: "BBVA Provincial" },
  { code: "0105", name: "Mercantil" },
] as const satisfies readonly Bank[];

export const directoryContacts = [
  {
    id: "contact-ana",
    name: "Ana Pérez",
    bankCode: "0171",
    nationality: "V",
    documentNumber: "18456789",
    phone: "04120001001",
  },
  {
    id: "contact-carlos",
    name: "Carlos Mendoza",
    bankCode: "0102",
    nationality: "E",
    documentNumber: "8123456",
    phone: "04240001002",
  },
  {
    id: "contact-sofia",
    name: "Sofía Ramírez",
    bankCode: "0134",
    nationality: "V",
    documentNumber: "23123456",
    phone: "04140001003",
  },
] as const satisfies readonly DirectoryContact[];

export const mobilePaymentMock = {
  initialDirectoryStatus: "ready" satisfies DirectoryStatus,
  directoryRetryDelay: 600,
  directoryDeleteDelay: 600,
  directoryDeleteShouldFail: false,
} as const;
