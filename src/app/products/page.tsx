import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ProductsClient } from "@/components/ProductsClient";
export const dynamic = "force-dynamic";
export default async function ProductsPage() { const user = await requireUser(); return <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-bold text-accent">← Dashboard</Link><p className="eyebrow mt-6">Catalog & migration</p><h1 className="mt-2 text-3xl font-bold">Products</h1><p className="mt-1 text-sm text-muted">Manage catalog fields, stock identifiers, price inputs, and migration files.</p><div className="mt-7"><ProductsClient canEdit={user.role === "ADMIN"} /></div></div></main>; }
