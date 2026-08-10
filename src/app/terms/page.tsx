import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div>
      <PageHero
        title="Terms of use"
        description="Glitter Hits is a promotional discovery network. We do not guarantee sales, customers, conversions, or search rankings."
        eyebrow="Legal"
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-sm leading-relaxed text-[var(--text-muted)] sm:px-6">
        <p>
          By using Glitter Hits you agree to participate in good faith: no credit farming,
          no malware, no deceptive content, and no attempts to disguise exchange traffic as
          organic search, social, or direct traffic.
        </p>
        <p>
          Glitter Hits (promotional credits) are not cryptocurrency and are not Glitter Coins.
          Credits have no cash value unless a future paid redemption feature is explicitly
          enabled by administrators.
        </p>
        <p>
          We may suspend campaigns or accounts that violate moderation policies, abuse
          referrals, or attempt to manipulate analytics.
        </p>
        <p>Contact the platform operators for questions about these terms.</p>
      </div>
    </div>
  );
}
