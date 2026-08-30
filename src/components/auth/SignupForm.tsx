"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions/auth";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

export function SignupForm({ referralCode }: { referralCode?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    if (turnstileToken) {
      formData.set("cf-turnstile-response", turnstileToken);
    }
    startTransition(async () => {
      const result = await signupAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="gh-label">
          Display name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          className="gh-input"
          placeholder="Your name"
        />
      </div>
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
          minLength={8}
          autoComplete="new-password"
          className="gh-input"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label htmlFor="referralCode" className="gh-label">
          Referral code <span className="text-[var(--text-muted)]">(optional)</span>
        </label>
        <input
          id="referralCode"
          name="referralCode"
          type="text"
          defaultValue={referralCode || ""}
          className="gh-input"
          placeholder="friend-ABC123"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
        <input name="acceptedTerms" type="checkbox" value="true" className="mt-1" required />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-[var(--neon-cyan)] hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[var(--neon-cyan)] hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <TurnstileWidget onToken={(t) => setTurnstileToken(t || "")} />
      <input type="hidden" name="cf-turnstile-response" value={turnstileToken} />
      {/* Honeypot — hidden from humans */}
      <div className="absolute -left-[9999px] opacity-0" aria-hidden tabIndex={-1}>
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" autoComplete="off" tabIndex={-1} />
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
        {pending ? "Creating account…" : "Join Glitter Hits"}
      </button>
      <p className="text-center text-sm text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--neon-cyan)] hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
