"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions/auth";

export function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if ("error" in result && result.error) setError(result.error);
      else setMessage(result.message || "Password updated.");
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="gh-label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="gh-input"
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && (
        <p className="text-sm text-[var(--success)]">
          {message}{" "}
          <Link href="/login" className="text-[var(--neon-cyan)] underline">
            Log in
          </Link>
        </p>
      )}
      <button type="submit" disabled={pending} className="gh-btn gh-btn-primary w-full">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
