"use client";

import { useState, useTransition } from "react";
import { submitContactAction } from "@/lib/actions/contact";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    if (turnstileToken) formData.set("cf-turnstile-response", turnstileToken);
    startTransition(async () => {
      const result = await submitContactAction(formData);
      if ("error" in result && result.error) setError(result.error);
      else setMessage(result.message || "Thanks — we got it.");
    });
  }

  return (
    <form action={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="name" className="gh-label">
          Name
        </label>
        <input id="name" name="name" required className="gh-input" placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="email" className="gh-label">
          Reply email
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
      <div>
        <label htmlFor="message" className="gh-label">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={5}
          className="gh-input resize-y"
          placeholder="How can we help?"
        />
      </div>
      <TurnstileWidget onToken={(t) => setTurnstileToken(t || "")} />
      <input type="hidden" name="cf-turnstile-response" value={turnstileToken} />
      <div className="absolute -left-[9999px] opacity-0" aria-hidden tabIndex={-1}>
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" autoComplete="off" tabIndex={-1} />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--success)]">{message}</p>}
      <button type="submit" disabled={pending} className="gh-btn gh-btn-primary w-full disabled:opacity-60">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
