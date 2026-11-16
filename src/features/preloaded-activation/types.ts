export type PreloadedActivationStatus = "VALIDADA" | "PENDIENTE_ACTIVACION";
export type ActivationEmailStatus = "ENVIADO" | "FALLIDO" | null;

export type PreloadedActivationProfile = Readonly<{
  cedula: string;
  correo: string;
  nombre: string;
  apellido: string;
  telefono: string;
  estado: PreloadedActivationStatus;
  correoActivacion: ActivationEmailStatus;
}>;

export type PreloadedActivationSubmission = Readonly<{
  correoActivacion: "ENVIADO" | "FALLIDO";
}>;

export type PreloadedActivationStep = "identity" | "details" | "submitted";
