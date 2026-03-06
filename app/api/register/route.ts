import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "");
  const email = String(form.get("email") ?? "").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email || password.length < 8) {
    return NextResponse.redirect(new URL("/en/signup?error=invalid", req.url));
  }
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return NextResponse.redirect(new URL("/en/login?notice=exists", req.url));
  const passwordHash = await hash(password, 10);
  await db.user.create({ data: { name, email, passwordHash, locale: "en" } });
  return NextResponse.redirect(new URL("/en/login?notice=created", req.url));
}
