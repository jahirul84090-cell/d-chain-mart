import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      const newCart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
      return NextResponse.json(newCart, { status: 200 });
    }
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity, selectedSize, selectedColor } =
      await request.json();
    if (!productId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { error: "Product ID and a positive quantity are required." },
        { status: 400 }
      );
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // --- CRITICAL FIX: Find the item based on all properties ---
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
      },
    });

    let updatedCartItem;
    if (existingCartItem) {
      // If the exact variation exists, update its quantity
      updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
      });
    } else {
      // If no matching variation is found, create a new cart item
      updatedCartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          selectedSize,
          selectedColor,
        },
      });
    }

    return NextResponse.json(updatedCartItem, { status: 200 });
  } catch (error) {
    console.error("Error adding/updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to add/update cart item." },
      { status: 500 }
    );
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
    if (!itemId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { error: "Item ID and a positive quantity are required." },
        { status: 400 }
      );
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!existingItem || existingItem.cart.userId !== userId) {
      return NextResponse.json(
        { error: "Cart item not found or unauthorized." },
        { status: 403 }
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

    const { itemId } = await request.json();
    if (!itemId) {
      // Logic for clearing the entire cart
      const userCart = await prisma.cart.findUnique({ where: { userId } });
      if (userCart) {
        await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }
      return NextResponse.json({ message: "Cart cleared." }, { status: 200 });
    } else {
      // Logic for deleting a single item
      const existingItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });
      if (!existingItem || existingItem.cart.userId !== userId) {
        return NextResponse.json(
          { error: "Cart item not found or unauthorized." },
          { status: 403 }
        );
      }

      await prisma.cartItem.delete({ where: { id: itemId } });
      return NextResponse.json(
        { message: "Item removed from cart." },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error removing cart item(s):", error);
    return NextResponse.json(
      { error: "Failed to remove cart item(s)." },
      { status: 500 }
    );
  }
}
