import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ChangePasswordForm } from "@/components/profile/ProfileForms";
import { MarketingEmailPrefs } from "@/components/profile/MarketingEmailPrefs";
import { getMarketingConsent, MARKETING_CONSENT_COPY } from "@/lib/marketing-consent";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const consent = await getMarketingConsent(session.user.id);
  const lastEntry = consent.entries[consent.entries.length - 1] ?? null;

  return (
    <AppShell
      title="Settings"
      subtitle="Account security and preferences. Economy ratios live in Admin."
    >
      <div className="grid max-w-3xl gap-4 lg:grid-cols-2">
        <div className="gh-glass space-y-3 p-6 text-sm text-[var(--text-muted)]">
          <p>
            Update your public profile from{" "}
            <Link href="/profile" className="text-[var(--neon-cyan)]">
              Profile
            </Link>
            . Password changes apply immediately to future logins.
          </p>
          <p>
            Surf sessions are human exchange traffic, always labeled honestly — never disguised as
            organic, search, or social.
          </p>
          <p>
            Forgot your password while logged out? Use{" "}
            <Link href="/forgot-password" className="text-[var(--neon-cyan)]">
              password reset
            </Link>
            .
          </p>
        </div>
        <ChangePasswordForm />
        <MarketingEmailPrefs
          optedIn={consent.current === "opted-in"}
          lastAt={lastEntry?.at ?? null}
          copy={MARKETING_CONSENT_COPY}
        />
      </div>
    </AppShell>
  );
}
