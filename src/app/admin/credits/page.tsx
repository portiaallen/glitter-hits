"use client";

import { useState } from "react";

export default function AdminCreditsPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "adjust_credits",
        userId: form.get("userId"),
        amount,
        description: form.get("description"),
      }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Adjusted. New balance: ${data.user?.creditBalance}` : data.error);
  }

  return (
    <form onSubmit={onSubmit} className="gh-glass max-w-lg space-y-4 p-6">
      <h2 className="font-semibold">Admin credit adjustment</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Integer only. Positive credits, negative debits. Logged to the audit trail.
      </p>
      <div>
        <label className="gh-label" htmlFor="userId">User ID</label>
        <input id="userId" name="userId" required className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="amount">Amount (integer)</label>
        <input id="amount" name="amount" type="number" step={1} required className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="description">Description</label>
        <input id="description" name="description" required className="gh-input" />
      </div>
      {msg && <p className="text-sm text-[var(--neon-cyan)]">{msg}</p>}
      <button disabled={busy} className="gh-btn gh-btn-primary" type="submit">
        Apply adjustment
      </button>
    </form>
  );
}
