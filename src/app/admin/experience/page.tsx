import type { Metadata } from "next";
import {
  MONTHLY_THEMES,
  getActiveMonthlyTheme,
} from "@/lib/experience/monthly-theme";
import { MonthlyThemeAdminForm } from "@/components/admin/MonthlyThemeAdminForm";

export const metadata: Metadata = { title: "Experience" };

export default async function AdminExperiencePage() {
  const active = await getActiveMonthlyTheme();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
          Experience
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Volume 111 controls — monthly themes and discovery personality. Current live theme:{" "}
          <strong className="text-[var(--text)]">{active.name}</strong>.
        </p>
      </header>
      <MonthlyThemeAdminForm themes={MONTHLY_THEMES} activeSlug={active.slug} />
    </div>
  );
}
