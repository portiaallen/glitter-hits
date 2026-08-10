import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ChangePasswordForm } from "@/components/profile/ProfileForms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
            Desktop / automated viewers use the same Surf APIs with{" "}
            <code className="text-[var(--neon-cyan)]">viewerType: automated_viewer</code> —
            never disguised as organic traffic.
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
      </div>
    </AppShell>
  );
}
