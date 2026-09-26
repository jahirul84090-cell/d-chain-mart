import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser, requireSignedInUser } from "@/lib/authCheck";
import { orderNumber } from "@/lib/format";
import {
  ORDER_STATUSES,
  StockConflictError,
  applyStatusStockChange,
} from "@/lib/order-status";

export async function GET(request, { params }) {
  try {
    const auth = await requireSignedInUser();
    if (auth.response) return auth.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        shippingAddress: true,
        paymentMethod: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            instructions: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                mainImage: true,
                slug: true,
              },
            },
          },
        },
        invoice: { select: { id: true } },
      },
    });
    // Customers may only view their own orders.
    if (!order || (!auth.isAdmin && order.userId !== auth.user.id)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;

  try {
    const { id: orderId } = await params;
    const { status, isPaid, generateInvoice } = await request.json();

    if (!orderId || (!status && isPaid === undefined && !generateInvoice)) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    if (status && !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true, items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const createInvoice = generateInvoice && !order.invoice;
    if (createInvoice && (status || order.status) === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot create an invoice for a cancelled order." },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        // Stock was taken at checkout; only cancelling/reopening changes it.
        let nextStatus = status;
        if (createInvoice && !status && order.status === "PENDING") {
          nextStatus = "PROCESSING";
        }
        await applyStatusStockChange(tx, order, nextStatus);

        if (createInvoice) {
          const invoice = await tx.invoice.create({
            data: {
              orderId: order.id,
              invoiceNumber: `INV-${orderNumber(order.id).replace("DCM-", "")}-${Date.now().toString().slice(-6)}`,
              invoiceUrl: "",
            },
          });
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { invoiceUrl: `/api/admin/invoices/${invoice.id}/pdf` },
          });
        }

        return tx.order.update({
          where: { id: orderId },
          data: {
            ...(nextStatus ? { status: nextStatus } : {}),
            ...(isPaid !== undefined ? { isPaid: !!isPaid } : {}),
            ...(createInvoice ? { isInvoiceGenerated: true } : {}),
          },
          include: {
            user: { select: { id: true, email: true, name: true } },
            shippingAddress: true,
            paymentMethod: true,
            items: {
              include: { product: { select: { id: true, name: true, mainImage: true } } },
            },
            invoice: true,
          },
        });
      },
      { timeout: 10000 }
    );

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    if (error instanceof StockConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
