import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authCheck";

// GET /api/admin/messages?filter=unread|all&page=1
export async function GET(request) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") === "unread" ? { isRead: false } : {};
  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
  const limit = 20;

  const [messages, total, unread] = await Promise.all([
    prisma.contactMessage.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where: filter }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({
    messages,
    total,
    unread,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

// PATCH { id, isRead }
export async function PATCH(request) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;
  const { id, isRead } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing message ID" }, { status: 400 });
  const message = await prisma.contactMessage
    .update({ where: { id }, data: { isRead: !!isRead } })
    .catch(() => null);
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  return NextResponse.json({ message });
}

// DELETE { id }
export async function DELETE(request) {
  const authCheck = await requireAuthenticatedUser(request);
  if (authCheck) return authCheck;
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing message ID" }, { status: 400 });
  const { count } = await prisma.contactMessage.deleteMany({ where: { id } });
  if (!count) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
