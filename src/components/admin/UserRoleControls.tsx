"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const OPTIONS = ["member", "moderator", "admin"] as const;

export function UserRoleControls({
  userId,
  email,
  role,
  viewerRole,
}: {
  userId: string;
  email: string;
  role: string;
  viewerRole: string | undefined;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(role);
  const [error, setError] = useState<string | null>(null);

  if (viewerRole !== "founder" || role === "founder" || !OPTIONS.includes(value as (typeof OPTIONS)[number])) {
    return <span className="text-xs text-[var(--text-muted)]">{role}</span>;
  }

  function apply() {
    if (value === role) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_user_role", userId, role: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="flex items-center gap-1">
      <select
        aria-label={`Role for ${email}`}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        className="gh-input px-1 py-0.5 text-xs"
      >
        {OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || value === role}
        onClick={apply}
        className="gh-btn gh-btn-ghost px-2 py-1 text-xs"
      >
        Set
      </button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </span>
  );
}
