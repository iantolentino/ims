import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET(request: Request) {
  const result = await apiUser(); if ("response" in result) return result.response;
  const url = new URL(request.url); const search = url.searchParams.get("q")?.trim(); const includeArchived = url.searchParams.get("archived") === "1";
  const products = await db.product.findMany({ where: { ...(includeArchived ? {} : { archivedAt: null }), ...(search ? { OR: [{ sku: { contains: search } }, { name: { contains: search } }, { barcode: { contains: search } }] } : {}) }, include: { category: { select: { id: true, name: true } }, stockLevels: { select: { quantity: true } }, priceTiers: true, suppliers: { include: { supplier: true } } }, orderBy: { name: "asc" } });
  return NextResponse.json(products.map((product) => ({ ...product, totalQuantity: product.stockLevels.reduce((sum, level) => sum + level.quantity, 0) })));
}

export async function POST(request: Request) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try {
    const body = await request.json(); const sku = String(body.sku ?? "").trim(); const name = String(body.name ?? "").trim(); const categoryId = String(body.categoryId ?? "").trim();
    if (!sku || !name || !categoryId) return jsonError("SKU, name, and category are required.");
    const product = await db.product.create({ data: { sku, barcode: body.barcode ? String(body.barcode).trim() : null, name, description: body.description ? String(body.description) : null, unitOfMeasure: String(body.unitOfMeasure || "unit"), costPrice: Number(body.costPrice || 0), sellPrice: Number(body.sellPrice || 0), taxRate: Number(body.taxRate || 0), taxInclusive: Boolean(body.taxInclusive), reorderPoint: Math.max(0, Number(body.reorderPoint || 0)), reorderQuantity: Math.max(0, Number(body.reorderQuantity || 0)), imageUrl: body.imageUrl ? String(body.imageUrl) : null, categoryId, parentId: body.parentId || null } });
    await audit(result.user.id, "CREATE", "Product", product.id, { sku });
    return NextResponse.json(product, { status: 201 });
  } catch (error) { return jsonError(error); }
}
