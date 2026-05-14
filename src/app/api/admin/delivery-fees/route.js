import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || null;

    const where = country ? { country: { contains: country } } : {};
    const deliveryFees = await prisma.deliveryFee.findMany({
      where,
      select: {
        id: true,
        city: true,
        country: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deliveryFees }, { status: 200 });
  } catch (error) {
    console.error("Error fetching delivery fees:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery fees: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const { city, country, amount } = await request.json();
    if (!country || amount === undefined || amount < 0) {
      return NextResponse.json(
        { error: "Missing country or invalid amount" },
        { status: 400 }
      );
    }

    const deliveryFee = await prisma.deliveryFee.create({
      data: {
        city: city || null,
        country,
        amount: parseFloat(amount),
      },
      select: {
        id: true,
        city: true,
        country: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ deliveryFee }, { status: 201 });
  } catch (error) {
    console.error("Error creating delivery fee:", error);
    return NextResponse.json(
      { error: "Failed to create delivery fee: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const { id, city, country, amount } = await request.json();
    if (!id || !country || amount === undefined || amount < 0) {
      return NextResponse.json(
        { error: "Missing id, country, or invalid amount" },
        { status: 400 }
      );
    }

    const deliveryFee = await prisma.deliveryFee.update({
      where: { id },
      data: {
        city: city || null,
        country,
        amount: parseFloat(amount),
      },
      select: {
        id: true,
        city: true,
        country: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ deliveryFee }, { status: 200 });
  } catch (error) {
    console.error("Error updating delivery fee:", error);
    return NextResponse.json(
      { error: "Failed to update delivery fee: " + error.message },
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
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.deliveryFee.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Delivery fee deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting delivery fee:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery fee: " + error.message },
      { status: 500 }
    );
  }
}
