import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, body, locale } = await req.json();
  await db.announcement.create({ data: { title, body, locale, published: true } });
  return NextResponse.json({ ok: true });
}
