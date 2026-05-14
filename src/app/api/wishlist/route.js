import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        products: true,
      },
    });

    if (!wishlist) {
      const emptyWishlist = {
        userId,
        products: [],
      };
      return NextResponse.json(emptyWishlist, { status: 200 });
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist." },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to create a new wishlist for a user.
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} The JSON response for the created wishlist.
 */
export async function POST(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newWishlist = await prisma.wishlist.create({
      data: {
        userId: userId,
      },
    });

    return NextResponse.json(newWishlist, { status: 201 });
  } catch (error) {
    console.error("Error creating wishlist:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A wishlist for this user already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create wishlist." },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update a user's wishlist by adding a product.
 * This function uses 'upsert' to either create the wishlist if it doesn't exist,
 * or update it by connecting the new product if it does.
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} The JSON response for the updated wishlist.
 */
export async function PATCH(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const updatedWishlist = await prisma.wishlist.upsert({
      where: { userId },
      create: {
        userId,
        products: { connect: { id: productId } },
      },
      update: {
        products: { connect: { id: productId } },
      },
      include: {
        products: true,
      },
    });

    return NextResponse.json(updatedWishlist);
  } catch (error) {
    console.error("Error updating or creating wishlist:", error);
    return NextResponse.json(
      { error: "Failed to update or create wishlist." },
      { status: 500 }
    );
  }
}

/**
 * Handles DELETE requests to remove a product from a wishlist or delete the entire wishlist.
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} The JSON response for the updated or deleted wishlist.
 */
export async function DELETE(request) {
  try {
    const current = await getCurrentUser();
    const userId = current?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { productId } = body;

    if (productId) {
      const updatedWishlist = await prisma.wishlist.update({
        where: { userId },
        data: {
          products: { disconnect: { id: productId } },
        },
        include: {
          products: true,
        },
      });
      return NextResponse.json(updatedWishlist);
    } else {
      const deletedWishlist = await prisma.wishlist.delete({
        where: { userId },
      });
      return NextResponse.json(deletedWishlist);
    }
  } catch (error) {
    console.error("Error deleting from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to delete from wishlist." },
      { status: 500 }
    );
  }
}
