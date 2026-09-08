import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import bcrypt from "bcryptjs";
export async function GET() { const result = await apiAdmin(); if ("response" in result) return result.response; return NextResponse.json(await db.user.findMany({ select: { id: true, username: true, email: true, displayName: true, role: true, status: true, lastLoginAt: true, createdAt: true }, orderBy: { createdAt: "asc" } })); }
export async function POST(request: Request) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const body = await request.json(); if (!body.username || !body.email || !body.displayName || String(body.password || "").length < 8) return jsonError("Username, email, display name, and an 8-character password are required."); const user = await db.user.create({ data: { username: String(body.username).trim(), email: String(body.email).toLowerCase().trim(), displayName: String(body.displayName).trim(), passwordHash: await bcrypt.hash(String(body.password), 12), role: body.role === "ADMIN" ? "ADMIN" : "STAFF" } }); await audit(result.user.id, "CREATE", "User", user.id); return NextResponse.json({ id: user.id, username: user.username }, { status: 201 }); } catch (error) { return jsonError(error); } }
