import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div>
      <PageHero
        title="Privacy"
        description="We collect account, session, and delivery signals needed to run a fair exchange — not to fabricate fake popularity."
        eyebrow="Legal"
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-sm leading-relaxed text-[var(--text-muted)] sm:px-6">
        <p>
          Account data includes email, profile fields, and hashed passwords. Surf sessions may
          store hashed IP / user-agent signals and coarse device/geo hints for anti-abuse and
          targeting.
        </p>
        <p>
          Visit analytics attribute traffic as Glitter Hits exchange traffic. We do not spoof
          referrers or user agents.
        </p>
        <p>
          Administrators can access moderation queues, audit logs, and network analytics to
          operate the platform safely.
        </p>
      </div>
    </div>
  );
}
