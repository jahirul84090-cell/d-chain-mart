import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/user";
import { sendOrderEmail } from "@/lib/sendOrderEmail";
import { createCustomerOrderEmail } from "@/lib/template/createCustomerOrderEmail";
import { createAdminOrderEmail } from "@/lib/template/createAdminOrderEmail";
import { requireAuthenticatedUser } from "@/lib/authCheck";

export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const isPaid =
    searchParams.get("isPaid") === "true"
      ? true
      : searchParams.get("isPaid") === "false"
      ? false
      : undefined;
  const search = searchParams.get("search") || undefined;
  const fromDate = searchParams.get("fromDate") || undefined;
  const toDate = searchParams.get("toDate") || undefined;
  const paymentMethodId = searchParams.get("paymentMethodId") || undefined;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;

  try {
    const where = {
      AND: [
        status ? { status } : {},
        isPaid !== undefined ? { isPaid } : {},
        paymentMethodId ? { paymentMethodId } : {},
        search
          ? {
              OR: [
                { id: { contains: search } },
                { user: { email: { contains: search } } },
                { transactionNumber: { contains: search } },
              ],
            }
          : {},
        fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate && { gte: new Date(fromDate) }),
                ...(toDate && {
                  lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
                }),
              },
            }
          : {},
      ].filter(Boolean),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true } },
          shippingAddress: {
            select: { street: true, city: true, state: true, zipCode: true },
          },
          paymentMethod: { select: { name: true } },
          invoice: { select: { id: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              pricePaid: true,
              productSnapshot: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json(
      {
        orders,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const data = await request.json();

    const { id, status, isPaid } = data;

    if (!id || !status || isPaid === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      !["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(
        status
      )
    ) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        isPaid,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { email: true } },
        shippingAddress: {
          select: { street: true, city: true, state: true, zip: true },
        },
        paymentMethod: { select: { name: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            pricePaid: true,
            productSnapshot: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Order deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      cartId,
      shippingAddressId,
      paymentMethodId,
      transactionNumber: incomingTransactionNumber,
    } = await request.json();

    if (!cartId || !shippingAddressId || !paymentMethodId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const address = await prisma.address.findUnique({
      where: { id: shippingAddressId, userId: user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const [cart, paymentMethod, deliveryFeeRecord] = await Promise.all([
      prisma.cart.findUnique({
        where: { id: cartId, userId: user.id },
        include: { items: { include: { product: true } } },
      }),
      prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } }), //
      prisma.deliveryFee.findFirst({
        where: {
          country: address.country,
          OR: [{ city: address.city }, { city: null }],
        },
      }),
    ]);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty cart" },
        { status: 400 }
      );
    }
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    let transactionNumber = incomingTransactionNumber;
    if (paymentMethod.requiresTransactionNumber && !transactionNumber) {
      return NextResponse.json(
        { error: "Transaction number is required" },
        { status: 400 }
      );
    }
    if (!paymentMethod.requiresTransactionNumber) {
      transactionNumber = `COD_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = deliveryFeeRecord?.amount || 150;
    const orderTotal = subtotal + deliveryFee;

    const groupedItems = new Map();
    for (const item of cart.items) {
      const key = item.productId;
      groupedItems.set(key, {
        ...item,
        quantity: (groupedItems.get(key)?.quantity || 0) + item.quantity,
      });
    }
    const uniqueCartItems = Array.from(groupedItems.values());

    const productsInCart = await prisma.product.findMany({
      where: { id: { in: uniqueCartItems.map((item) => item.productId) } },
      select: { id: true, stockAmount: true, name: true },
    });

    for (const item of uniqueCartItems) {
      const product = productsInCart.find((p) => p.id === item.productId);
      if (!product || product.stockAmount < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product?.name || "Unknown"}` },
          { status: 409 }
        );
      }
    }

    const order = await prisma.$transaction(
      async (tx) => {
        // Execute all product stock updates in parallel to prevent transaction timeouts.
        const updatePromises = uniqueCartItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stockAmount: { decrement: item.quantity },
              totalSales: { increment: item.quantity },
            },
          })
        );
        await Promise.all(updatePromises);

        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId: user.id,
            shippingAddressId,
            paymentMethodId: paymentMethod.id,
            transactionNumber,
            orderTotal,
            deliveryFee,
            status: "PENDING",
            isPaid: false,
          },
        });

        // Create order items
        await tx.orderItem.createMany({
          data: uniqueCartItems.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            pricePaid: item.product.price,
            productSnapshot: {
              name: item.product.name,
              price: item.product.price,
              selectedSize: item.selectedSize || null,
              selectedColor: item.selectedColor || null,
            },
          })),
        });

        // Clear cart
        await tx.cartItem.deleteMany({ where: { cartId } });

        return newOrder;
      },
      {
        timeout: 10000,
      }
    );

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        paymentMethod: true,
        items: {
          select: {
            id: true,
            quantity: true,
            pricePaid: true,
            productSnapshot: true,
          },
        },
      },
    });

    try {
      await sendOrderEmail({
        email: user.email,
        subject: "Your Order Confirmation",
        html: createCustomerOrderEmail(updatedOrder, user),
      });

      await sendOrderEmail({
        email: process.env.ADMIN_EMAIL,
        subject: `New Order #${updatedOrder.id} Placed`,
        html: createAdminOrderEmail(updatedOrder, user),
      });
    } catch (emailError) {
      console.error("Failed to send order emails:", emailError);
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create order: ${error.message}` },
      { status: 500 }
    );
  }
}
