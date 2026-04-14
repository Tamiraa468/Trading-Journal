import "server-only";

import nodemailer from "nodemailer";

type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;
let usePreviewTransport = false;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSmtpPort(): number {
  const raw = process.env.SMTP_PORT?.trim();
  if (!raw) return 587;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid SMTP_PORT value.");
  }

  return parsed;
}

function shouldUseSecureSmtp(port: number): boolean {
  const raw = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (!raw) return port === 465;
  return raw === "1" || raw === "true" || raw === "yes";
}

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim().replace(/\s+/g, "");

  const hasSmtpConfig = Boolean(host && user && pass);

  if (!hasSmtpConfig) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Missing SMTP_HOST/SMTP_USER/SMTP_PASS environment variables in production.",
      );
    }

    usePreviewTransport = true;
    cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
    return cachedTransporter;
  }

  const port = getSmtpPort();

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: shouldUseSecureSmtp(port),
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

export async function sendTransactionalEmail(input: SendTransactionalEmailInput) {
  const transporter = getTransporter();
  const from = usePreviewTransport
    ? process.env.SMTP_FROM?.trim() || "TradeJournal <no-reply@localhost>"
    : getRequiredEnv("SMTP_FROM");

  const info = await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (usePreviewTransport && process.env.NODE_ENV !== "production") {
    console.info("[mailer:preview] email buffered", {
      to: input.to,
      subject: input.subject,
      messageId: info.messageId,
    });
  }
}
