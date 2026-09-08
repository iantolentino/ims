import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const result = await apiUser(); if ("response" in result) return result.response;
  const { id } = await context.params; const product = await db.product.findUnique({ where: { id }, include: { category: true, stockLevels: { include: { warehouse: true, location: true } }, movements: { orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { displayName: true } }, warehouse: true, location: true } }, priceTiers: true, suppliers: { include: { supplier: true } }, attachments: true } });
  return product ? NextResponse.json(product) : jsonError("Product not found.", 404);
}

export async function PATCH(request: Request, context: Context) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try { const { id } = await context.params; const body = await request.json(); const product = await db.product.update({ where: { id }, data: { sku: body.sku, barcode: body.barcode || null, name: body.name, description: body.description || null, unitOfMeasure: body.unitOfMeasure, costPrice: body.costPrice === undefined ? undefined : Number(body.costPrice), sellPrice: body.sellPrice === undefined ? undefined : Number(body.sellPrice), taxRate: body.taxRate === undefined ? undefined : Number(body.taxRate), taxInclusive: body.taxInclusive === undefined ? undefined : Boolean(body.taxInclusive), reorderPoint: body.reorderPoint === undefined ? undefined : Number(body.reorderPoint), reorderQuantity: body.reorderQuantity === undefined ? undefined : Number(body.reorderQuantity), imageUrl: body.imageUrl || null, categoryId: body.categoryId, parentId: body.parentId || null } }); await audit(result.user.id, "UPDATE", "Product", id); return NextResponse.json(product); } catch (error) { return jsonError(error); }
}

export async function DELETE(_request: Request, context: Context) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try { const { id } = await context.params; const product = await db.product.update({ where: { id }, data: { archivedAt: new Date() } }); await audit(result.user.id, "ARCHIVE", "Product", id); return NextResponse.json(product); } catch (error) { return jsonError(error); }
}
