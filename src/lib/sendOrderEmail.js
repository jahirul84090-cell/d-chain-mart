import nodemailer from "nodemailer";

export async function sendOrderEmail({ email, subject, html }) {
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
      from: `"BD STORE" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: subject,
      html,
    });

    // Corrected console.log statement
    console.log("sendOrderEmail: Order email sent successfully", {
      email,
      subject,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to send order email:", error); // Use console.error for
    // throw new Error("Failed to send order email"); // Updated error message for clarity
  }
}
