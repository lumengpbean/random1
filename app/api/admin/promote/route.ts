import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { postId } = await req.json();
  await db.post.update({ where: { id: postId }, data: { state: "promoted_to_journal" } });
  return NextResponse.json({ ok: true });
}
