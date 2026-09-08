import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) { const result = await apiUser(); if ("response" in result) return result.response; const { id } = await context.params; return NextResponse.json(await db.productPriceTier.findMany({ where: { productId: id }, orderBy: { name: "asc" } })); }
export async function POST(request: Request, context: Context) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const { id } = await context.params; const body = await request.json(); if (!body.name || body.price === undefined) return jsonError("Tier name and price are required."); return NextResponse.json(await db.productPriceTier.upsert({ where: { productId_name: { productId: id, name: String(body.name) } }, update: { price: Number(body.price) }, create: { productId: id, name: String(body.name), price: Number(body.price) } }), { status: 201 }); } catch (error) { return jsonError(error); } }
