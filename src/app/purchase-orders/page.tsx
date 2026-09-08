import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PurchaseOrdersClient } from "@/components/PurchaseOrdersClient";
export const dynamic = "force-dynamic";
export default async function PurchaseOrdersPage() { const user = await requireUser(); return <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-bold text-accent">← Dashboard</Link><p className="eyebrow mt-6">Procurement</p><h1 className="mt-2 text-3xl font-bold">Purchase orders</h1><p className="mt-1 text-sm text-muted">Create orders, track outstanding quantities, and post receipts into stock.</p><div className="mt-7"><PurchaseOrdersClient canEdit={user.role === "ADMIN"} /></div></div></main>; }
