import "server-only";

import type { PaymentDestination } from "../types";

type Environment = Readonly<Record<string, string | undefined>>;

function requiredValue(environment: Environment, key: string): string | null {
  const value = environment[key]?.trim();
  return value ? value : null;
}

function optionalValue(environment: Environment, key: string): string | null {
  return environment[key]?.trim() || null;
}

/**
 * Lee los datos del beneficiario que el BFF entrega a las instrucciones de pago.
 * Las variables de transferencia son opcionales, pero deben configurarse juntas.
 */
export function getPaymentDestinationFromEnvironment(
  environment: Environment = process.env,
): PaymentDestination | null {
  const bank = requiredValue(environment, "PAYMENT_DESTINATION_BANK_NAME");
  const bankCode = requiredValue(environment, "PAYMENT_DESTINATION_BANK_CODE");
  const taxId = requiredValue(environment, "PAYMENT_DESTINATION_TAX_ID");
  const rawPhone = requiredValue(environment, "PAYMENT_DESTINATION_PHONE");
  const phone = rawPhone?.replace(/\D/g, "") ?? null;
  const beneficiaryName = optionalValue(
    environment,
    "PAYMENT_DESTINATION_BENEFICIARY_NAME",
  );
  const rawAccount = optionalValue(environment, "PAYMENT_DESTINATION_BANK_ACCOUNT");
  const account = rawAccount?.replace(/\D/g, "") ?? null;
  const accountType = optionalValue(
    environment,
    "PAYMENT_DESTINATION_BANK_ACCOUNT_TYPE",
  );

  const transferValues = [beneficiaryName, account, accountType];
  const hasSomeTransferValue = transferValues.some(Boolean);
  const hasAllTransferValues = transferValues.every(Boolean);

  if (
    !bank
    || !bankCode
    || !/^\d{4}$/.test(bankCode)
    || !taxId
    || !phone
    || !/^(?:58\d{10}|0\d{10})$/.test(phone)
    || (hasSomeTransferValue && !hasAllTransferValues)
    || (account !== null && !/^\d{20}$/.test(account))
  ) {
    return null;
  }

  return {
    bank,
    bankCode,
    taxId,
    phone,
    beneficiaryName,
    account,
    accountType,
  };
}
