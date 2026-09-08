import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
export async function GET(request: Request) { const result = await apiUser(); if ("response" in result) return result.response; const warehouseId = new URL(request.url).searchParams.get("warehouseId"); return NextResponse.json(await db.location.findMany({ where: { archivedAt: null, ...(warehouseId ? { warehouseId } : {}) }, include: { warehouse: true }, orderBy: { code: "asc" } })); }
export async function POST(request: Request) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const body = await request.json(); if (!body.warehouseId || !body.code || !body.name) return jsonError("Warehouse, location code, and name are required."); const location = await db.location.create({ data: { warehouseId: body.warehouseId, code: String(body.code).toUpperCase(), name: String(body.name) } }); await audit(result.user.id, "CREATE", "Location", location.id); return NextResponse.json(location, { status: 201 }); } catch (error) { return jsonError(error); } }
