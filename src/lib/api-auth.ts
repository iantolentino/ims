import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export async function apiUser() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  return { user } as const;
}

export async function apiAdmin() {
  const result = await apiUser();
  if ("response" in result) return result;
  if (result.user.role !== "ADMIN") return { response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) } as const;
  return result;
}

export function jsonError(error: unknown, status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status });
}
