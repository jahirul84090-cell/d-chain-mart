import { escapeHtml, sendMail } from "./mailer";
import { formatBDT, orderNumber } from "./format";

const SITE_NAME = process.env.SITE_NAME || "D Chin Mart";

export async function sendInvoiceEmail({
  recipientEmail,
  recipientName,
  invoiceNumber,
  orderId,
  orderTotal,
  pdfBuffer,
}) {
  try {
    const ref = orderNumber(orderId);
    await sendMail({
      to: recipientEmail,
      subject: `Your invoice for order ${ref} — ${SITE_NAME}`,
      text: `Dear ${recipientName || "customer"},\n\nThank you for shopping with ${SITE_NAME}. Your invoice ${invoiceNumber} for order ${ref} (total ${formatBDT(orderTotal)}) is attached.\n\n${SITE_NAME}`,
      html: `
        <p>Dear ${escapeHtml(recipientName || "customer")},</p>
        <p>Thank you for shopping with ${SITE_NAME}. Your invoice is attached.</p>
        <ul>
          <li>Order: <strong>${ref}</strong></li>
          <li>Invoice: ${escapeHtml(invoiceNumber)}</li>
          <li>Total: <strong>${formatBDT(orderTotal)}</strong></li>
        </ul>
        <p>Best regards,<br/>${SITE_NAME}</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error("sendInvoiceEmail: failed", error.message);
    return { success: false, error: "Failed to send invoice email." };
  }
}
