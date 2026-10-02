// Informational ranges from article 6.2 of the product's terms and conditions
// (features/auth/registration/termsAndConditions.ts). The operation's actual
// financing plan always comes from Core and is shown before confirmation.
export const financingGuideRanges = [
  { amount: "Hasta $50", installments: 1, days: 15 },
  { amount: "Más de $50 hasta $200", installments: 3, days: 45 },
  { amount: "Más de $200 hasta $500", installments: 4, days: 60 },
  { amount: "Más de $500 hasta $1.000", installments: 5, days: 75 },
  { amount: "Más de $1.000", installments: 6, days: 90 },
] as const;

export const paymentGuideSteps = [
  {
    title: "Disfruta 15 días sin intereses",
    description: "Paga el total de tu consumo dentro de los primeros 15 días y ahorra los intereses de financiamiento.",
    image: "/payment-guide/mascota-caminando.jpg",
    imageAlt: "Nuestra mascota de Impúlsate caminando contigo",
  },
  {
    title: "Tu monto define tu plazo",
    description: "Si pides el equivalente a $150, tendrás 3 cuotas en 45 días, con pagos cada 15 días.",
    image: "/payment-guide/mascota-escalando.jpg",
    imageAlt: "Nuestra mascota de Impúlsate avanzando paso a paso",
  },
  {
    title: "Avanza con todo claro",
    description: "Antes de confirmar tu Pago Móvil, revisa el plan que preparamos para ti.",
    image: "/payment-guide/mascota-listo.jpg",
    imageAlt: "Nuestra mascota de Impúlsate con el pulgar arriba",
  },
] as const;
