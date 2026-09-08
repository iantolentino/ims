import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
export async function GET() { const result = await apiUser(); if ("response" in result) return result.response; return NextResponse.json(await db.salesReference.findMany({ orderBy: { createdAt: "desc" }, take: 200 })); }
export async function POST(request: Request) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const body = await request.json(); if (!body.reference) return jsonError("Reference is required."); return NextResponse.json(await db.salesReference.create({ data: { reference: String(body.reference), customer: body.customer || null, notes: body.notes || null } }), { status: 201 }); } catch (error) { return jsonError(error); } }
