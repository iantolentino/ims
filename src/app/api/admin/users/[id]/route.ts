import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import bcrypt from "bcryptjs";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const { id } = await context.params; const body = await request.json(); if (id === result.user.id && body.status === "INACTIVE") return jsonError("You cannot deactivate your own account."); const user = await db.user.update({ where: { id }, data: { displayName: body.displayName, role: body.role, status: body.status, ...(body.password ? { passwordHash: await bcrypt.hash(String(body.password), 12) } : {}) } }); await audit(result.user.id, "UPDATE", "User", id, { role: body.role, status: body.status }); return NextResponse.json({ id: user.id }); } catch (error) { return jsonError(error); } }
