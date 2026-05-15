// src/app/api/loans/apply/route.js

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const current = await getCurrentUser();

    if (!current?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await req.json();

    const {
      productId,
      downPayment,
      tenureMonths,
      interestRate,
      monthlyIncome,
      jobType,
      nidNumber,
      customerNote,
    } = body;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID required",
        },
        { status: 400 },
      );
    }

    if (!downPayment || downPayment < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid down payment",
        },
        { status: 400 },
      );
    }

    if (!tenureMonths || tenureMonths <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tenure",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    const productPrice = Number(product.price);

    if (downPayment >= productPrice) {
      return NextResponse.json(
        {
          success: false,
          message: "Down payment cannot exceed product price",
        },
        { status: 400 },
      );
    }

    const loanAmount = productPrice - Number(downPayment);

    const totalPayable =
      loanAmount + (loanAmount * Number(interestRate || 0)) / 100;

    const monthlyEmi = totalPayable / Number(tenureMonths);

    const loan = await prisma.loanApplication.create({
      data: {
        userId: current.id,
        productId,

        productPrice,
        downPayment: Number(downPayment),

        loanAmount,

        interestRate: Number(interestRate || 0),

        tenureMonths: Number(tenureMonths),

        monthlyEmi,

        totalPayable,

        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : null,

        jobType,

        nidNumber,

        customerNote,

        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Loan application submitted",
      loan,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
