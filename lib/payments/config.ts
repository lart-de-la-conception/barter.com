function normalizeEnvValue(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const stripeSecretKey = normalizeEnvValue(process.env.STRIPE_SECRET_KEY);
const stripeWebhookSecret = normalizeEnvValue(process.env.STRIPE_WEBHOOK_SECRET);
const configuredAppUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_APP_URL);
const paymentTestMode = normalizeEnvValue(process.env.PAYMENTS_TEST_MODE);
const platformFeeBpsRaw = normalizeEnvValue(process.env.PAYMENT_PLATFORM_FEE_BPS);
const defaultCurrencyRaw = normalizeEnvValue(process.env.PAYMENT_DEFAULT_CURRENCY);

export function isStripeConfigured() {
  return Boolean(stripeSecretKey);
}

export function hasStripeWebhookSecret() {
  return Boolean(stripeWebhookSecret);
}

export function getStripeSecretKey() {
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return stripeSecretKey;
}

export function getStripeWebhookSecret() {
  if (!stripeWebhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return stripeWebhookSecret;
}

export function getConfiguredAppUrl() {
  return configuredAppUrl;
}

export function getPaymentPlatformFeeBps() {
  const parsed = Number(platformFeeBpsRaw ?? "800");
  if (!Number.isFinite(parsed)) return 800;
  return Math.max(0, Math.min(3000, Math.round(parsed)));
}

export function getPaymentDefaultCurrency() {
  return (defaultCurrencyRaw ?? "usd").toLowerCase();
}

export function isPaymentTestModeEnabled() {
  if (paymentTestMode) {
    return paymentTestMode === "true";
  }
  return false;
}
