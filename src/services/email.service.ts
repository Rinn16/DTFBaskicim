import nodemailer from "nodemailer";
import type { OrderEmailData } from "@/lib/email-templates";
import {
  welcomeHtml,
  orderConfirmationHtml,
  orderShippedHtml,
  passwordResetHtml,
} from "@/lib/email-templates";
import { db } from "@/lib/db";

type EmailType = "emailWelcome" | "emailOrderConfirm" | "emailShipped";

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

/** Üyelik kaydı sonrası hoş geldiniz e-postası */
export async function sendWelcomeEmail(to: string, customerName: string) {
  if (!(await isEmailTypeEnabled("emailWelcome"))) return;
  const { subject, html } = await welcomeHtml(customerName);
  await sendEmail({ to, subject, html });
}

/** Sipariş alındıktan sonra onay e-postası */
export async function sendOrderConfirmation(to: string, data: OrderEmailData) {
  if (!(await isEmailTypeEnabled("emailOrderConfirm"))) return;
  const { subject, html } = await orderConfirmationHtml(data);
  await sendEmail({ to, subject, html });
}

/** Şifre sıfırlama e-postası (settings kontrolü yok — her zaman gönder) */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { subject, html } = await passwordResetHtml(resetUrl);
  await sendEmail({ to, subject, html });
}

/** Kargoya verildiğinde gönderilen e-posta */
export async function sendOrderShipped(to: string, data: OrderEmailData) {
  if (!(await isEmailTypeEnabled("emailShipped"))) return;
  const { subject, html } = await orderShippedHtml(data);
  await sendEmail({ to, subject, html });
}

/** Email doğrulama e-postası (settings kontrolü yok — her zaman gönder) */
export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <h2 style="color:#0f172a;margin:0 0 12px;">Email Adresinizi Doğrulayın</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;">Hesabınızı tamamlamak için aşağıdaki butona tıklayın:</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#137fec;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;font-size:15px;">Email Adresimi Doğrula</a>
      <p style="color:#94a3b8;font-size:13px;line-height:1.5;">Bu link 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.</p>
    </div>
  `;
  await sendEmail({ to, subject: "Email Adresinizi Doğrulayın - DTF Baskıcım", html });
}
