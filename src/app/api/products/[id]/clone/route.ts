import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try { const { id } = await context.params; const source = await db.product.findUnique({ where: { id }, include: { priceTiers: true, suppliers: true } }); if (!source) return jsonError("Product not found.", 404); const body = await request.json().catch(() => ({})); const suffix = String(body.skuSuffix || "-COPY"); const clone = await db.product.create({ data: { sku: `${source.sku}${suffix}`, barcode: null, name: `${source.name} (Copy)`, description: source.description, unitOfMeasure: source.unitOfMeasure, costPrice: source.costPrice, sellPrice: source.sellPrice, taxRate: source.taxRate, taxInclusive: source.taxInclusive, reorderPoint: source.reorderPoint, reorderQuantity: source.reorderQuantity, imageUrl: source.imageUrl, categoryId: source.categoryId, parentId: source.parentId, priceTiers: { create: source.priceTiers.map((tier) => ({ name: tier.name, price: tier.price })) }, suppliers: { create: source.suppliers.map((supplier) => ({ supplierId: supplier.supplierId, supplierSku: supplier.supplierSku })) } } }); await audit(result.user.id, "CLONE", "Product", clone.id, { sourceId: id }); return NextResponse.json(clone, { status: 201 }); } catch (error) { return jsonError(error); }
}
