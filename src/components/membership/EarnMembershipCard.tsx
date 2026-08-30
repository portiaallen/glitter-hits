import Link from "next/link";

export type EarnMilestoneView = {
  id: string;
  title: string;
  description: string;
  tier: string;
  days: number;
  progress: number;
  target: number;
  percent: number;
  completed: boolean;
  claimed: boolean;
};

export function EarnMembershipCard({
  membership,
  membershipExpiresAt,
  membershipSource,
  milestones,
}: {
  membership: string;
  membershipExpiresAt?: string | Date | null;
  membershipSource?: string | null;
  milestones: EarnMilestoneView[];
}) {
  const open = milestones.filter((m) => !m.claimed);
  const next = open.sort((a, b) => a.target - b.target)[0] ?? null;
  const expires =
    membershipExpiresAt instanceof Date
      ? membershipExpiresAt
      : membershipExpiresAt
        ? new Date(membershipExpiresAt)
        : null;

  return (
    <section className="gh-glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Earn Pro membership
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Free members unlock Plus (Pro) — and later Premium — by exploring. Earned periods are
            time-limited; Store upgrades stay permanent.
          </p>
        </div>
        <Link href="/store" className="gh-btn gh-btn-ghost text-sm">
          View Store
        </Link>
      </div>

      <p className="mt-4 text-sm">
        Current: <strong className="text-[var(--text)]">{membership}</strong>
        {membershipSource ? (
          <span className="text-[var(--text-muted)]"> · via {membershipSource}</span>
        ) : null}
        {expires ? (
          <span className="text-[var(--text-muted)]">
            {" "}
            · ends {expires.toISOString().slice(0, 10)}
          </span>
        ) : null}
      </p>

      {next ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-[var(--text)]">{next.title}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{next.description}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-cosmic)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${next.percent}%`, background: "var(--prism)" }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {Math.min(next.progress, next.target)} / {next.target}
            {next.completed && !next.claimed ? " · unlocking…" : ""}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          You&apos;ve cleared the current earn path milestones. Keep Surfing — more paths can be
          added anytime.
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {milestones.map((m) => (
          <li key={m.id} className="text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-[var(--text)]">
                {m.title}{" "}
                <span className="gh-badge">
                  {m.tier} · {m.days}d
                </span>
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {m.claimed ? "Claimed" : `${Math.min(m.progress, m.target)}/${m.target}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
