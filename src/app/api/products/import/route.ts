import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, jsonError } from "@/lib/api-auth";
import { parseCsv } from "@/lib/csv";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try {
    const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return jsonError("CSV file is required.");
    const rows = parseCsv(await file.text()); const categories = await db.category.findMany(); const categoryByName = new Map(categories.map((category) => [category.name.toLowerCase(), category])); let created = 0; let updated = 0;
    for (const row of rows) {
      const sku = row.sku?.trim(); const name = row.name?.trim(); if (!sku || !name) continue;
      let category = row.category ? categoryByName.get(row.category.toLowerCase()) : undefined;
      if (!category) { const categoryName = row.category?.trim() || "Uncategorized"; category = await db.category.upsert({ where: { slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-") }, update: {}, create: { name: categoryName, slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-") } }); categoryByName.set(categoryName.toLowerCase(), category); }
      const existing = await db.product.findUnique({ where: { sku } });
      const data = { barcode: row.barcode || null, name, description: row.description || null, unitOfMeasure: row.unitOfMeasure || "unit", costPrice: Number(row.costPrice || 0), sellPrice: Number(row.sellPrice || 0), taxRate: Number(row.taxRate || 0), taxInclusive: ["true", "1", "yes"].includes((row.taxInclusive || "").toLowerCase()), reorderPoint: Math.max(0, Number(row.reorderPoint || 0)), reorderQuantity: Math.max(0, Number(row.reorderQuantity || 0)), categoryId: category.id, archivedAt: null };
      if (existing) { await db.product.update({ where: { id: existing.id }, data }); updated += 1; } else { await db.product.create({ data: { ...data, sku } }); created += 1; }
    }
    await audit(result.user.id, "IMPORT", "Product", undefined, { created, updated }); return NextResponse.json({ created, updated });
  } catch (error) { return jsonError(error); }
}
