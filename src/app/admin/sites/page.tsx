import { prisma } from "@/lib/db";
import { isAdminRole, requireStaffSession } from "@/lib/admin";
import { ModerationControls } from "@/components/admin/ModerationControls";

export default async function AdminSitesPage() {
  const session = await requireStaffSession();
  const canDelete = isAdminRole(session.user.role);
  const sites = await prisma.website.findMany({
    include: {
      user: { select: { email: true, name: true } },
      category: true,
      _count: { select: { campaigns: true, reports: true, placements: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Sites</h2>
      {sites.length === 0 && <p className="text-sm text-[var(--text-muted)]">No sites to review.</p>}
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
          <div className="mt-3">
            <ModerationControls
              websiteId={site.id}
              deleteAccess={canDelete
                ? (site._count.campaigns || site._count.reports || site._count.placements ? "history" : "allowed")
                : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
