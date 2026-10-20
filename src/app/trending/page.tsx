import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { WebsiteCard } from "@/components/sites/WebsiteCard";
import { CURATED_DESTINATIONS } from "@/lib/discovery/visibility";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Hand-curated discovery on Glitter Traffic. Verified, visitor-ready destinations only — no seeded counts, no inflated popularity.",
};

export default function TrendingPage() {
  // Founder directive 2026-10-20: this page is hand-curated only. It features
  // entries from CURATED_DESTINATIONS (founder-verified, visitor-ready) and
  // never auto-populates from the database. While the curated list is empty,
  // the page shows the on-brand discovery notice instead of any leaderboard.
  const destinations = CURATED_DESTINATIONS;

  return (
    <div>
      <PageHero
        title="Discovery, done honestly."
        description="This space is becoming a hand-curated collection. Every destination will be verified and visitor-ready before it appears here, and every number you see will come from real visits — nothing seeded, nothing inflated."
        eyebrow="Discover"
      />
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 sm:pt-10">
        {destinations.length === 0 ? (
          <div className="gh-prism-border relative overflow-hidden p-8 text-center sm:p-12">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 0%, var(--theme-wash), transparent 65%), radial-gradient(ellipse 50% 40% at 80% 100%, var(--theme-wash-2), transparent 55%)",
              }}
            />
            <div className="relative">
              <p className="gh-theme-chip mx-auto w-fit">Curated discovery</p>
              <h2 className="mt-5 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
                The discovery floor is being polished.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
                We&rsquo;re rebuilding Trending as a hand-curated collection:
                real destinations, checked by a human before they&rsquo;re
                featured, with counts that only ever reflect genuine visits.
                Come back soon — the sparkle is worth the wait.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/browse" className="gh-btn gh-btn-primary">
                  Browse the directory
                </Link>
                <Link href="/signup" className="gh-btn gh-btn-ghost">
                  Join free
                </Link>
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                No vanity counts · No seeded popularity · Ever
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((site, i) => (
              <WebsiteCard
                key={site.url}
                title={site.title}
                url={site.url}
                description={site.description}
                categoryName={site.category}
                badges={[`# ${i + 1}`, "Founder verified"]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
