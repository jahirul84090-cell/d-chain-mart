// app/api/admin/payment-methods/route.js

import { requireAuthenticatedUser } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true }, // Only return active payment methods
      select: {
        id: true,
        name: true,
        accountNumber: true,
        instructions: true,
        isCashOnDelivery: true, // Include isCashOnDelivery
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ paymentMethods }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const { name, accountNumber, instructions, isActive, isCashOnDelivery } =
      await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    if (
      isCashOnDelivery !== undefined &&
      typeof isCashOnDelivery !== "boolean"
    ) {
      return NextResponse.json(
        { error: "isCashOnDelivery must be a boolean" },
        { status: 400 }
      );
    }

    const newPaymentMethod = await prisma.paymentMethod.create({
      data: {
        name,
        accountNumber,
        instructions,
        isActive: isActive !== undefined ? isActive : true,
        isCashOnDelivery: isCashOnDelivery || false, // Default to false
      },
    });

    return NextResponse.json(newPaymentMethod, { status: 201 });
  } catch (error) {
    console.error("Error creating payment method:", error);
    return NextResponse.json(
      { error: "Failed to create payment method: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const {
      id,
      name,
      accountNumber,
      instructions,
      isActive,
      isCashOnDelivery,
    } = await request.json();

    // Validation
    if (!id || !name) {
      return NextResponse.json(
        { error: "ID, name, and account number are required to update" },
        { status: 400 }
      );
    }
    if (
      isCashOnDelivery !== undefined &&
      typeof isCashOnDelivery !== "boolean"
    ) {
      return NextResponse.json(
        { error: "isCashOnDelivery must be a boolean" },
        { status: 400 }
      );
    }

    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        name,
        accountNumber,
        instructions,
        isActive: isActive !== undefined ? isActive : true,
        isCashOnDelivery:
          isCashOnDelivery !== undefined ? isCashOnDelivery : false,
      },
    });

    return NextResponse.json(updatedPaymentMethod, { status: 200 });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method: " + error.message },
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
      return NextResponse.json(
        { error: "ID is required to delete" },
        { status: 400 }
      );
    }

    await prisma.paymentMethod.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Payment method deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method: " + error.message },
      { status: 500 }
    );
  }
}
