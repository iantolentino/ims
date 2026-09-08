import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SuppliersClient } from "@/components/SuppliersClient";
export const dynamic = "force-dynamic";
export default async function SuppliersPage() { const user = await requireUser(); return <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-bold text-accent">← Dashboard</Link><p className="eyebrow mt-6">Purchasing directory</p><h1 className="mt-2 text-3xl font-bold">Suppliers</h1><p className="mt-1 text-sm text-muted">Contacts, lead times, and supplier order history.</p><div className="mt-7"><SuppliersClient canEdit={user.role === "ADMIN"} /></div></div></main>; }
