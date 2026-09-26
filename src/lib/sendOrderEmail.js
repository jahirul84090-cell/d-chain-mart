import { sendMail } from "./mailer";

// Order emails must never break checkout, so failures are only logged.
export async function sendOrderEmail({ email, subject, html }) {
  try {
    await sendMail({ to: email, subject, html });
  } catch (error) {
    console.error("sendOrderEmail: failed", error.message);
  }
}
