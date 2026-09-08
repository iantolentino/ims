import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAdmin, apiUser, jsonError } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET() {
  const result = await apiUser(); if ("response" in result) return result.response;
  return NextResponse.json(await db.category.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  const result = await apiAdmin(); if ("response" in result) return result.response;
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) return jsonError("Category name is required.");
    const slug = String(body.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    const category = await db.category.create({ data: { name, slug, description: body.description ? String(body.description) : null, parentId: body.parentId || null, defaultReorder: Math.max(0, Number(body.defaultReorder ?? 5)) } });
    await audit(result.user.id, "CREATE", "Category", category.id, { name });
    return NextResponse.json(category, { status: 201 });
  } catch (error) { return jsonError(error); }
}
