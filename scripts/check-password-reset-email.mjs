#!/usr/bin/env node
/**
 * Print password-reset email configuration status for production VPS.
 *
 * Usage:
 *   cd /opt/taqfeelah
 *   set -a && source .env.production && set +a
 *   node scripts/check-password-reset-email.mjs
 */

function valueFromEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function isEmailDeliveryConfigured() {
  if (!valueFromEnv("AUTH_EMAIL_FROM")) return false;
  if (valueFromEnv("RESEND_API_KEY")) return true;
  if (valueFromEnv("SMTP_HOST")) return true;
  return false;
}

const enabled = valueFromEnv("AUTH_PASSWORD_RESET_ENABLED") === "true";
const emailConfigured = isEmailDeliveryConfigured();

console.log("Password reset enabled:", enabled ? "yes" : "no");
console.log("Email delivery configured:", emailConfigured ? "yes" : "no");
console.log("AUTH_EMAIL_FROM:", valueFromEnv("AUTH_EMAIL_FROM") || "<missing>");
console.log("RESEND_API_KEY:", valueFromEnv("RESEND_API_KEY") ? "<set>" : "<missing>");
console.log("SMTP_HOST:", valueFromEnv("SMTP_HOST") || "<missing>");

if (enabled && emailConfigured) {
  console.log("");
  console.log("OK: /saas-admin/forgot-password should show the email form.");
  process.exit(0);
}

console.log("");
console.log("Action required on VPS .env.production:");
if (!enabled) console.log("- AUTH_PASSWORD_RESET_ENABLED=true");
if (!valueFromEnv("AUTH_EMAIL_FROM")) console.log("- AUTH_EMAIL_FROM=noreply@taqfeelah.app");
if (!valueFromEnv("RESEND_API_KEY") && !valueFromEnv("SMTP_HOST")) {
  console.log("- RESEND_API_KEY=re_...  (recommended)");
  console.log("  or SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS");
}
console.log("Then: pm2 restart taqfeelah-app");
process.exit(1);
