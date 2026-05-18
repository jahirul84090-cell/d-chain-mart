// src/app/api/admin/invoices/[invoiceId]/pdf/route.js

import { getInvoiceWithOrderDetails } from "@/lib/ordershelper/orderhelper";
import { sendInvoiceEmail } from "@/lib/otpinvoice";
import { generatePdfBuffer } from "@/lib/pdfgeneratehelper";

import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { invoiceId } = await params;
    const invoice = await getInvoiceWithOrderDetails(invoiceId);

    if (!invoice || !invoice.order) {
      return NextResponse.json(
        { error: "Invoice or Order not found" },
        { status: 404 }
      );
    }
    const pdfBuffer = await generatePdfBuffer(invoice);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { invoiceId } = await params;
    const invoice = await getInvoiceWithOrderDetails(invoiceId);

    if (!invoice || !invoice.order) {
      return NextResponse.json(
        { error: "Invoice or Order not found" },
        { status: 404 }
      );
    }
    const pdfBuffer = await generatePdfBuffer(invoice);
    const emailResult = await sendInvoiceEmail({
      recipientEmail: invoice.order.user.email,
      recipientName: invoice.order.user.name,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.order.id,
      orderTotal: invoice.order.orderTotal,
      pdfBuffer,
    });

    if (emailResult.success) {
      return NextResponse.json(
        { message: "Invoice email sent successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send invoice email." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { error: "Failed to send invoice email." },
      { status: 500 }
    );
  }
}
