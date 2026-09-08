import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, signOut } from "@/lib/auth";
import { ScanIcon } from "@/components/ScanIcon";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

async function logout() {
  "use server";
  await signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const user = await requireUser();
  let data: Awaited<ReturnType<typeof loadDashboard>> | null = null;
  let databaseError = false;
  try { data = await loadDashboard(); } catch (error) { console.error("Dashboard load failed", error); databaseError = true; }

  return <div className="min-h-screen lg:flex">
    <aside className="border-b border-line bg-ink text-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:border-white/10">
      <div className="flex items-center justify-between px-5 py-5 lg:block"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9dcab9]">Stockroom</p><p className="mt-1 text-xs text-[#8ca29a]">Inventory operations</p></div><form action={logout} className="lg:mt-14"><button className="text-xs font-bold text-[#b8c8c1] hover:text-white">Sign out</button></form></div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:px-3"><Link href="/scan" className="mb-2 flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-bold text-white transition hover:brightness-95"><ScanIcon size={18} />Scan</Link><NavItem active label="Overview" href="/dashboard" /><NavItem label="Products" href="/products" /><NavItem label="Stock movements" href="/reports?type=movements" /><NavItem label="Purchasing" href="/purchase-orders" /><NavItem label="Reports" href="/reports" /><NavItem label="Stocktake" href="/stocktake" />{user.role === "ADMIN" && <><NavItem label="Suppliers" href="/suppliers" /><NavItem label="Administration" href="/admin" /></>}</nav>
      <div className="hidden border-t border-white/10 p-5 text-xs text-[#8ca29a] lg:block"><p className="font-bold text-[#d7e5de]">{user.displayName}</p><p className="mt-1">{user.role === "ADMIN" ? "Administrator" : "Staff operator"}</p></div>
    </aside>
    <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-10">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end"><div><p className="eyebrow">Wednesday, August 26, 2026</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Operations overview</h1><p className="mt-1 text-sm text-muted">A quick read on what needs attention today.</p></div><Link href="/scan" className="button-primary flex min-h-11 items-center justify-center gap-2 self-start sm:self-auto"><ScanIcon size={18} />Scan</Link></header>
      {databaseError ? <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Database connection needed.</strong> Configure <code>DATABASE_URL</code>, run <code>npm run db:push</code>, then <code>npm run db:seed</code> to load the demo.</div> : data && <>
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Stock value" value={money.format(data.stockValue)} note={`${data.productCount} active products`} /><Metric label="Units on hand" value={data.units.toLocaleString()} note={`${data.warehouseCount} warehouses`} /><Metric label="Low stock" value={String(data.lowStock.length).padStart(2, "0")} note="Requires review" tone={data.lowStock.length ? "warn" : "normal"} /><Metric label="Movements · 30 days" value={data.movementCount.toLocaleString()} note="All locations" /></section>
        <section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="panel overflow-hidden" id="products"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="eyebrow">Attention queue</p><h2 className="mt-1 text-lg font-bold">Low-stock items</h2></div><Link href="#products" className="text-sm font-bold text-accent">View all →</Link></div>{data.lowStock.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3 font-bold">Product</th><th className="px-5 py-3 font-bold">SKU</th><th className="px-5 py-3 font-bold">On hand</th><th className="px-5 py-3 font-bold">Reorder at</th><th className="px-5 py-3 font-bold">Status</th></tr></thead><tbody>{data.lowStock.map((item) => <tr key={item.id} className="border-t border-line"><td className="px-5 py-3 font-bold">{item.name}</td><td className="px-5 py-3 font-mono text-xs text-muted">{item.sku}</td><td className="px-5 py-3 font-bold text-[#b33b3b]">{item.quantity}</td><td className="px-5 py-3 text-muted">{item.reorderPoint}</td><td className="px-5 py-3"><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Reorder</span></td></tr>)}</tbody></table></div> : <EmptyState text="Nothing is below reorder point." />}</div>
          <div className="panel" id="reports"><div className="border-b border-line px-5 py-4"><p className="eyebrow">Movement mix · 30 days</p><h2 className="mt-1 text-lg font-bold">Top-moving products</h2></div><div className="space-y-5 p-5">{data.topProducts.length ? data.topProducts.map((item, index) => <div key={item.id}><div className="flex justify-between text-sm"><span className="font-bold">{item.name}</span><span className="font-mono text-muted">{item.quantity.toLocaleString()} units</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9efeb]"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(10, (item.quantity / data.topProducts[0].quantity) * 100)}%` }} /></div><p className="mt-1 text-xs text-muted">#{index + 1} by movement volume</p></div>) : <EmptyState text="Movement history will appear here." />}</div></div>
        </section>
        <section className="panel mt-6 overflow-hidden" id="movements"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="eyebrow">Live ledger</p><h2 className="mt-1 text-lg font-bold">Recent movements</h2></div><Link href="#movements" className="text-sm font-bold text-accent">Open ledger →</Link></div>{data.recentMovements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Movement</th><th className="px-5 py-3">Warehouse</th><th className="px-5 py-3">Operator</th></tr></thead><tbody>{data.recentMovements.map((movement) => <tr key={movement.id} className="border-t border-line"><td className="px-5 py-3 text-muted">{dateTime.format(movement.createdAt)}</td><td className="px-5 py-3 font-bold">{movement.product.name}<span className="ml-2 font-mono text-xs font-normal text-muted">{movement.product.sku}</span></td><td className="px-5 py-3"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${movement.type === "ISSUE" ? "bg-[#b33b3b]" : "bg-accent"}`} />{movement.type.replace("_", " ")} <span className="ml-2 font-mono text-xs text-muted">{movement.quantity > 0 ? "+" : ""}{movement.quantity}</span></td><td className="px-5 py-3 text-muted">{movement.warehouse.name}</td><td className="px-5 py-3 text-muted">{movement.user.displayName}</td></tr>)}</tbody></table></div> : <EmptyState text="No stock movements yet." />}</section>
      </>}
      <footer className="mt-8 text-xs text-muted">Stockroom v0.1 · Data is kept in your configured MySQL database.</footer>
    </main>
  </div>;
}

function NavItem({ label, href, active = false }: { label: string; href: string; active?: boolean }) { return <Link href={href} className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold ${active ? "bg-white/10 text-white" : "text-[#a9bbb3] hover:bg-white/5 hover:text-white"}`}>{label}</Link>; }
function Metric({ label, value, note, tone = "normal" }: { label: string; value: string; note: string; tone?: "normal" | "warn" }) { return <div className="panel p-5"><p className="eyebrow">{label}</p><p className={`mt-3 text-3xl font-bold ${tone === "warn" ? "text-[#b96f1f]" : ""}`}>{value}</p><p className="mt-2 text-xs text-muted">{note}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="px-5 py-10 text-center text-sm text-muted">{text}</div>; }

async function loadDashboard() {
  const [products, stockLevels, recentMovements, movementActivity, movementCount, warehouseCount] = await Promise.all([
    db.product.findMany({ where: { archivedAt: null }, select: { id: true, sku: true, name: true, reorderPoint: true, costPrice: true } }),
    db.stockLevel.findMany({ where: { product: { archivedAt: null } }, include: { product: { select: { id: true, sku: true, name: true, reorderPoint: true, costPrice: true } } } }),
    db.stockMovement.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } }, user: { select: { displayName: true } } } }),
    db.stockMovement.findMany({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } }, select: { productId: true, quantity: true } }),
    db.stockMovement.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } }),
    db.warehouse.count({ where: { archivedAt: null } }),
  ]);
  const byProduct = new Map<string, { id: string; name: string; sku: string; quantity: number }>();
  for (const level of stockLevels) {
    const existing = byProduct.get(level.productId) ?? { id: level.productId, name: level.product.name, sku: level.product.sku, quantity: 0 };
    existing.quantity += level.quantity;
    byProduct.set(level.productId, existing);
  }
  const lowStock = [...byProduct.values()].filter((item) => { const product = products.find((candidate) => candidate.id === item.id); return product && item.quantity <= product.reorderPoint; }).map((item) => ({ ...item, reorderPoint: products.find((product) => product.id === item.id)!.reorderPoint })).sort((a, b) => a.quantity - b.quantity).slice(0, 8);
  const movementTotals = new Map<string, number>();
  for (const movement of movementActivity) movementTotals.set(movement.productId, (movementTotals.get(movement.productId) ?? 0) + Math.abs(movement.quantity));
  const topProducts = [...movementTotals.entries()].map(([id, quantity]) => { const product = byProduct.get(id); return product ? { ...product, quantity } : null; }).filter((product): product is { id: string; name: string; sku: string; quantity: number } => Boolean(product)).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  return { productCount: products.length, warehouseCount, units: [...byProduct.values()].reduce((total, item) => total + item.quantity, 0), stockValue: stockLevels.reduce((total, item) => total + item.quantity * Number(item.product.costPrice), 0), lowStock, topProducts, recentMovements, movementCount };
}
