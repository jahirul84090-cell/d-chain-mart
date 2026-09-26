import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";
import { isValidBdPhone, normalizeBdPhone } from "@/lib/address";

const PROFILE_SELECT = { id: true, email: true, name: true, image: true, phoneNumber: true, password: true };

// Never send the password hash; just whether one exists.
const toProfile = ({ password, ...u }) => ({ ...u, hasPassword: !!password });

// Profile photos: images only, max 2 MB.
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

let imagekit;
const getImageKit = () =>
  (imagekit ??= new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  }));

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userData = await prisma.user.findUnique({ where: { id: user.id }, select: PROFILE_SELECT });
    if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user: toProfile(userData) }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phoneNumber") ?? "").trim();
    const image = formData.get("image");

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: "Please enter your full name (2–80 characters)." }, { status: 400 });
    }
    if (phone && !isValidBdPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid Bangladeshi mobile number (e.g. 01712345678)." },
        { status: 400 }
      );
    }

    const updateData = { name, phoneNumber: phone ? normalizeBdPhone(phone) : null };

    if (image && typeof image !== "string" && image.size > 0) {
      const ext = IMAGE_TYPES[image.type];
      if (!ext) {
        return NextResponse.json({ error: "Profile photo must be a JPG, PNG or WebP image." }, { status: 400 });
      }
      if (image.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Profile photo must be 2 MB or smaller." }, { status: 400 });
      }
      const uploadResponse = await getImageKit().upload({
        file: Buffer.from(await image.arrayBuffer()),
        fileName: `profile-${user.id}.${ext}`,
        folder: "/profiles",
        useUniqueFileName: true,
      });
      updateData.image = uploadResponse.url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: PROFILE_SELECT,
    });

    return NextResponse.json({ user: toProfile(updatedUser) }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
