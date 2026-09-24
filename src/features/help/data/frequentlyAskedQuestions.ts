export type FrequentlyAskedQuestionDetail = Readonly<{
  label: string;
  value: string;
}>;

export type FrequentlyAskedQuestionAction = Readonly<{
  href: string;
  label: string;
  prefix?: string;
}>;

export type FrequentlyAskedQuestion = Readonly<{
  action?: FrequentlyAskedQuestionAction;
  answer: string;
  details?: readonly FrequentlyAskedQuestionDetail[];
  note?: string;
  question: string;
}>;

export type FrequentlyAskedQuestionGroup = Readonly<{
  id: string;
  questions: readonly FrequentlyAskedQuestion[];
  title: string;
}>;

export const frequentlyAskedQuestionGroups: readonly FrequentlyAskedQuestionGroup[] = [
  {
    id: "about",
    title: "Sobre Impúlsate Móvil",
    questions: [
      {
        question: "¿Qué es Impúlsate Móvil?",
        answer: "Impúlsate Móvil es la aplicación móvil que está transformando la manera de financiarse en Venezuela. Ofrece a los usuarios la posibilidad de obtener créditos ágiles, llevar un control de gastos en tiempo real y gestionar todo de forma 100% digital, directamente desde su teléfono.",
      },
      {
        question: "¿Quién respalda esta plataforma?",
        answer: "Impúlsate Móvil cuenta con el respaldo financiero y la sólida trayectoria de Impulsa Venture Capital, combinado con una robusta tecnología de Pago Móvil para garantizar transacciones rápidas y seguras.",
      },
      {
        question: "¿Qué beneficio especial hay para el equipo de Banco Activo?",
        answer: "A través de Impulsa Venture Capital C.A., estamos ofreciendo acceso prioritario y condiciones exclusivas de financiamiento para todo el personal de Banco Activo, permitiéndoles probar de primera mano la agilidad de la plataforma.",
      },
    ],
  },
  {
    id: "application-and-disbursement",
    title: "Solicitud y recepción del financiamiento",
    questions: [
      {
        question: "¿Cuánto tarda el proceso de aprobación?",
        answer: "El proceso es 100% digital y automatizado. La evaluación se realiza en minutos desde la aplicación, evitando procesos y trámites físicos innecesarios.",
      },
      {
        question: "¿Cómo se reciben los créditos de Impúlsate Móvil?",
        answer: "Los fondos se reciben vía Pago Móvil. Una vez aprobado el financiamiento, el monto se liquida de manera inmediata en la cuenta bancaria indicada por el usuario.",
      },
    ],
  },
  {
    id: "financing-management",
    title: "Consulta y gestión del financiamiento",
    questions: [
      {
        question: "¿Cómo puedo llevar el control de lo que debo?",
        answer: "La solución cuenta con una sección de control en tiempo real. Allí podrás consultar tus fechas de pago, montos pendientes y el estatus de tu línea de financiamiento las 24 horas del día.",
      },
      {
        question: "¿Cuál es el plazo máximo para pagar el financiamiento?",
        answer: "Dispones de un plazo flexible, adaptado al monto de financiamiento solicitado y a las condiciones correspondientes.",
      },
    ],
  },
  {
    id: "payments",
    title: "Pagos, moneda y comisiones",
    questions: [
      {
        question: "¿Cómo puedo realizar el pago total o parcial de mi financiamiento?",
        answer: "El proceso es sencillo, rápido y 100% digital. Puedes realizar abonos totales o parciales a través de Pago Móvil.",
        details: [
          { label: "Banco", value: "Banco Activo" },
          { label: "RIF", value: "J-50088704-3" },
          { label: "Número de teléfono", value: "0414-3701076" },
        ],
        note: "Después de realizar el pago, recuerda reportarlo en la aplicación.",
      },
      {
        question: "¿En qué moneda se calcula y se cancela la deuda?",
        answer: "La deuda se calcula con base en el dólar (USD) referencial. Al momento de realizar tu pago en bolívares, el monto se actualizará automáticamente según la tasa oficial del Banco Central de Venezuela (BCV) correspondiente al día.",
      },
      {
        question: "¿Quién asume las comisiones de la plataforma y de cuánto son?",
        answer: "Las comisiones operativas son asumidas por el usuario y corresponden al 3% del valor de cada transacción.",
      },
    ],
  },
  {
    id: "access-and-support",
    title: "Acceso a la plataforma y soporte",
    questions: [
      {
        question: "¿Dónde puedo acceder a la aplicación?",
        answer: "Puedes gestionar tu financiamiento y acceder a las funcionalidades de Impúlsate Móvil a través de nuestra plataforma oficial:",
        action: {
          href: "https://impulsate-app.sandbox.impulsa.vc/",
          label: "impulsate-app.sandbox.impulsa.vc",
        },
      },
      {
        question: "En caso de fallas o dudas con la aplicación, ¿cómo solicito soporte?",
        answer: "Si necesitas ayuda con Impúlsate Móvil, nuestro equipo técnico está disponible a través del siguiente canal oficial:",
        action: {
          href: "mailto:soporte@impulsatechs.com",
          label: "soporte@impulsatechs.com",
          prefix: "Correo electrónico",
        },
      },
    ],
  },
  {
    id: "digital-experience",
    title: "Documentación y experiencia digital",
    questions: [
      {
        question: "¿Necesito consignar documentos en físico?",
        answer: "No. La experiencia es 100% digital. Todo el registro, la carga de requisitos mínimos y la gestión correspondiente se realizan directamente desde la plataforma.",
      },
    ],
  },
];

export const frequentlyAskedQuestions: readonly FrequentlyAskedQuestion[] =
  frequentlyAskedQuestionGroups.flatMap((group) => group.questions);
