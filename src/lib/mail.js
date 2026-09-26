import { sendMail as send } from "./mailer";

// Non-throwing wrapper used by loan notifications.
export async function sendMail({ to, subject, html, text }) {
  if (!to) return { success: false, reason: "Missing recipient email" };
  try {
    await send({ to, subject, html, text });
    return { success: true };
  } catch (error) {
    console.error("[SEND_MAIL_ERROR]", error.message);
    return { success: false, reason: "Email could not be sent" };
  }
}
