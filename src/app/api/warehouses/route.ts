import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
export async function GET() { const result = await apiUser(); if ("response" in result) return result.response; return NextResponse.json(await db.warehouse.findMany({ where: { archivedAt: null }, include: { locations: { where: { archivedAt: null }, orderBy: { code: "asc" } } }, orderBy: { name: "asc" } })); }
export async function POST(request: Request) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const body = await request.json(); if (!body.name || !body.code) return jsonError("Warehouse name and code are required."); const warehouse = await db.warehouse.create({ data: { name: String(body.name), code: String(body.code).toUpperCase(), address: body.address || null } }); await audit(result.user.id, "CREATE", "Warehouse", warehouse.id); return NextResponse.json(warehouse, { status: 201 }); } catch (error) { return jsonError(error); } }
