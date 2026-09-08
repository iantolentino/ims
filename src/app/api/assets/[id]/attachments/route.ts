import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) { const result = await apiUser(); if ("response" in result) return result.response; const { id } = await context.params; return NextResponse.json(await db.assetAttachment.findMany({ where: { assetId: id }, orderBy: { createdAt: "desc" } })); }
export async function POST(request: Request, context: Context) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const { id } = await context.params; const body = await request.json(); if (!body.fileName || !body.filePath) return jsonError("fileName and filePath are required."); return NextResponse.json(await db.assetAttachment.create({ data: { assetId: id, fileName: String(body.fileName), filePath: String(body.filePath), mimeType: body.mimeType ? String(body.mimeType) : null } }), { status: 201 }); } catch (error) { return jsonError(error); } }
