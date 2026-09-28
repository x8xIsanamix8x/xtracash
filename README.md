This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment configuration

Copy `.env.example` to `.env.local` and configure the public Core API URL used by registration and recovery, the server-only URL used by the authentication BFF, a random session secret of at least 32 characters, and the destination shown in payment instructions:

```bash
NEXT_PUBLIC_CORE_API_URL=https://core-api.sandbox.impulsa.vc
CORE_API_URL=https://core-api.sandbox.impulsa.vc
AUTH_SESSION_SECRET=
BIOMETRIC_ACCESS_ENABLED=false
PAYMENT_DESTINATION_BANK_NAME=
PAYMENT_DESTINATION_BANK_CODE=
PAYMENT_DESTINATION_TAX_ID=
PAYMENT_DESTINATION_PHONE=
PAYMENT_DESTINATION_BENEFICIARY_NAME=
PAYMENT_DESTINATION_BANK_ACCOUNT=
PAYMENT_DESTINATION_BANK_ACCOUNT_TYPE=
```

Generate `AUTH_SESSION_SECRET` securely for each environment and do not commit its value. Public Next.js environment variables are embedded during `next build`; `CORE_API_URL`, `AUTH_SESSION_SECRET`, and every `PAYMENT_DESTINATION_*` value remain server-only and must be available to the Next.js runtime.

`BIOMETRIC_ACCESS_ENABLED` is `false` by default, which hides biometric access from Login and Profile. The existing prototype can only be shown by explicitly setting it to `true`; its sandbox host and Core restrictions still apply.

| Variable | Required | Value |
| --- | --- | --- |
| `PAYMENT_DESTINATION_BANK_NAME` | Yes | Commercial bank name shown to the user. |
| `PAYMENT_DESTINATION_BANK_CODE` | Yes | Four-digit Venezuelan bank code. |
| `PAYMENT_DESTINATION_TAX_ID` | Yes | Beneficiary RIF, exactly as it should be displayed and copied. |
| `PAYMENT_DESTINATION_PHONE` | Yes | Mobile-payment recipient in local (`0414...`) or international (`58414...`) format. Spaces and hyphens are accepted. |
| `PAYMENT_DESTINATION_BENEFICIARY_NAME` | For transfers | Legal or personal name of the bank-account holder. |
| `PAYMENT_DESTINATION_BANK_ACCOUNT` | For transfers | Twenty-digit bank-account number. |
| `PAYMENT_DESTINATION_BANK_ACCOUNT_TYPE` | For transfers | Account type (`CTE`/`CORRIENTE` or `AHO`/`AHORRO`). |

The final three variables are one optional group: leave all three empty to offer only mobile payment, or configure all three to also offer bank transfer. These are beneficiary details, not information entered by the customer who reports the payment.

## Registration behavior

After the Core API accepts registration with any HTTP `2xx` response, the PWA returns to the access route, opens login, and shows a one-time notice asking the user to review their inbox or spam folder. Account activation remains the responsibility of Keycloak; the PWA does not verify activation.

A real browser test continues to depend on the Core API allowing CORS for the PWA origin.

## Authentication behavior

Login, refresh, session checks, and logout use same-origin Route Handlers. Access and refresh tokens are stored in separate HttpOnly cookies and are never returned in JSON or exposed to client components. The protected application routes require a valid signed session marker, and access renewal occurs through the BFF before expiration.

This authentication architecture requires a Next.js server runtime. A static-only export cannot provide Route Handlers, HttpOnly cookie management, refresh, logout, or server-side route protection.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
