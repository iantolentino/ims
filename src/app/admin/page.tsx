import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminClient } from "@/components/AdminClient";
import { ConfigClient } from "@/components/ConfigClient";
export const dynamic = "force-dynamic";
export default async function AdminPage() { await requireAdmin(); return <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-bold text-accent">← Dashboard</Link><p className="eyebrow mt-6">System administration</p><h1 className="mt-2 text-3xl font-bold">Administration</h1><p className="mt-1 text-sm text-muted">Users, roles, warehouses, and operational configuration.</p><div className="mt-7 space-y-8"><AdminClient /><ConfigClient /></div></div></main>; }
