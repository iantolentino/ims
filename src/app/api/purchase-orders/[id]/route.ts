import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) { const result = await apiUser(); if ("response" in result) return result.response; const { id } = await context.params; const order = await db.purchaseOrder.findUnique({ where: { id }, include: { supplier: true, warehouse: true, lines: { include: { product: true } }, attachments: true } }); return order ? NextResponse.json(order) : jsonError("Purchase order not found.", 404); }
export async function PATCH(request: Request, context: Context) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const { id } = await context.params; const body = await request.json(); const order = await db.purchaseOrder.update({ where: { id }, data: { status: body.status, expectedAt: body.expectedAt ? new Date(body.expectedAt) : undefined, notes: body.notes === undefined ? undefined : body.notes } }); await audit(result.user.id, "UPDATE", "PurchaseOrder", id, { status: body.status }); return NextResponse.json(order); } catch (error) { return jsonError(error); } }
