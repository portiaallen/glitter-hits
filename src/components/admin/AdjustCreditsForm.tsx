"use client";

import { useState } from "react";

export function AdjustCreditsForm() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_credits",
          userId: userId.trim(),
          amount: Number.parseInt(amount, 10),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adjustment failed");
      const balance =
        data.entry?.balanceAfter ?? data.user?.creditBalance ?? "updated";
      setMessage(`Adjusted. New balance: ${balance}.`);
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="gh-glass max-w-lg space-y-4 p-6 sm:p-8">
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Adjust credits</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Integer Glitter Hits only. Use a negative amount to debit.
        </p>
      </div>

      <div>
        <label className="gh-label" htmlFor="userId">
          User ID
        </label>
        <input
          id="userId"
          className="gh-input"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          placeholder="cuid…"
        />
      </div>

      <div>
        <label className="gh-label" htmlFor="amount">
          Amount (integer)
        </label>
        <input
          id="amount"
          className="gh-input"
          type="number"
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="gh-label" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          className="gh-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minLength={3}
          required
          placeholder="Reason for adjustment"
        />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--success)]">{message}</p>}

      <button type="submit" className="gh-btn gh-btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Apply adjustment"}
      </button>
    </form>
  );
}
