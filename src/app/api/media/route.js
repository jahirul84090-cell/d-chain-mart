// app/api/upload/route.js
import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authCheck";

export async function POST(request) {
  try {
    const authCheck = await requireAuthenticatedUser(request);

    if (authCheck) return authCheck;
    const formData = await request.formData();
    const files = formData.getAll("files");
    const titles = formData.getAll("titles");
    const altTexts = formData.getAll("altTexts");
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    // Validate number of files
    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} images allowed.` },
        { status: 400 }
      );
    }

    // Validate file types and sizes
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

    const uploadedMedia = [];

    // Upload files to ImageKit
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResponse = await imagekit.upload({
        file: buffer,
        fileName: file.name,
        folder: "/Uploads",
      });

      uploadedMedia.push({
        url: uploadResponse.url,
        title: titles[i] || null,
        altText: altTexts[i] || null,
      });
    }

    // // Save to database using Media model
    // await prisma.media.createMany({
    //   data: uploadedMedia.map((media) => ({
    //     url: media.url,
    //     title: media.title,
    //     altText: media.altText,
    //   })),
    // });

    // // Fetch all media
    // const allMedia = await prisma.media.findMany();

    console.log(uploadedMedia);

    return NextResponse.json({ message: "done" }, { status: 201 });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Failed to upload images: " + error.message },
      { status: 500 }
    );
  }
}
