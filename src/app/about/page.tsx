import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "About",
  description: "The Glitter Hits story — transparent traffic exchange for the Queerdom.",
};

export default function AboutPage() {
  return (
    <div>
      <PageHero
        title="A traffic exchange that refuses to lie."
        description="Glitter Hits is a promotional discovery network: you earn credits by visiting real sites, then spend them to promote yours. Exchange traffic is always labeled honestly."
        eyebrow="Brand story"
      />

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-14 sm:px-6">
        <div className="max-w-3xl space-y-4 text-[var(--text-muted)] leading-relaxed">
          <p>
            Built for the Queerdom and anyone tired of fake popularity, Glitter Hits treats
            attention as a fair exchange — not a dark pattern. Manual surf sessions, integer
            credits, and clear labeling keep the loop glamorous and grounded.
          </p>
          <p>
            We do not spoof referrers as Google, social, or organic. Every visit is exchange
            traffic. Campaigns compete on targeting, priority, and available credits — never on
            manufactured vanity metrics.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Transparency principles
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Honest labeling",
                body: "Visitors know they are on exchange traffic. No fake organic claims.",
              },
              {
                title: "Integer credits",
                body: "Glitter Hits stay whole numbers — clear ledgers, no floating dust.",
              },
              {
                title: "Estimates ≠ guarantees",
                body: "Network snapshots and daily estimates are guidance, not promises.",
              },
            ].map((item) => (
              <li key={item.title} className="gh-glass p-5">
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/how-it-works" className="gh-btn gh-btn-primary">
            How it works
          </Link>
          <Link href="/signup" className="gh-btn gh-btn-ghost">
            Join free
          </Link>
        </div>
      </section>
    </div>
  );
}
