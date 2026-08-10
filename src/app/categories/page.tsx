import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { websites: true } } },
  });

  return (
    <div>
      <PageHero
        title="Browse by category"
        description="Admin-configurable categories for the discovery directory."
        eyebrow="Taxonomy"
      />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="gh-glass block p-5 transition hover:border-cyan-300/30">
            <p className="text-2xl">{c.icon}</p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-semibold">{c.name}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {c._count.websites} sites
              {c.isAdult ? " · age-gated category" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
