import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";
import { WebsiteCard } from "@/components/sites/WebsiteCard";
import { SponsoredRail } from "@/components/layout/SponsoredRail";

export const metadata: Metadata = {
  title: "Browse",
  description: "Discover websites across the Glitter Hits network.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const categorySlug = params.category?.trim() || "";

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const category = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  const websites = await prisma.website.findMany({
    where: {
      moderationStatus: "approved",
      ...(category ? { categoryId: category.id } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { url: { contains: q } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { discoverCount: "desc" }],
    take: 60,
  });

  return (
    <div>
      <PageHero
        title="Website discovery directory"
        description="Search and browse approved sites. Exchange traffic is promotional discovery — never sold as organic search."
        eyebrow="Directory"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <form className="gh-glass mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="gh-label" htmlFor="q">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              className="gh-input"
              placeholder="Title, description, URL…"
            />
          </div>
          <div className="sm:w-56">
            <label className="gh-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={categorySlug}
              className="gh-input"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="gh-btn gh-btn-primary">
            Search
          </button>
        </form>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/browse" className="gh-badge hover:text-[var(--text)]">
            All
          </Link>
          {categories.slice(0, 12).map((c) => (
            <Link
              key={c.id}
              href={`/browse?category=${c.slug}`}
              className="gh-badge hover:text-[var(--text)]"
            >
              {c.icon} {c.name}
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            {websites.length === 0 ? (
              <p className="text-[var(--text-muted)]">No sites match that filter yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {websites.map((site) => (
                  <WebsiteCard
                    key={site.id}
                    title={site.title}
                    url={site.url}
                    description={site.description}
                    categoryName={site.category?.name}
                    categorySlug={site.category?.slug}
                    discoverCount={site.discoverCount}
                    badges={[
                      ...(site.isFeatured ? ["Featured"] : []),
                      ...(site.isQueerdomPick ? ["Queerdom Pick"] : []),
                    ]}
                  />
                ))}
              </div>
            )}
          </div>
          <SponsoredRail />
        </div>
      </div>
    </div>
  );
}
