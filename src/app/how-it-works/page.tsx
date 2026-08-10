import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "How it works",
  description: "Earn Glitter Hits by discovering sites, then spend them to promote yours.",
};

const steps = [
  {
    step: "01",
    title: "Discover",
    body: "Open Manual Surf. Watch the countdown, explore the site, and earn integer promotional credits for completed visits.",
  },
  {
    step: "02",
    title: "Earn",
    body: "Credits land in your ledger immediately. Streaks, levels, and achievements can add bonus Glitter Hits over time.",
  },
  {
    step: "03",
    title: "Promote",
    body: "Allocate credits to a campaign for your approved website. Set duration, targeting, priority, and delivery pace.",
  },
  {
    step: "04",
    title: "Measure",
    body: "Track visits, unique viewers, and spend with honest analytics — labeled as exchange traffic every time.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        title="The earn / spend loop."
        description="Surf to earn Glitter Hits. Spend them on campaigns. One fair loop — glamorous, manual, and transparent."
        eyebrow="How it works"
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <ol className="grid gap-5 md:grid-cols-2">
          {steps.map((s) => (
            <li key={s.step} className="gh-glass p-6">
              <span className="gh-badge mb-4">{s.step}</span>
              <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 gh-glass relative overflow-hidden p-8">
          <div className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />
          <h2 className="relative font-[family-name:var(--font-syne)] text-2xl font-bold">
            Ready to start?
          </h2>
          <p className="relative mt-2 max-w-xl text-[var(--text-muted)]">
            Create a free account, claim your welcome bonus if available, and jump into Surf.
          </p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="gh-btn gh-btn-primary">
              Join free
            </Link>
            <Link href="/browse" className="gh-btn gh-btn-ghost">
              Browse the directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
