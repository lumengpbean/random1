import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasSpamSignals, rateLimit } from "@/lib/rate-limit";
import { submitPostSchema } from "@/lib/validators/post";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limiter = rateLimit(`submit:${session.user.email}`, 5, 60_000);
  if (!limiter.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const form = await req.formData();
  const payload = {
    title: String(form.get("title") ?? ""),
    summary: String(form.get("summary") ?? ""),
    content: String(form.get("content") ?? ""),
    locale: String(form.get("locale") ?? "en")
  };

  const parsed = submitPostSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (hasSpamSignals(`${payload.title} ${payload.summary} ${payload.content}`)) {
    return NextResponse.json({ error: "Spam-like submission" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User missing" }, { status: 404 });

  const slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  await db.post.create({
    data: {
      ...payload,
      locale: payload.locale === "bilingual" ? "bilingual" : payload.locale,
      isBilingual: payload.locale === "bilingual",
      slug: `${slug}-${Date.now()}`,
      state: "submitted",
      authorId: user.id
    }
  });

  return NextResponse.json({ ok: true });
}
