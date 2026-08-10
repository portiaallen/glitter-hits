import { listModerationQueue } from "@/lib/moderation/service";
import { ModerationControls } from "@/components/admin/ModerationControls";

export default async function AdminModerationPage() {
  const { pendingSites, openReports } = await listModerationQueue();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-[family-name:var(--font-syne)] text-xl font-semibold">
          Pending / suspended sites
        </h2>
        <div className="space-y-3">
          {pendingSites.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">Queue clear.</p>
          )}
          {pendingSites.map((site) => (
            <div key={site.id} className="gh-glass p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{site.title}</h3>
                  <p className="text-sm text-[var(--neon-cyan)]">{site.url}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {site.user.email} · {site.moderationStatus}
                    {site.moderationNotes ? ` · ${site.moderationNotes}` : ""}
                  </p>
                </div>
                <ModerationControls websiteId={site.id} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-syne)] text-xl font-semibold">
          Open reports
        </h2>
        <div className="space-y-3">
          {openReports.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No open reports.</p>
          )}
          {openReports.map((r) => (
            <div key={r.id} className="gh-glass p-4 text-sm">
              <p className="font-semibold">{r.website.title}</p>
              <p className="text-[var(--text-muted)]">
                {r.reason} — {r.details}
              </p>
              <p className="mt-1 text-xs text-white/40">
                Reporter: {r.reporter.email}
              </p>
              <div className="mt-3">
                <ModerationControls websiteId={r.websiteId} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
