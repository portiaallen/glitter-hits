import { prisma } from "@/lib/db";
import { BrandEditor } from "@/components/admin/BrandEditor";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="gh-glass p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
          Brand Directory
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Founder Network properties are admin-managed records — add Glitter Casino,
          VentureMap, and future ventures without code changes.
        </p>
      </div>
      <BrandEditor />
      <div className="space-y-3">
        {brands.map((b) => (
          <div key={b.id} className="gh-glass p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{b.name}</h3>
                <p className="text-sm text-[var(--neon-cyan)]">{b.url}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{b.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="gh-badge">{b.network}</span>
                <span className="gh-badge">{b.isEnabled ? "enabled" : "disabled"}</span>
                {b.isFeatured && <span className="gh-badge">featured</span>}
                <span className="gh-badge">#{b.sortOrder}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
