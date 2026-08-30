import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { getActiveMonthlyTheme } from "@/lib/experience/monthly-theme";
import { collectiblesForTheme } from "@/lib/experience/collectibles";

export const metadata: Metadata = {
  title: "Collectibles",
  description: "Glitter pieces, sparkles, and monthly treasures — architecture for future rewards.",
};

export default async function CollectiblesPage() {
  const theme = await getActiveMonthlyTheme();
  const items = collectiblesForTheme(theme.slug);

  return (
    <div>
      <PageHero
        title="Collectibles are coming."
        description="Unique to Glitter Hits — sparkles, glitter pieces, prismatic tokens, and monthly treasures. The gallery is live; the full reward economy arrives carefully."
        eyebrow={theme.collectibleName}
      />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="mb-8 max-w-2xl text-sm text-[var(--text-muted)]">
          {theme.collectibleHint} Explore the Hits to earn traffic now — collectibles will layer on
          without changing the fair exchange.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.slug} className="gh-glass p-5">
              <p className="gh-badge">{item.kind.replaceAll("_", " ")}</p>
              <h2 className="mt-3 font-[family-name:var(--font-syne)] text-lg font-semibold">
                {item.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
              <p className="mt-3 text-xs text-[var(--text-muted)]">{item.futureRewardHint}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/surf" className="gh-btn gh-btn-primary">
            Explore the Hits
          </Link>
          <Link href="/feedback" className="gh-btn gh-btn-ghost">
            Suggest a collectible
          </Link>
        </div>
      </section>
    </div>
  );
}
