import { sendMail } from "@/lib/mail";

const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;

function baseTemplate({ title, name, content }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
      <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#2563eb;color:white;padding:22px 26px;">
          <h2 style="margin:0;font-size:22px;">${title}</h2>
        </div>

        <div style="padding:26px;color:#111827;font-size:15px;line-height:1.7;">
          <p>Hello ${name || "Customer"},</p>
          ${content}
          <p style="margin-top:28px;">
            Thank you,<br/>
            <strong>D Chin Mart</strong>
          </p>
        </div>

        <div style="background:#f9fafb;padding:14px 26px;color:#6b7280;font-size:12px;">
          This is an automated email. Please do not reply directly.
        </div>
      </div>
    </div>
  `;
}

export async function sendLoanEmail({
  type,
  loan,
  installment,
}) {
  const userEmail = loan?.user?.email;
  const userName = loan?.user?.name || loan?.applicantName;
  const productName = loan?.product?.name || "your selected product";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!userEmail) return;

  const data = {
    APPLICATION_SUBMITTED: {
      subject: "Loan Application Received",
      title: "Loan Application Received",
      content: `
        <p>Your loan application for <strong>${productName}</strong> has been received.</p>
        <p>Our team will review your application and contact you soon.</p>
      `,
    },

    REVIEWING: {
      subject: "Loan Application Under Review",
      title: "Loan Application Under Review",
      content: `
        <p>Your loan application for <strong>${productName}</strong> is now under review.</p>
        <p>We may contact you if additional information is required.</p>
      `,
    },

    APPROVED: {
      subject: "Loan Approved",
      title: "Loan Approved",
      content: `
        <p>Good news! Your loan application for <strong>${productName}</strong> has been approved.</p>
        <p><strong>Down Payment:</strong> ${money(loan.downPayment)}</p>
        <p><strong>Loan Amount:</strong> ${money(loan.loanAmount)}</p>
        <p><strong>Monthly EMI:</strong> ${money(loan.monthlyEmi)}</p>
      `,
    },

    DOWN_PAYMENT_PENDING: {
      subject: "Down Payment Required",
      title: "Down Payment Required",
      content: `
        <p>Your loan has been approved.</p>
        <p><strong>Required Down Payment:</strong> ${money(loan.downPayment)}</p>
        <p>Please complete the payment to activate your loan.</p>
      `,
    },

    ACTIVE: {
      subject: "Loan Activated",
      title: "Loan Activated",
      content: `
        <p>Your loan for <strong>${productName}</strong> is now active.</p>
        <p><strong>Monthly EMI:</strong> ${money(loan.monthlyEmi)}</p>
        <p><strong>Tenure:</strong> ${loan.tenureMonths} months</p>
      `,
    },

    REJECTED: {
      subject: "Loan Application Rejected",
      title: "Loan Application Rejected",
      content: `
        <p>We are sorry.</p>
        <p>Your loan application for <strong>${productName}</strong> was not approved.</p>
      `,
    },

    COMPLETED: {
      subject: "Loan Completed",
      title: "Loan Completed",
      content: `
        <p>Congratulations!</p>
        <p>Your loan for <strong>${productName}</strong> has been completed successfully.</p>
      `,
    },

    INSTALLMENT_RESCHEDULED: {
      subject: "Installment Rescheduled",
      title: "Installment Rescheduled",
      content: `
        <p>Your installment schedule has been updated.</p>
        ${
          installment?.dueDate
            ? `<p><strong>New Due Date:</strong> ${new Date(
                installment.dueDate
              ).toLocaleDateString()}</p>`
            : ""
        }
      `,
    },

    INSTALLMENT_AMOUNT_UPDATED: {
      subject: "Installment Amount Updated",
      title: "Installment Amount Updated",
      content: `
        <p>Your installment amount has been updated.</p>
        ${
          installment?.amount
            ? `<p><strong>Updated Amount:</strong> ${money(
                installment.amount
              )}</p>`
            : ""
        }
      `,
    },

    LATE_FEE_ADDED: {
      subject: "Late Fee Added",
      title: "Late Fee Added",
      content: `
        <p>A late fee has been added to your installment.</p>
        ${
          installment?.lateFee
            ? `<p><strong>Current Late Fee:</strong> ${money(
                installment.lateFee
              )}</p>`
            : ""
        }
      `,
    },

    LATE_FEE_REMOVED: {
      subject: "Late Fee Removed",
      title: "Late Fee Removed",
      content: `
        <p>A late fee has been removed from your installment.</p>
      `,
    },

    INSTALLMENT_WAIVED: {
      subject: "Installment Waived",
      title: "Installment Waived",
      content: `
        <p>An installment has been waived by our team.</p>
      `,
    },

    INSTALLMENT_RESET: {
      subject: "Installment Reset",
      title: "Installment Reset",
      content: `
        <p>An installment has been reset by our team.</p>
      `,
    },
  };

  const item = data[type];

  if (!item) {
    console.warn(`[LOAN_EMAIL] Unknown email type: ${type}`);
    return;
  }

  return sendMail({
    to: userEmail,
    subject: item.subject,
    html: baseTemplate({
      title: item.title,
      name: userName,
      content: item.content,
    }),
    text: `${item.title}\n\nView details: ${appUrl}`,
  });
}