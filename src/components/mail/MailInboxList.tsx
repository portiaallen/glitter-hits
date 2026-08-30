"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function MailInboxList({
  items,
}: {
  items: {
    id: string;
    isFeatured: boolean;
    readAt: string | Date | null;
    mail: {
      subject: string;
      body: string;
      ctaUrl: string | null;
      ctaLabel: string | null;
      isPaidSolo: boolean;
      tier: string;
      sentAt: string | Date | null;
      sender: { name: string | null; levelSlug: string };
    };
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markRead(receiptId: string) {
    startTransition(async () => {
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", receiptId }),
      });
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Inbox empty — when members send network mail, it lands here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={`rounded-2xl border px-4 py-4 ${
            item.isFeatured || item.mail.isPaidSolo
              ? "border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/5"
              : "border-[var(--border-glass)] bg-white/[0.02]"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="mb-1 flex flex-wrap gap-2">
                {(item.isFeatured || item.mail.isPaidSolo) && (
                  <span className="gh-badge">Paid Solo</span>
                )}
                <span className="gh-badge">{item.mail.tier}</span>
                {!item.readAt && <span className="gh-badge">Unread</span>}
              </div>
              <h3 className="font-semibold">{item.mail.subject}</h3>
              <p className="text-xs text-[var(--text-muted)]">
                From {item.mail.sender.name || "Member"} · {item.mail.sender.levelSlug}
              </p>
            </div>
            {!item.readAt ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => markRead(item.id)}
                className="text-xs text-[var(--neon-cyan)]"
              >
                Mark read
              </button>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--text)]/80">{item.mail.body}</p>
          {item.mail.ctaUrl ? (
            <a
              href={item.mail.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-[var(--neon-cyan)]"
            >
              {item.mail.ctaLabel || "Open link"} →
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
