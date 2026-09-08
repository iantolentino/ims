import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const SESSION_COOKIE = "ims_session";
const SESSION_DAYS = 8;
const REMEMBER_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const IDLE_TIMEOUT_MS = 12 * 60 * 60_000;

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || session.lastSeenAt.getTime() + IDLE_TIMEOUT_MS <= Date.now() || session.user.status !== "ACTIVE") return null;

  await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function authenticate(identifier: string, password: string, rememberMe: boolean) {
  const user = await db.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
  });
  if (!user) return { ok: false as const, error: "Invalid username or password." };

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false as const, error: "Account temporarily locked. Try again later." };
  }
  if (user.status !== "ACTIVE") return { ok: false as const, error: "This account is inactive." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const failed = user.failedLoginAttempts + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failed >= MAX_FAILED_ATTEMPTS ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    await db.auditLog.create({ data: { userId: user.id, action: "LOGIN_FAILED", entity: "User", entityId: user.id } });
    return { ok: false as const, error: "Invalid username or password." };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (rememberMe ? REMEMBER_DAYS : SESSION_DAYS) * 86_400_000);
  await db.$transaction([
    db.session.create({ data: { token, userId: user.id, expiresAt, rememberMe } }),
    db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } }),
    db.auditLog.create({ data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id } }),
  ]);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  return { ok: true as const };
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await db.session.findUnique({ where: { token } });
    if (session) await db.auditLog.create({ data: { userId: session.userId, action: "LOGOUT", entity: "User", entityId: session.userId } });
    await db.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}
