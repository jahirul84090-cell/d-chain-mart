import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const authCheck = await requireAuthenticatedUser(req);

    if (authCheck) return authCheck;
    const body = await req.json();
    const {
      customerEmail,
      customerName,
      shippingAddress,
      lineItems,
      deliveryFee,
      paymentMethod,
    } = body;

    let user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email: customerEmail,
            name: customerName,
          },
        });
      } catch (error) {
        if (error.code === "P2002") {
          user = await prisma.user.findUnique({
            where: { email: customerEmail },
          });
        } else {
          throw error;
        }
      }
    }

    const newOrder = await prisma.$transaction(
      async (tx) => {
        const lineItemsTotal = lineItems.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );
        const orderTotal = lineItemsTotal + parseFloat(deliveryFee || 0);
        const newTransactionNumber = `T-${uuidv4()
          .split("-")[0]
          .toUpperCase()}`;

        const createdOrder = await tx.order.create({
          data: {
            user: { connect: { id: user.id } },
            status: "DELIVERED",
            isPaid: true,
            paymentMethod: { connect: { name: paymentMethod } },
            transactionNumber: newTransactionNumber,
            orderTotal: orderTotal,
            deliveryFee: parseFloat(deliveryFee || 0),
            isInvoiceGenerated: true,
            shippingAddress: {
              create: {
                user: { connect: { id: user.id } },
                ...shippingAddress,
              },
            },
            items: {
              createMany: {
                data: lineItems.map((item) => ({
                  productId: item.productId,
                  productSnapshot: {
                    name: item.productName,
                    price: item.price,
                  },
                  quantity: item.quantity,
                  pricePaid: item.price,
                })),
              },
            },
            invoice: {
              create: {
                invoiceNumber: `INV-${newTransactionNumber}`,
                invoiceUrl: `/invoices/${newTransactionNumber}.pdf`,
              },
            },
          },
          include: {
            items: true,
            invoice: true,
            shippingAddress: true,
          },
        });

        return createdOrder;
      },
      { timeout: 10000 }
    );

    const sendEmailResponse = await fetch(
      `${req.nextUrl.origin}/api/admin/invoices/${newOrder.invoice.id}/pdf`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!sendEmailResponse.ok) {
      const errorData = await sendEmailResponse.json();
      return NextResponse.json(
        {
          error: `Invoice created, but email sending failed: ${errorData.error}`,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message: "Invoice created successfully!",
        newOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating manual invoice:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: `Foreign key constraint failed. Ensure all product IDs and payment method names exist: ${
            error.meta?.field_name || ""
          }.`,
        },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          error: `Invalid data provided. Please ensure the payment method exists.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
