import { prisma } from "@/lib/db";

export default async function AdminSitesPage() {
  const sites = await prisma.website.findMany({
    include: { user: { select: { email: true, name: true } }, category: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-3">
      {sites.map((site) => (
        <div key={site.id} className="gh-glass p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{site.title}</h2>
              <p className="text-sm text-[var(--neon-cyan)]">{site.url}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Owner: {site.user.name || site.user.email}
                {site.category ? ` · ${site.category.name}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="gh-badge">{site.moderationStatus}</span>
              {site.isQueerdomPick && <span className="gh-badge">Queerdom</span>}
              {site.isFeatured && <span className="gh-badge">Featured</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
