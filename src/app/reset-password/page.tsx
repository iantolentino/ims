"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/request-reset", { method: "POST", body: form });
    const data = await response.json();
    setMessage(data.message ?? data.error);
  }
  return <main className="flex min-h-screen items-center justify-center px-5"><section className="panel w-full max-w-md p-8">
    <p className="eyebrow">Account recovery</p><h1 className="mt-2 text-2xl font-bold">Reset your password</h1>
    <p className="mt-2 text-sm leading-6 text-muted">Request a token, then paste the administrator-delivered token below to choose a new password.</p>
    <form onSubmit={submit} className="mt-7 space-y-4"><input className="input" name="identifier" placeholder="Username or email" required /><button className="button-primary w-full">Generate reset token</button></form>
    <form onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const response = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); const data = await response.json(); setMessage(data.message ?? data.error); }} className="mt-6 space-y-4 border-t border-line pt-6"><input className="input" name="token" placeholder="Reset token" required /><input className="input" name="password" type="password" minLength={8} placeholder="New password" required /><button className="button-secondary w-full">Set new password</button></form>
    {message && <p className="mt-4 rounded-md bg-[#edf6f1] px-3 py-2 text-sm text-accent">{message}</p>}
    <Link href="/login" className="mt-6 block text-center text-sm font-bold text-accent hover:underline">Back to sign in</Link>
  </section></main>;
}
