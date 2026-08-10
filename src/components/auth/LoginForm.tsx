"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
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
          autoComplete="email"
          className="gh-input"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="gh-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="gh-input"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="gh-btn gh-btn-primary w-full disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-[var(--text-muted)]">
        New here?{" "}
        <Link href="/signup" className="text-[var(--neon-cyan)] hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
