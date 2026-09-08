import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const result = await apiUser(); if ("response" in result) return result.response; const { id } = await context.params; return NextResponse.json(await db.productAttachment.findMany({ where: { productId: id }, orderBy: { createdAt: "desc" } }));
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const result = await apiAdmin(); if ("response" in result) return result.response; try { const { id } = await context.params; const body = await request.json(); if (!body.fileName || !body.filePath) return jsonError("fileName and filePath are required."); return NextResponse.json(await db.productAttachment.create({ data: { productId: id, fileName: String(body.fileName), filePath: String(body.filePath), mimeType: body.mimeType ? String(body.mimeType) : null } }), { status: 201 }); } catch (error) { return jsonError(error); }
}
