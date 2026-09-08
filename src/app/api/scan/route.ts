import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  await requireUser();
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ error: "Enter or scan a code." }, { status: 400 });

  const product = await db.product.findUnique({ where: { barcode: code } });
  if (product && !product.archivedAt) return NextResponse.json({ kind: "product", id: product.id, url: `/scan/item/product/${product.id}` });
  const asset = await db.asset.findUnique({ where: { tag: code } });
  if (asset) return NextResponse.json({ kind: "asset", id: asset.id, url: `/scan/item/asset/${asset.id}` });
  const warehouse = await db.warehouse.findUnique({ where: { code } });
  if (warehouse && !warehouse.archivedAt) return NextResponse.json({ kind: "warehouse", id: warehouse.id, url: `/scan/item/warehouse/${warehouse.id}` });
  const location = await db.location.findFirst({ where: { code, archivedAt: null } });
  if (location) return NextResponse.json({ kind: "location", id: location.id, url: `/scan/item/location/${location.id}` });
  return NextResponse.json({ error: `No product, bin, warehouse, or asset matches “${code}”.` }, { status: 404 });
}
