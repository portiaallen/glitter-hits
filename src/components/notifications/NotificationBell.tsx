"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setUnread(data.unread ?? 0);
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="gh-btn gh-btn-ghost relative px-3 py-2 text-sm"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        Alerts
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--neon-pink)] px-1 text-[10px] font-bold text-black">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-[var(--border-glass)] bg-[#12061c]/95 p-3 shadow-xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-[var(--neon-cyan)]"
            >
              Mark read
            </button>
          </div>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-2 py-4 text-sm text-[var(--text-muted)]">
                You&apos;re caught up.
              </li>
            )}
            {items.slice(0, 8).map((n) => (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-2 py-2 hover:bg-[var(--bg-glass)]"
                  >
                    <p className={`text-sm ${n.readAt ? "text-[var(--text-muted)]" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{n.body}</p>
                  </Link>
                ) : (
                  <div className="rounded-xl px-2 py-2">
                    <p className={`text-sm ${n.readAt ? "text-[var(--text-muted)]" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{n.body}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="mt-2 block text-center text-xs text-[var(--neon-cyan)]"
          >
            View all →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
