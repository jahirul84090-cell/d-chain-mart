import nodemailer from "nodemailer";

const SITE_NAME = process.env.SITE_NAME || "D Chin Mart";

// Escape user-controlled values (e.g. the account name) before putting them in HTML.
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const COPY = {
  verify: {
    subject: `Your ${SITE_NAME} verification code`,
    heading: "Verify your email",
    intro: `Thanks for signing up with ${SITE_NAME}! Use this code to verify your email address:`,
    footer: "If you didn't create an account, you can safely ignore this email.",
  },
  reset: {
    subject: `Your ${SITE_NAME} password reset code`,
    heading: "Reset your password",
    intro: "We received a request to reset your password. Use this code to continue:",
    footer: "If you didn't request a password reset, you can safely ignore this email. Your password will not change.",
  },
};

export async function sendOtpEmail({ email, name, otpCode, type = "verify" }) {
  const copy = COPY[type] || COPY.verify;
  const safeName = escapeHtml(name || "there");
  const year = new Date().getFullYear();

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      auth: {
        user: process.env.SMTPEMAIL,
        pass: process.env.SMTPASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${SITE_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: copy.subject,
      text: `Hello ${name || "there"},\n\n${copy.intro}\n\n${otpCode}\n\nThis code expires in 10 minutes.\n\n${copy.footer}\n\n${SITE_NAME}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${copy.heading}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px auto;">
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #111827; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${SITE_NAME}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h2 style="color: #333333; font-size: 22px; margin: 0 0 10px;">${copy.heading}</h2>
                <p style="color: #555555; font-size: 16px; margin: 0 0 20px;">Hello ${safeName},</p>
                <p style="color: #555555; font-size: 16px; margin: 0 0 20px;">${copy.intro}</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="color: #111827; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 6px;">${otpCode}</p>
                </div>
                <p style="color: #555555; font-size: 14px; margin: 0 0 20px;">This code expires in 10 minutes. Never share it with anyone.</p>
                <p style="color: #777777; font-size: 13px; margin: 20px 0 0;">${copy.footer}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                <p style="color: #777777; font-size: 12px; margin: 0;">© ${year} ${SITE_NAME}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("sendOtpEmail: Error", error.message);
    throw new Error("Failed to send OTP email");
  }
}
