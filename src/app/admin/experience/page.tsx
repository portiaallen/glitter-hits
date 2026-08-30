import type { Metadata } from "next";
import {
  MONTHLY_THEMES,
  getActiveMonthlyTheme,
} from "@/lib/experience/monthly-theme";
import { countActiveGiftPool } from "@/lib/experience/surprise-gift";
import { MonthlyThemeAdminForm } from "@/components/admin/MonthlyThemeAdminForm";
import { SurpriseGiftAdminForm } from "@/components/admin/SurpriseGiftAdminForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Experience" };

export default async function AdminExperiencePage() {
  const [active, poolSize, recentGifts] = await Promise.all([
    getActiveMonthlyTheme(),
    countActiveGiftPool(),
    prisma.adminAuditLog.findMany({
      where: { action: "experience.surprise_gift" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
          Experience
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Volume 111 controls — monthly themes, surprise gifts, and discovery personality.
          Current live theme: <strong className="text-[var(--text)]">{active.name}</strong>.
        </p>
      </header>

      <SurpriseGiftAdminForm poolSize={poolSize} />

      {recentGifts.length > 0 ? (
        <section className="gh-glass p-5">
          <h3 className="font-semibold">Recent surprise gifts</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            {recentGifts.map((g) => {
              let details: {
                hits?: number;
                spins?: number;
                winnerName?: string;
                reason?: string;
              } = {};
              try {
                details = JSON.parse(g.detailsJson) as typeof details;
              } catch {
                /* ignore */
              }
              return (
                <li key={g.id}>
                  <span className="text-[var(--text)]">
                    {details.winnerName || g.targetId}
                  </span>
                  {" · "}
                  {details.hits ?? "?"} Hits
                  {details.spins ? ` + ${details.spins} spin(s)` : ""}
                  {details.reason ? ` · ${details.reason}` : ""}
                  {" · "}
                  {g.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <MonthlyThemeAdminForm themes={MONTHLY_THEMES} activeSlug={active.slug} />
    </div>
  );
}
