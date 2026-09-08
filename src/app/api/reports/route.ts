import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/api-auth";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const result = await apiUser(); if ("response" in result) return result.response;
  const url = new URL(request.url); const type = url.searchParams.get("type") || "inventory"; const format = url.searchParams.get("format");
  if (type === "movements") {
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") || 30))); const rows = await db.stockMovement.findMany({ where: { createdAt: { gte: new Date(Date.now() - days * 86_400_000) } }, include: { product: { select: { sku: true, name: true } }, warehouse: { select: { code: true, name: true } }, location: { select: { code: true } }, user: { select: { username: true, displayName: true } } }, orderBy: { createdAt: "desc" } }); const data = rows.map((row) => ({ date: row.createdAt.toISOString(), sku: row.product.sku, product: row.product.name, type: row.type, quantity: row.quantity, before: row.quantityBefore, after: row.quantityAfter, warehouse: row.warehouse.code, location: row.location?.code || "", operator: row.user.displayName, reason: row.reason || "", reference: row.reference || "" })); if (format === "csv") return csvResponse(toCsv(Object.keys(data[0] || { date: "", sku: "" }), data), "movement-report.csv"); return NextResponse.json({ type, days, rows: data });
  }
  const products = await db.product.findMany({ where: { archivedAt: null }, include: { stockLevels: true, movements: { where: { type: "ISSUE", createdAt: { gte: new Date(Date.now() - 90 * 86_400_000) } } }, category: true }, orderBy: { name: "asc" } });
  const data = products.map((product) => { const units = product.stockLevels.reduce((sum, level) => sum + level.quantity, 0); const value = units * Number(product.costPrice); const issued = product.movements.reduce((sum, movement) => sum + Math.abs(movement.quantity), 0); return { sku: product.sku, product: product.name, category: product.category.name, units, costPrice: Number(product.costPrice), stockValue: value, issued90Days: issued, daysOfStock: issued ? Math.round((units / (issued / 90)) * 10) / 10 : null, slowOrDead: issued === 0 ? "DEAD" : units > issued * 3 ? "SLOW" : "" }; });
  if (format === "csv") return csvResponse(toCsv(Object.keys(data[0] || { sku: "" }), data), `${type}-report.csv`);
  return NextResponse.json({ type, rows: data });
}
