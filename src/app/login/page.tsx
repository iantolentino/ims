"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Unable to sign in.");
    else router.push("/dashboard");
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-line bg-panel shadow-panel md:grid-cols-[1.05fr_.95fr]">
        <div className="hidden bg-ink p-12 text-white md:block">
          <p className="eyebrow text-[#9dcab9]">STOCKROOM / OPS</p>
          <h1 className="mt-20 max-w-sm text-4xl font-bold leading-tight">Know what is on hand before the next order lands.</h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-[#b8c8c1]">A focused workspace for stock, locations, receiving, and accountable movement history.</p>
          <div className="mt-20 border-t border-white/15 pt-5 text-xs text-[#8ca29a]">Inventory operations, kept clear.</div>
        </div>
        <div className="p-7 sm:p-12">
          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-2 text-2xl font-bold">Sign in to Stockroom</h2>
          <p className="mt-2 text-sm text-muted">Use your username or work email.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Username or email</span><input className="input" name="identifier" autoComplete="username" required /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Password</span><input className="input" name="password" type="password" autoComplete="current-password" required /></label>
            <label className="flex items-center gap-2 text-sm text-muted"><input name="rememberMe" type="checkbox" className="h-4 w-4 accent-[#1f6f5b]" /> Keep me signed in for 30 days</label>
            {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="button-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <Link href="/reset-password" className="mt-5 block text-center text-sm font-bold text-accent hover:underline">Forgot password?</Link>
          <p className="mt-10 text-center text-xs text-muted">Contact an administrator if your account is inactive.</p>
        </div>
      </section>
    </main>
  );
}
