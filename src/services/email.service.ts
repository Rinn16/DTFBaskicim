import nodemailer from "nodemailer";
import type { OrderEmailData } from "@/lib/email-templates";
import {
  orderConfirmationHtml,
  orderStatusUpdateHtml,
} from "@/lib/email-templates";
import { db } from "@/lib/db";

type EmailType = "emailOrderConfirm" | "emailStatusUpdate" | "emailWelcome" | "emailOtp";

async function isEmailTypeEnabled(type: EmailType): Promise<boolean> {
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings?.emailEnabled) return false;
  return settings[type] ?? false;
}

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: (process.env.SMTP_PORT || "587") === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.warn("[email] SMTP_HOST not configured — skipping email to", to);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "DTF Baskıcım <noreply@dtfbaskicim.com>",
    to,
    subject,
    html,
  });
}

export async function sendOrderConfirmation(
  to: string,
  data: OrderEmailData,
) {
  if (!(await isEmailTypeEnabled("emailOrderConfirm"))) return;
  const { subject, html } = await orderConfirmationHtml(data);
  await sendEmail({ to, subject, html });
}

export async function sendOrderStatusUpdate(
  to: string,
  data: OrderEmailData,
  newStatus: string,
) {
  if (!(await isEmailTypeEnabled("emailStatusUpdate"))) return;
  const { subject, html } = await orderStatusUpdateHtml(data, newStatus);
  await sendEmail({ to, subject, html });
}
