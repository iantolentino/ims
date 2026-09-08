import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET() { const result = await apiUser(); if ("response" in result) return result.response; return NextResponse.json(await db.supplier.findMany({ where: { archivedAt: null }, include: { products: { include: { product: { select: { id: true, sku: true, name: true } } } }, _count: { select: { orders: true } } }, orderBy: { name: "asc" } })); }
export async function POST(request: Request) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const body = await request.json(); if (!String(body.name ?? "").trim()) return jsonError("Supplier name is required."); const supplier = await db.supplier.create({ data: { name: String(body.name).trim(), contactName: body.contactName || null, email: body.email || null, phone: body.phone || null, leadTimeDays: Math.max(0, Number(body.leadTimeDays || 0)) } }); await audit(result.user.id, "CREATE", "Supplier", supplier.id); return NextResponse.json(supplier, { status: 201 }); } catch (error) { return jsonError(error); } }
