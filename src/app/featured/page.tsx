import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";
import { WebsiteCard } from "@/components/sites/WebsiteCard";

export const metadata: Metadata = {
  title: "Featured",
  description: "Featured websites and active promotional placements on Glitter Hits.",
};

export default async function FeaturedPage() {
  const [featuredSites, placements] = await Promise.all([
    prisma.website.findMany({
      where: { moderationStatus: "approved", isFeatured: true },
      include: { category: true },
      orderBy: [{ discoverCount: "desc" }, { title: "asc" }],
    }),
    prisma.featuredPlacement.findMany({
      where: { status: "active" },
      include: { website: { include: { category: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div>
      <PageHero
        title="Spotlight inventory."
        description="Curated featured sites plus active FeaturedPlacement slots — premium promotion, honestly labeled."
        eyebrow="Featured"
      />

      <section className="mx-auto max-w-7xl space-y-14 px-4 py-14 sm:px-6">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Featured sites
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Approved websites marked as featured by the network.
          </p>
          {featuredSites.length === 0 ? (
            <p className="mt-6 gh-glass p-6 text-[var(--text-muted)]">No featured sites yet.</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredSites.map((site) => (
                <WebsiteCard
                  key={site.id}
                  title={site.title}
                  url={site.url}
                  description={site.description}
                  categoryName={site.category?.name}
                  categorySlug={site.category?.slug}
                  discoverCount={site.discoverCount}
                  badges={["Featured"]}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Active placements
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Live promotional inventory across spotlights, banners, and sponsored discovery.
          </p>
          {placements.length === 0 ? (
            <p className="mt-6 gh-glass p-6 text-[var(--text-muted)]">
              No active placements right now.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {placements.map((p) => {
                const href = p.targetUrl || p.website?.url || "#";
                const title = p.title || p.website?.title || "Placement";
                return (
                  <a
                    key={p.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-glass block p-5 transition hover:border-pink-400/40"
                  >
                    <span className="gh-badge mb-3">{p.type.replaceAll("_", " ")}</span>
                    <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                      {title}
                    </h3>
                    {p.body && (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">{p.body}</p>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
