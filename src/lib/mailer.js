import nodemailer from "nodemailer";

const SITE_NAME = process.env.SITE_NAME || "D Chin Mart";

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      auth: {
        user: process.env.SMTPEMAIL,
        pass: process.env.SMTPASSWORD,
      },
    });
  }
  return transporter;
}

// Single place that sends email, always branded with the store name.
export async function sendMail({ to, subject, html, text, replyTo, attachments }) {
  if (!to) throw new Error("sendMail: missing recipient");
  await getTransporter().sendMail({
    from: `"${SITE_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
    replyTo,
    attachments,
  });
}

export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
