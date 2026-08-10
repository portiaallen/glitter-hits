"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setResetUrl(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      if ("error" in result && result.error) setError(result.error);
      else {
        setMessage(result.message || "Check your email.");
        if (result.resetUrl) setResetUrl(result.resetUrl);
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="gh-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="gh-input"
          placeholder="you@example.com"
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--success)]">{message}</p>}
      {resetUrl && (
        <p className="break-all rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-[var(--neon-cyan)]">
          Dev reset link: <a href={resetUrl}>{resetUrl}</a>
        </p>
      )}
      <button type="submit" disabled={pending} className="gh-btn gh-btn-primary w-full">
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-[var(--text-muted)]">
        <Link href="/login" className="text-[var(--neon-cyan)] hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
