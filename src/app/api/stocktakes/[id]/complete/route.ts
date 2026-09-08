import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, context: Context) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try {
    const { id } = await context.params;
    const completed = await db.$transaction(async (tx) => {
      const session = await tx.stocktakeSession.findUnique({ where: { id }, include: { counts: true } });
      if (!session) throw new Error("Stocktake not found."); if (session.status !== "OPEN") throw new Error("Stocktake is already closed.");
      const location = await tx.location.findFirst({ where: { warehouseId: session.warehouseId, archivedAt: null }, orderBy: { code: "asc" } }); if (!location) throw new Error("Warehouse has no active location.");
      for (const count of session.counts) {
        if (count.countedQuantity === null) continue;
        const locked = await tx.$queryRaw<Array<{ id: string; quantity: number }>>`SELECT id, quantity FROM StockLevel WHERE productId = ${count.productId} AND locationId = ${location.id} FOR UPDATE`;
        const level = locked[0]; const before = level?.quantity ?? 0; const delta = count.countedQuantity - before; if (!delta) continue;
        if (level) await tx.stockLevel.update({ where: { id: level.id }, data: { quantity: count.countedQuantity } }); else await tx.stockLevel.create({ data: { productId: count.productId, warehouseId: session.warehouseId, locationId: location.id, quantity: count.countedQuantity } });
        await tx.stockMovement.create({ data: { type: "COUNT_CORRECTION", productId: count.productId, warehouseId: session.warehouseId, locationId: location.id, userId: result.user.id, quantity: delta, quantityBefore: before, quantityAfter: count.countedQuantity, reason: `Stocktake: ${session.name}`, reference: id } });
      }
      return tx.stocktakeSession.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() }, include: { counts: true } });
    });
    await audit(result.user.id, "COMPLETE", "StocktakeSession", id); return NextResponse.json(completed);
  } catch (error) { return jsonError(error); }
}
