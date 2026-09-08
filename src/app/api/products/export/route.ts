import { db } from "@/lib/db";
import { apiUser } from "@/lib/api-auth";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const result = await apiUser(); if ("response" in result) return result.response;
  const products = await db.product.findMany({ where: { archivedAt: null }, include: { category: true, stockLevels: true }, orderBy: { sku: "asc" } });
  return csvResponse(toCsv(["sku", "barcode", "name", "description", "unitOfMeasure", "costPrice", "sellPrice", "taxRate", "taxInclusive", "reorderPoint", "reorderQuantity", "category", "totalQuantity"], products.map((product) => ({ sku: product.sku, barcode: product.barcode, name: product.name, description: product.description, unitOfMeasure: product.unitOfMeasure, costPrice: product.costPrice, sellPrice: product.sellPrice, taxRate: product.taxRate, taxInclusive: product.taxInclusive, reorderPoint: product.reorderPoint, reorderQuantity: product.reorderQuantity, category: product.category.name, totalQuantity: product.stockLevels.reduce((sum, level) => sum + level.quantity, 0) }))), "products.csv");
}
