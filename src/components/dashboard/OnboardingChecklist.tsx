"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Step = {
  key: string;
  label: string;
  href: string;
  complete: boolean;
};

export function OnboardingChecklist({
  steps,
  completedCount,
}: {
  steps: Step[];
  completedCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  if (hidden || steps.length === 0) return null;

  async function dismiss() {
    startTransition(async () => {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      setHidden(true);
      router.refresh();
    });
  }

  return (
    <section className="gh-glass mb-6 border border-[var(--neon-cyan)]/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="gh-badge">Getting started</p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-semibold">
            Launch checklist · {completedCount}/{steps.length}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Add a site, fund a campaign, and Surf — that densifies the network for everyone.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          disabled={pending}
          className="text-sm text-white/50 hover:text-white"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.key}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-white/5"
            >
              <span
                className={
                  step.complete
                    ? "text-[var(--success)]"
                    : "text-white/30"
                }
                aria-hidden
              >
                {step.complete ? "✓" : "○"}
              </span>
              <span className={step.complete ? "text-white/60 line-through" : ""}>
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
