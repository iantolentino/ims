import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rememberMe = form.get("rememberMe") === "on";
  if (!identifier || !password) return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });

  try {
    const result = await authenticate(identifier, password, rememberMe);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "The database is unavailable. Check your connection and try again." }, { status: 503 });
  }
}
