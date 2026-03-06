import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const guard = rateLimit(`vote:${session.user.email}`, 30, 60_000);
  if (!guard.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  const { postId } = await req.json();
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User missing" }, { status: 404 });
  await db.vote.upsert({ where: { userId_postId: { userId: user.id, postId } }, create: { userId: user.id, postId, value: 1 }, update: { value: 1 } });
  return NextResponse.json({ ok: true });
}
