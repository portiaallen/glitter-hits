import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Contact inbox" };

export default async function AdminContactPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
          Contact &amp; feedback inbox
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Contact + Tell Glitter Hits submissions. Emails also go to SUPPORT_EMAIL when Resend is
          configured.
        </p>
      </header>
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <article key={m.id} className="gh-glass p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-[var(--text)]">
                  {m.name}{" "}
                  <a
                    href={`mailto:${m.email}`}
                    className="text-sm font-normal text-[var(--neon-cyan)]"
                  >
                    {m.email}
                  </a>
                </p>
                <time className="text-xs text-[var(--text-muted)]">
                  {m.createdAt.toISOString().slice(0, 19).replace("T", " ")} UTC
                </time>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="gh-badge">{m.category}</span>
                {m.rewarded ? <span className="gh-badge">rewarded</span> : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{m.message}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                {m.status}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
