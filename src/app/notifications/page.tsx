import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import {
  listNotifications,
  markNotificationsRead,
} from "@/lib/notifications/service";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await listNotifications(session.user.id, 50);
  await markNotificationsRead(session.user.id);

  return (
    <AppShell title="Notifications" subtitle="Moderation, campaign delivery, and network mail.">
      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="gh-glass p-5 text-sm text-[var(--text-muted)]">No notifications yet.</li>
        )}
        {items.map((n) => (
          <li key={n.id} className="gh-glass p-5">
            <p className="font-medium">{n.title}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{n.body}</p>
            <p className="mt-2 text-xs text-white/40">{n.createdAt.toISOString()}</p>
            {n.href ? (
              <Link href={n.href} className="mt-2 inline-block text-sm text-[var(--neon-cyan)]">
                Open →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
