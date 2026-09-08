import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, jsonError } from "@/lib/api-auth";
export async function GET() { const result = await apiAdmin(); if ("response" in result) return result.response; return NextResponse.json(await db.setting.findMany({ orderBy: { key: "asc" } })); }
export async function POST(request: Request) { const result = await apiAdmin(); if ("response" in result) return result.response; try { const body = await request.json(); if (!body.key) return jsonError("Setting key is required."); return NextResponse.json(await db.setting.upsert({ where: { key: String(body.key) }, update: { value: String(body.value ?? "") }, create: { key: String(body.key), value: String(body.value ?? "") } })); } catch (error) { return jsonError(error); } }
