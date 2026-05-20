/**
 * File: app/api/loans/upload/route.js
 *
 * POST /api/loans/upload
 *
 * Secure server-side image upload to ImageKit for loan documents.
 * Validates auth, file type, and file size BEFORE uploading.
 *
 * Accepted documentType values:
 *   nid_front | nid_back | selfie | nominee_photo
 *
 * File rules:
 *   - Must be image/jpeg or image/png
 *   - Max size: 1 MB (1,048,576 bytes)
 *
 * Returns: { url, fileId, name, documentType, size, mimeType }
 *
 * Required env vars:
 *   IMAGEKIT_PUBLIC_KEY
 *   IMAGEKIT_PRIVATE_KEY
 *   IMAGEKIT_URL_ENDPOINT
 */

import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB

const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const ALLOWED_TYPES = [
  "nid_front",
  "nid_back",
  "selfie",
  "nominee_photo",
];

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ─── POST /api/loans/upload ───────────────────────────────────────────────────

export async function POST(req) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file");
    const documentType = formData.get("documentType");

    // ── Validate documentType ──
    if (!documentType || !ALLOWED_TYPES.includes(documentType)) {
      return NextResponse.json(
        {
          error: `Invalid documentType. Allowed: ${ALLOWED_TYPES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // ── Validate file presence ──
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    // ── Validate MIME type ──
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPG and PNG images are accepted.",
        },
        { status: 400 }
      );
    }

    // ── Read buffer & validate size ──
    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `File size ${(buffer.byteLength / 1024 / 1024).toFixed(
            2
          )} MB exceeds the 1 MB limit. Please compress your image.`,
        },
        { status: 400 }
      );
    }

    // ── Validate image has actual pixel data ──
    if (buffer.byteLength < 1024) {
      return NextResponse.json(
        {
          error:
            "File appears to be empty or corrupt. Please upload a valid image.",
        },
        { status: 400 }
      );
    }

    // ── Build filename ──
    const ext = file.type === "image/png" ? "png" : "jpg";

    const fileName = `loan_${documentType}_${current.id}_${Date.now()}.${ext}`;

    // ── Upload to ImageKit ──
    const uploaded = await imagekit.upload({
      file: buffer,
      fileName,
      folder: `/loans/${current.id}`,
      useUniqueFileName: false,
      tags: ["loan", documentType, String(current.id)],
      isPrivateFile: false,
    });

    return NextResponse.json({
      url: uploaded.url,
      fileId: uploaded.fileId,
      name: uploaded.name,
      documentType,
      size: buffer.byteLength,
      mimeType: file.type,
    });
  } catch (err) {
    console.error("[POST /api/loans/upload]", err);

    return NextResponse.json(
      {
        error: err?.message || "Internal server error.",
      },
      { status: 500 }
    );
  }
}