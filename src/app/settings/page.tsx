import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell
      title="Settings"
      subtitle="Account preferences. Economy ratios and monetization flags live in Admin."
    >
      <div className="gh-glass max-w-xl space-y-4 p-6 text-sm text-[var(--text-muted)]">
        <p>
          Profile editing and notification preferences will expand here. Your session uses Auth.js
          credentials with an integer credit ledger.
        </p>
        <p>
          Desktop / automated viewers will authenticate against the same Surf APIs using
          <code className="mx-1 text-[var(--neon-cyan)]">viewerType: automated_viewer</code>
          — never disguised as organic traffic.
        </p>
      </div>
    </AppShell>
  );
}
