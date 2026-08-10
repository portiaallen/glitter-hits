import { prisma } from "@/lib/db";
import { formatCredits } from "@/lib/utils";

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      website: true,
      user: { select: { email: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <div key={c.id} className="gh-glass p-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="font-semibold">{c.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">
                {c.website.title} · {c.user.name || c.user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="gh-badge">{c.status}</span>
              <span className="gh-badge">{c.priority}</span>
              <span className="gh-badge">{formatCredits(c.creditBalance)} credits</span>
              <span className="gh-badge">{c.visitsDelivered} visits</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
