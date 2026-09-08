import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "").trim();
  if (!identifier) return NextResponse.json({ error: "Enter a username or email." }, { status: 400 });
  const user = await db.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60_000) } });
    console.info(`[IMS password reset] user=${user.username} token=${token}`);
  }
  return NextResponse.json({ message: "If the account exists, a reset link has been logged for the administrator." });
}
