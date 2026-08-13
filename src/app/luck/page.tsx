import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Luck Hub",
  description: "Quests, wheel, challenges, royalty, and personas.",
};

const hubs = [
  {
    href: "/luck/quests",
    title: "Quests",
    body: "Daily and weekly missions that award Hits and Luck.",
  },
  {
    href: "/luck/wheel",
    title: "Wheel",
    body: "Spend a spin for drops, Hits, or rare rewards.",
  },
  {
    href: "/luck/challenges",
    title: "Challenges",
    body: "Community goals — contribute together, share the win.",
  },
  {
    href: "/luck/royalty",
    title: "Royalty",
    body: "Climb seasonal ranks with fair, transparent scoring.",
  },
  {
    href: "/luck/personas",
    title: "Personas",
    body: "Collect badges and express your Queerdom vibe.",
  },
];

export default async function LuckHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell
      title="Luck Hub"
      subtitle="Surf. Spark. Share. Get Lucky. — one place for every Luck Engine surface."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hubs.map((hub) => (
          <Link
            key={hub.href}
            href={hub.href}
            className="gh-glass block p-6 transition hover:border-pink-400/40"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              {hub.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{hub.body}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
