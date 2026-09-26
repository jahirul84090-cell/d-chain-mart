// app/api/profile/addresses/route.js
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { NextResponse } from "next/server";
import { validateAddress } from "@/lib/address";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || undefined;
    const search = searchParams.get("search") || undefined;

    if (id) {
      const address = await prisma.address.findFirst({
        where: { id, userId: user.id },
        include: { user: { select: { email: true } } },
      });
      if (!address) {
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ address }, { status: 200 });
    }

    const where = {
      userId: user.id,
      ...(search ? { city: { contains: search } } : {}),
    };

    const addresses = await prisma.address.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
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

    const body = await request.json();
    const { data, error } = validateAddress(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const address = await prisma.$transaction(async (tx) => {
      // The first address, or one marked default, becomes the default.
      const hasDefault = await tx.address.count({ where: { userId: user.id, isDefault: true } });
      const makeDefault = !!body.isDefault || hasDefault === 0;
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: { ...data, userId: user.id, isDefault: makeDefault },
      });
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing address ID" }, { status: 400 });
    const { data, error } = validateAddress(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const existing = await prisma.address.findFirst({ where: { id: body.id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    const address = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id: body.id },
        data: { ...data, isDefault: body.isDefault ? true : existing.isDefault },
      });
    });

    return NextResponse.json({ address }, { status: 200 });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing address ID" },
        { status: 400 }
      );
    }

    const orderCount = await prisma.order.count({
      where: { shippingAddressId: id },
    });
    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete address linked to orders" },
        { status: 400 }
      );
    }

    await prisma.address.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ message: "Address deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
