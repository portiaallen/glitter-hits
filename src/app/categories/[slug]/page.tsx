import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";
import { WebsiteCard } from "@/components/sites/WebsiteCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  return { title: category ? category.name : "Category" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) notFound();

  const websites = await prisma.website.findMany({
    where: { categoryId: category.id, moderationStatus: "approved" },
    include: { category: true },
    orderBy: { discoverCount: "desc" },
    take: 60,
  });

  return (
    <div>
      <PageHero
        title={category.name}
        description={category.description || `Approved sites in ${category.name}.`}
        eyebrow={`${category.icon || ""} Category`}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {websites.length === 0 ? (
          <p className="text-[var(--text-muted)]">No approved sites in this category yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((site) => (
              <WebsiteCard
                key={site.id}
                title={site.title}
                url={site.url}
                description={site.description}
                categoryName={site.category?.name}
                categorySlug={site.category?.slug}
                discoverCount={site.discoverCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
