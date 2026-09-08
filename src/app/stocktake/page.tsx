import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { StocktakeClient } from "@/components/StocktakeClient";
export const dynamic = "force-dynamic";
export default async function StocktakePage() { const user = await requireUser(); return <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-bold text-accent">← Dashboard</Link><p className="eyebrow mt-6">Physical inventory</p><h1 className="mt-2 text-3xl font-bold">Stocktake</h1><p className="mt-1 text-sm text-muted">Open count sheets, record variances, and apply corrections to the immutable ledger.</p><div className="mt-7"><StocktakeClient canEdit={user.role === "ADMIN"} /></div></div></main>; }
