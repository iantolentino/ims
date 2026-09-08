import Link from "next/link";
import { requireUser } from "@/lib/auth";
import ScanClient from "@/components/ScanClient";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const user = await requireUser();
  return <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12"><header className="mx-auto flex max-w-6xl items-center justify-between border-b border-line pb-5"><div><Link href="/dashboard" className="text-sm font-bold text-accent hover:underline">← Dashboard</Link><p className="eyebrow mt-6">Universal lookup</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Scan an item</h1><p className="mt-1 text-sm text-muted">Signed in as {user.displayName}. The camera detects codes automatically.</p></div><Link href="/dashboard" className="button-secondary hidden sm:block">Close</Link></header><div className="mx-auto mt-7 max-w-6xl"><ScanClient /></div></main>;
}
