// app/api/reviews/route.js

import { prisma } from "@/lib/prisma";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/authCheck";
import { getCurrentUser } from "@/lib/user";

export async function POST(request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const reviewText = formData.get("reviewText");
    const title = formData.get("title");
    const rating = parseInt(formData.get("rating"));
    const productId = formData.get("productId");
    // Always review as the signed-in user, never a client-supplied id.
    const userId = current.id;
    const files = formData.getAll("images");

    // Validate input
    if (!reviewText && files.length === 0) {
      return NextResponse.json(
        { error: "Review text or images required" },
        { status: 400 }
      );
    }
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Only customers with a delivered, paid order for this product may review it.
    const [purchase, existingReview] = await Promise.all([
      prisma.order.findFirst({
        where: {
          userId,
          status: "DELIVERED",
          isPaid: true,
          items: { some: { productId } },
        },
        select: { id: true },
      }),
      prisma.review.findFirst({
        where: { productId, userId },
        select: { id: true },
      }),
    ]);

    if (!purchase) {
      return NextResponse.json(
        { error: "You can only review products you have purchased." },
        { status: 403 }
      );
    }
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 }
      );
    }

    // Validate number of files
    const maxFiles = 5;
    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} images allowed.` },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File type not allowed: ${file.name}. Only JPG, PNG, and JPEG files are supported.`,
          },
          { status: 400 }
        );
      }
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            error: `File size too large: ${file.name}. Each file must be under 10MB.`,
          },
          { status: 400 }
        );
      }
    }

    // Initialize ImageKit
    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    // Upload files to ImageKit
    const uploadedImages = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResponse = await imagekit.upload({
        file: buffer,
        fileName: file.name,
        folder: "/reviews",
      });

      uploadedImages.push({
        url: uploadResponse.url,
      });
    }

    // Save review and images to database
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        title: title || null,
        content: reviewText,
        images: {
          create: uploadedImages.map((image) => ({ url: image.url })),
        },
      },
    });

    return NextResponse.json(
      { message: "Review submitted successfully", review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);

  if (authCheck) return authCheck;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 10));
  const filter = searchParams.get("filter");
  const email = searchParams.get("email");

  const skip = (page - 1) * limit;

  const where = {};
  if (filter === "approved") {
    where.isApproved = true;
  } else if (filter === "pending") {
    where.isApproved = false;
  }

  if (email) {
    where.user = {
      email: {
        contains: email,
      },
    };
  }

  try {
    const [reviews, totalCount] = await prisma.$transaction([
      prisma.review.findMany({
        skip: skip,
        take: limit,
        where: where,
        include: {
          product: { select: { name: true } },
          user: { select: { name: true, email: true } },
          images: { select: { url: true } },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.review.count({ where: where }),
    ]);

    return NextResponse.json({
      reviews,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
