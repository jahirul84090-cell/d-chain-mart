import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { escapeHtml, sendMail } from "@/lib/mailer";

const LIMITS = { name: 100, email: 150, phone: 30, subject: 150, message: 3000 };
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 15 * 60 * 1000;

const clean = (v, max) => String(v ?? "").trim().slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// POST /api/contact — saves a message for the admin panel and emails the store.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Hidden "website" field: real visitors leave it empty, bots fill it in.
    if (body.website) return NextResponse.json({ success: true });

    const data = {
      name: clean(body.name, LIMITS.name),
      email: clean(body.email, LIMITS.email).toLowerCase(),
      phone: clean(body.phone, LIMITS.phone) || null,
      subject: clean(body.subject, LIMITS.subject),
      message: clean(body.message, LIMITS.message),
    };

    if (!data.name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!isEmail(data.email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (!data.subject) return NextResponse.json({ error: "Please enter a subject." }, { status: 400 });
    if (data.message.length < 10) {
      return NextResponse.json({ error: "Your message should be at least 10 characters." }, { status: 400 });
    }

    const recent = await prisma.contactMessage.count({
      where: { email: data.email, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
    });
    if (recent >= MAX_PER_WINDOW) {
      return NextResponse.json(
        { error: "You've sent several messages recently. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const saved = await prisma.contactMessage.create({ data });

    // Notify the store without making the visitor wait for SMTP.
    after(async () => {
      if (!process.env.ADMIN_EMAIL) return;
      try {
        await sendMail({
          to: process.env.ADMIN_EMAIL,
          replyTo: data.email,
          subject: `New contact message: ${data.subject}`,
          text: `${data.name} <${data.email}> ${data.phone || ""}\n\n${data.message}`,
          html: `<p><strong>${escapeHtml(data.name)}</strong> &lt;${escapeHtml(data.email)}&gt; ${escapeHtml(data.phone || "")}</p>
                 <p><strong>${escapeHtml(data.subject)}</strong></p>
                 <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>`,
        });
      } catch (error) {
        console.error("Contact message email failed", error.message);
      }
    });

    return NextResponse.json({ success: true, id: saved.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contact failed", error);
    return NextResponse.json(
      { error: "We couldn't send your message. Please try again or call us." },
      { status: 500 }
    );
  }
}
