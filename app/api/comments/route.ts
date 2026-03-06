import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasSpamSignals, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const guard = rateLimit(`comment:${session.user.email}`, 20, 60_000);
  if (!guard.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const { postId, body } = await req.json();
  if (!body || body.length < 3 || hasSpamSignals(body)) return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User missing" }, { status: 404 });
  await db.comment.create({ data: { postId, body, userId: user.id } });
  return NextResponse.json({ ok: true });
}
