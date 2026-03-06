import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const guard = rateLimit(`report:${session.user.email}`, 10, 60_000);
  if (!guard.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User missing" }, { status: 404 });
  const { reason, details, postId, commentId } = await req.json();
  await db.report.create({ data: { reason, details, postId, commentId, reporterId: user.id } });
  return NextResponse.json({ ok: true });
}
