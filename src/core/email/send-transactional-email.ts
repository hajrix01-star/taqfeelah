import { createTransport } from "nodemailer";
import { readEnv } from "@/core/config/env";
import { ServiceUnavailableError } from "@/core/errors/app-error";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

async function sendViaResend(input: SendEmailInput, apiKey: string, from: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ServiceUnavailableError(
      typeof payload?.message === "string" ? payload.message : "Email provider request failed.",
    );
  }
}

async function sendViaSmtp(
  input: SendEmailInput,
  config: { host: string; port: number; user?: string; pass?: string; from: string },
) {
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  });

  await transport.sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<{ method: string }> {
  const env = readEnv();
  const from = env.AUTH_EMAIL_FROM;
  if (!from) {
    throw new ServiceUnavailableError("AUTH_EMAIL_FROM is not configured.");
  }

  if (env.RESEND_API_KEY) {
    await sendViaResend(input, env.RESEND_API_KEY, from);
    return { method: "resend" };
  }

  if (env.SMTP_HOST) {
    const port = Number(env.SMTP_PORT || "587");
    await sendViaSmtp(input, {
      host: env.SMTP_HOST,
      port: Number.isInteger(port) && port > 0 ? port : 587,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from,
    });
    return { method: "smtp" };
  }

  if (env.NODE_ENV !== "production") {
    console.info("[email:dev-fallback]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { method: "dev_log" };
  }

  throw new ServiceUnavailableError("Email delivery is not configured.");
}
