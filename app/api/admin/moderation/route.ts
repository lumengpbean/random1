import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { postId, action, notes } = await req.json();
  await db.post.update({ where: { id: postId }, data: { state: action === "approve" ? "published_preprint" : "rejected", publishedAt: new Date() } });
  await db.moderationAction.create({
    data: { action, notes, moderatorId: (session?.user as any).id, postId }
  });
  return NextResponse.json({ ok: true });
}
