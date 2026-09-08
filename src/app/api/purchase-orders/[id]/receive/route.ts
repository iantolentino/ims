import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try {
    const { id } = await context.params; const body = await request.json(); const locationId = String(body.locationId || ""); const reason = String(body.reason || "PO receiving"); const received = Array.isArray(body.lines) ? body.lines : [];
    if (!locationId || !received.length) return jsonError("Location and received quantities are required.");
    const order = await db.purchaseOrder.findUnique({ where: { id }, include: { lines: true } }); if (!order) return jsonError("Purchase order not found.", 404);
    const location = await db.location.findUnique({ where: { id: locationId } }); if (!location || location.warehouseId !== order.warehouseId) return jsonError("Choose a location in the purchase-order warehouse.");
    await db.$transaction(async (tx) => {
      for (const entry of received as Array<{ lineId: string; quantity: number }>) {
        const line = order.lines.find((candidate) => candidate.id === entry.lineId); const quantity = Math.floor(Number(entry.quantity || 0)); if (!line || quantity <= 0) continue; const remaining = line.orderedQty - line.receivedQty; const actual = Math.min(quantity, remaining); if (!actual) continue;
        const locked = await tx.$queryRaw<Array<{ id: string; quantity: number }>>`SELECT id, quantity FROM StockLevel WHERE productId = ${line.productId} AND locationId = ${locationId} FOR UPDATE`; const level = locked[0]; const before = level?.quantity ?? 0; const after = before + actual;
        if (level) await tx.stockLevel.update({ where: { id: level.id }, data: { quantity: after } }); else await tx.stockLevel.create({ data: { productId: line.productId, warehouseId: order.warehouseId, locationId, quantity: after } });
        await tx.purchaseOrderLine.update({ where: { id: line.id }, data: { receivedQty: { increment: actual } } }); await tx.stockMovement.create({ data: { type: "RECEIVE", productId: line.productId, warehouseId: order.warehouseId, locationId, userId: result.user.id, quantity: actual, quantityBefore: before, quantityAfter: after, reason, reference: order.orderNumber } });
      }
      const fresh = await tx.purchaseOrder.findUnique({ where: { id }, include: { lines: true } }); const complete = fresh?.lines.every((line) => line.receivedQty >= line.orderedQty); const any = fresh?.lines.some((line) => line.receivedQty > 0); await tx.purchaseOrder.update({ where: { id }, data: { status: complete ? "RECEIVED" : any ? "PARTIALLY_RECEIVED" : order.status, receivedAt: complete ? new Date() : null } });
    });
    await audit(result.user.id, "RECEIVE", "PurchaseOrder", id, { locationId }); return NextResponse.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
