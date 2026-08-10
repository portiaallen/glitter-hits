import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "Founder Network",
  description: "Founder Network brands on Glitter Hits — ventures growing with the Queerdom.",
};

export default async function FounderNetworkPage() {
  const brands = await prisma.brand.findMany({
    where: { network: "founder", isEnabled: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHero
        title="Brands from the founders."
        description="Admin-managed Founder Network ventures — grow with every new project without rewriting the platform."
        eyebrow="Founder Network"
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {brands.length === 0 ? (
          <p className="gh-glass p-8 text-center text-[var(--text-muted)]">
            Founder brands will appear here as they launch.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <li key={brand.id}>
                <a
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gh-glass block h-full p-6 transition hover:border-cyan-400/35"
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="gh-badge">Founder</span>
                    {brand.isFeatured && <span className="gh-badge">Featured</span>}
                    {brand.category && <span className="gh-badge">{brand.category}</span>}
                  </div>
                  <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                    {brand.name}
                  </h2>
                  {brand.description && (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                      {brand.description}
                    </p>
                  )}
                  <p className="mt-4 text-sm text-[var(--neon-cyan)]">Visit →</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
