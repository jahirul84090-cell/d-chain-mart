import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NextResponse, after } from "next/server";

import { getCurrentUser } from "@/lib/user";
import { sendOrderEmail } from "@/lib/sendOrderEmail";
import { createCustomerOrderEmail } from "@/lib/template/createCustomerOrderEmail";
import { createAdminOrderEmail } from "@/lib/template/createAdminOrderEmail";
import { requireAuthenticatedUser } from "@/lib/authCheck";
import { resolveDeliveryFee } from "@/lib/delivery-fee";
import { isValidBdPhone } from "@/lib/address";
import {
  ORDER_STATUSES,
  StockConflictError,
  applyStatusStockChange,
} from "@/lib/order-status";

export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;

  const { searchParams } = new URL(request.url);
  const status = ORDER_STATUSES.includes(searchParams.get("status")) ? searchParams.get("status") : undefined;

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
  // Only sort on known columns; anything else would make Prisma throw.
  const SORTABLE = ["createdAt", "orderTotal", "deliveryFee", "status"];
  const sortBy = SORTABLE.includes(searchParams.get("sortBy")) ? searchParams.get("sortBy") : "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 10));

  // Order numbers are shown as DCM-XXXXXXXX (the first 8 characters of
  // the id, uppercased), so accept that form in the search box too.
  const idSearch = search?.replace(/^DCM-/i, "").toLowerCase();

  try {
    // Every filter except status, so the status tabs can show counts.
    const baseFilters = [
        isPaid !== undefined ? { isPaid } : {},
        paymentMethodId ? { paymentMethodId } : {},
        search
          ? {
              OR: [
                { id: { startsWith: idSearch } },
                { user: { email: { contains: search } } },
                { user: { name: { contains: search } } },
                { shippingAddress: { phoneNumber: { contains: search } } },
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
    ];
    const where = { AND: [status ? { status } : {}, ...baseFilters] };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true, name: true } },
          shippingAddress: {
            select: { street: true, city: true, state: true, zipCode: true, phoneNumber: true },
          },
          paymentMethod: { select: { name: true, isCashOnDelivery: true } },
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

    const grouped = await prisma.order.groupBy({
      by: ["status"],
      where: { AND: baseFilters },
      _count: { _all: true },
    });
    const statusCounts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

    return NextResponse.json(
      {
        orders,
        total,
        statusCounts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

async function handlePATCH(request) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;

  try {
    const { id, status, isPaid } = await request.json();
    if (!id || (!status && isPaid === undefined)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (status && !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await prisma.$transaction(async (tx) => {
      await applyStatusStockChange(tx, existing, status);
      return tx.order.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(isPaid !== undefined ? { isPaid: !!isPaid } : {}),
        },
        include: {
          user: { select: { email: true } },
          shippingAddress: true,
          paymentMethod: { select: { name: true } },
          items: {
            select: { id: true, quantity: true, pricePaid: true, productSnapshot: true },
          },
        },
      });
    });

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    if (error instanceof StockConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

async function handleDELETE(request) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Keep the sales record for live orders: they must be cancelled (which
    // returns their stock) before they can be deleted.
    if (existing.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Only cancelled orders can be deleted. Cancel the order first." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.deleteMany({ where: { orderId: id } });
      await tx.loanApplication.updateMany({ where: { orderId: id }, data: { orderId: null } });
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Order deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

class InsufficientStockError extends Error {}

async function handlePOST(request) {
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
    if (!isValidBdPhone(address.phoneNumber)) {
      return NextResponse.json(
        { error: "Please add a valid mobile number to your delivery address so the courier can reach you." },
        { status: 400 }
      );
    }

    const [cart, paymentMethod, deliveryFees] = await Promise.all([
      prisma.cart.findUnique({
        where: { id: cartId, userId: user.id },
        include: { items: { include: { product: true } } },
      }),
      prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } }),
      prisma.deliveryFee.findMany(),
    ]);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty cart" },
        { status: 400 }
      );
    }
    if (!paymentMethod || !paymentMethod.isActive) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Every non-COD method (bKash, Nagad, bank...) needs the customer's
    // transaction ID so the payment can be verified.
    let transactionNumber = String(incomingTransactionNumber ?? "").trim();
    if (!paymentMethod.isCashOnDelivery) {
      if (!transactionNumber) {
        return NextResponse.json(
          { error: "Transaction number is required" },
          { status: 400 }
        );
      }
      if (transactionNumber.length > 100) {
        return NextResponse.json(
          { error: "Transaction number is too long" },
          { status: 400 }
        );
      }
    } else {
      transactionNumber = `COD_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
    }

    const unavailable = cart.items.find((item) => !item.product?.isActive);
    if (unavailable) {
      return NextResponse.json(
        {
          error: `${unavailable.product?.name || "A product"} is no longer available. Please remove it from your cart.`,
        },
        { status: 409 }
      );
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = resolveDeliveryFee(deliveryFees, address);
    const orderTotal = subtotal + deliveryFee;

    // Stock is tracked per product, so add up every size/colour line of the
    // same product before checking and decrementing it.
    const quantityByProduct = new Map();
    for (const item of cart.items) {
      quantityByProduct.set(
        item.productId,
        (quantityByProduct.get(item.productId) || 0) + item.quantity
      );
    }
    const stockNeeds = Array.from(quantityByProduct, ([productId, quantity]) => ({
      productId,
      quantity,
      name: cart.items.find((i) => i.productId === productId)?.product?.name,
    }));

    for (const need of stockNeeds) {
      const product = cart.items.find((i) => i.productId === need.productId)?.product;
      if (!product || product.stockAmount < need.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${need.name || "an item"}` },
          { status: 409 }
        );
      }
    }

    const order = await prisma.$transaction(
      async (tx) => {
        // Decrement stock only when enough is left, so concurrent orders
        // can never oversell. Any shortfall rolls the whole order back.
        const stockResults = await Promise.all(
          stockNeeds.map((item) =>
            tx.product.updateMany({
              where: {
                id: item.productId,
                stockAmount: { gte: item.quantity },
              },
              data: {
                stockAmount: { decrement: item.quantity },
                totalSales: { increment: item.quantity },
              },
            })
          )
        );
        const soldOutIndex = stockResults.findIndex((r) => r.count === 0);
        if (soldOutIndex !== -1) {
          const name = stockNeeds[soldOutIndex].name || "an item";
          throw new InsufficientStockError(`Insufficient stock for ${name}`);
        }

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

        // One order line per cart line, keeping each size/colour.
        await tx.orderItem.createMany({
          data: cart.items.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            pricePaid: item.product.price,
            productSnapshot: {
              name: item.product.name,
              price: item.product.price,
              selectedSize: item.selectedSize || null,
              selectedColor: item.selectedColor || null,
              image: item.product.mainImage || null,
              slug: item.product.slug || null,
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

    // Send emails after the response so checkout is not slowed down by SMTP.
    after(async () => {
      try {
        await Promise.all([
          sendOrderEmail({
            email: user.email,
            subject: "Your Order Confirmation",
            html: createCustomerOrderEmail(updatedOrder, user),
          }),
          sendOrderEmail({
            email: process.env.ADMIN_EMAIL,
            subject: `New Order #${updatedOrder.id} Placed`,
            html: createAdminOrderEmail(updatedOrder, user),
          }),
        ]);
      } catch (emailError) {
        console.error("Failed to send order emails:", emailError);
      }
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "This transaction number has already been used." },
        { status: 409 }
      );
    }
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// Refresh cached storefront data after a successful change.
export async function POST(...args) {
  const response = await handlePOST(...args);
  if (response?.ok) {
    revalidateTag("products");
  }
  return response;
}

export async function PATCH(...args) {
  const response = await handlePATCH(...args);
  if (response?.ok) {
    revalidateTag("products");
  }
  return response;
}

export async function DELETE(...args) {
  const response = await handleDELETE(...args);
  if (response?.ok) {
    revalidateTag("products");
  }
  return response;
}
