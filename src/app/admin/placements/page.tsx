import { prisma } from "@/lib/db";
import { expireDuePlacements } from "@/lib/placements/service";
import { PlacementAdminControls } from "@/components/admin/PlacementAdminControls";

export default async function AdminPlacementsPage() {
  await expireDuePlacements();
  const placements = await prisma.featuredPlacement.findMany({
    include: { website: { select: { title: true, url: true, userId: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Member-purchased and seeded promotional inventory. Expire dates auto-pause delivery.
      </p>
      <div className="gh-glass overflow-x-auto p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[var(--text-muted)]">
            <tr>
              <th className="p-2">Placement</th>
              <th className="p-2">Type</th>
              <th className="p-2">Status</th>
              <th className="p-2">Cost</th>
              <th className="p-2">Ends</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="p-2">
                  <div>{p.title || p.website?.title || "Untitled"}</div>
                  <div className="text-xs text-white/40">{p.website?.url}</div>
                </td>
                <td className="p-2">{p.type}</td>
                <td className="p-2">{p.status}</td>
                <td className="p-2">{p.creditCost}</td>
                <td className="p-2 text-xs">
                  {p.endAt ? p.endAt.toISOString().slice(0, 10) : "—"}
                </td>
                <td className="p-2">
                  <PlacementAdminControls id={p.id} status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
