import nodemailer from "nodemailer";

let transporter = null;

export function getMailTransporter() {
  if (transporter) return transporter;

   transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.SMTPEMAIL,
          pass: process.env.SMTPASSWORD,
        },
      });
  

  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  if (!to) return { success: false, reason: "Missing recipient email" };

  try {
    const mailer = getMailTransporter();

    const info = await mailer.sendMail({
     from: `"D CHIN MART" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[SEND_MAIL_ERROR]", error);
    return { success: false, reason: error.message };
  }
}