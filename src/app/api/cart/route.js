import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { parseOptions } from "@/lib/product-options";

const MAX_QUANTITY_PER_LINE = 99;

const cartInclude = {
  items: {
    include: { product: true },
    orderBy: { id: "asc" },
  },
};

async function getOrCreateCart(userId) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId }, include: cartInclude });
}

// Sum of this product's quantity across all size/colour lines in the cart.
function quantityInCart(cart, productId, excludeItemId) {
  return cart.items
    .filter((i) => i.productId === productId && i.id !== excludeItemId)
    .reduce((sum, i) => sum + i.quantity, 0);
}

const isValidQuantity = (q) =>
  Number.isInteger(q) && q >= 1 && q <= MAX_QUANTITY_PER_LINE;

export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const cart = await getOrCreateCart(current.id);
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity, selectedSize, selectedColor } = await request.json();
    if (!productId || !isValidQuantity(quantity)) {
      return NextResponse.json(
        { error: "Product ID and a valid quantity are required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: "This product is no longer available." },
        { status: 404 }
      );
    }

    // The chosen size/colour must be one the product actually offers.
    const sizes = parseOptions(product.availableSizes);
    const colors = parseOptions(product.availableColors);
    const size = sizes.length ? selectedSize || null : null;
    const color = colors.length ? selectedColor || null : null;
    if (sizes.length && !sizes.includes(size)) {
      return NextResponse.json({ error: "Please select a valid size." }, { status: 400 });
    }
    if (colors.length && !colors.includes(color)) {
      return NextResponse.json({ error: "Please select a valid colour." }, { status: 400 });
    }

    const cart = await getOrCreateCart(userId);
    const existing = cart.items.find(
      (i) =>
        i.productId === productId &&
        (i.selectedSize || null) === size &&
        (i.selectedColor || null) === color
    );

    const newLineQuantity = (existing?.quantity || 0) + quantity;
    const totalForProduct =
      quantityInCart(cart, productId, existing?.id) + newLineQuantity;

    if (product.stockAmount <= 0) {
      return NextResponse.json({ error: "This product is out of stock." }, { status: 409 });
    }
    if (totalForProduct > product.stockAmount) {
      return NextResponse.json(
        { error: `Only ${product.stockAmount} available in stock.` },
        { status: 409 }
      );
    }
    if (newLineQuantity > MAX_QUANTITY_PER_LINE) {
      return NextResponse.json(
        { error: `You can order up to ${MAX_QUANTITY_PER_LINE} of one item.` },
        { status: 400 }
      );
    }

    const item = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newLineQuantity },
        })
      : await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            selectedSize: size,
            selectedColor: color,
          },
        });

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("Error adding/updating cart item:", error);
    return NextResponse.json({ error: "Failed to add to cart." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, quantity } = await request.json();
    if (!itemId || !isValidQuantity(quantity)) {
      return NextResponse.json(
        { error: "Item ID and a valid quantity are required." },
        { status: 400 }
      );
    }

    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json(
        { error: "Cart item not found or unauthorized." },
        { status: 403 }
      );
    }

    const totalForProduct = quantityInCart(cart, item.productId, item.id) + quantity;
    if (totalForProduct > item.product.stockAmount) {
      return NextResponse.json(
        { error: `Only ${item.product.stockAmount} available in stock.` },
        { status: 409 }
      );
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return NextResponse.json(
      { error: "Failed to update cart item quantity." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await request.json().catch(() => ({}));

    if (!itemId) {
      // No item id: clear the whole cart.
      const userCart = await prisma.cart.findUnique({ where: { userId } });
      if (userCart) {
        await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }
      return NextResponse.json({ message: "Cart cleared." }, { status: 200 });
    }

    const { count } = await prisma.cartItem.deleteMany({
      where: { id: itemId, cart: { userId } },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "Cart item not found or unauthorized." },
        { status: 403 }
      );
    }
    return NextResponse.json({ message: "Item removed from cart." }, { status: 200 });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json({ error: "Failed to update cart." }, { status: 500 });
  }
}
