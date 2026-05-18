// lib/email.js
import nodemailer from "nodemailer";

export async function sendInvoiceEmail({
  recipientEmail,
  recipientName,
  invoiceNumber,
  orderId,
  orderTotal,
  pdfBuffer,
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      auth: {
        user: process.env.SMTPEMAIL,
        pass: process.env.SMTPASSWORD,
      },
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Your Store"}" <${
        process.env.EMAIL_USER
      }>`,
      to: recipientEmail,
      subject: `Invoice for Order #${orderId}`,
      html: `
        <p>Dear ${recipientName},</p>
        <p>Thank you for your recent purchase. Please find the attached invoice for your order.</p>
        <p>Order details:</p>
        <ul>
          <li>Order ID: ${orderId}</li>
          <li>Invoice Number: ${invoiceNumber}</li>
          <li>Total: $${orderTotal.toFixed(2)}</li>
        </ul>
        <p>Best regards,<br/>Your Store Team</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return { success: false, error: error.message };
  }
}
