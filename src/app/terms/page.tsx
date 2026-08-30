import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div>
      <PageHero
        title="Terms of use"
        description="Glitter Hits is a promotional discovery network. We do not guarantee sales, customers, conversions, or search rankings."
        eyebrow="Legal"
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-sm leading-relaxed text-[var(--text-muted)] sm:px-6">
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-amber-100">
          Launch draft — have counsel review before treating as final. Last updated: August 12, 2026.
        </p>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            1. The service
          </h2>
          <p>
            Glitter Hits (“we”, “us”) operates a credit-based traffic exchange and discovery
            platform. Members surf approved websites to earn integer promotional credits called
            Glitter Hits, and spend those credits to promote their own approved websites. Luck
            Engine features (quests, wheel, drops, challenges, royalty) are optional gamification
            layered on the exchange.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            2. Accounts
          </h2>
          <p>
            You must provide accurate registration information, keep credentials secure, and be
            responsible for activity under your account. We may suspend or terminate accounts that
            violate these terms, abuse referrals, farm credits, or threaten platform integrity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            3. Credits are not money or crypto
          </h2>
          <p>
            Glitter Hits credits are promotional units for use inside the platform. They are not
            cryptocurrency, not Glitter Coins, and have no cash value unless a future paid
            redemption feature is explicitly enabled by administrators. Credits may be adjusted for
            abuse, errors, or economy changes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            4. Honest traffic labeling
          </h2>
          <p>
            Exchange visits are labeled as Glitter Hits exchange traffic. You may not disguise,
            spoof, or instruct others to present exchange traffic as organic search, social,
            direct, or paid ads traffic. Automated viewing tools, if ever offered, must use the
            same honest labeling.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            5. Acceptable use
          </h2>
          <p>
            No malware, phishing, scams, illegal content, hate that targets protected classes
            beyond the platform’s moderated queer-safe community standards, credit farming,
            multi-accounting to game rewards, or attempts to bypass rate limits and moderation.
            Websites submitted for Surf inventory are subject to human moderation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            6. No performance guarantees
          </h2>
          <p>
            We do not guarantee delivery volume, timing, conversions, rankings, or revenue.
            Network availability varies with active campaigns and members online. Estimates shown
            in-product are informational only.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            7. Paid features
          </h2>
          <p>
            Optional paid packs, memberships, placements, or mail upgrades (when enabled) are
            described at purchase time. Refunds follow the policy stated at checkout or in support
            correspondence. Third-party payment processors may apply their own terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            8. Intellectual property &amp; brands
          </h2>
          <p>
            You retain rights to content you submit. You grant us a license to display titles,
            descriptions, and URLs as needed to run Surf, directory, and promotions. Founder
            Network and Queerdom Picks listings are curated and may be removed at our discretion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            9. Disclaimers &amp; limitation
          </h2>
          <p>
            The service is provided “as is.” To the fullest extent permitted by law, we disclaim
            warranties of merchantability, fitness for a particular purpose, and non-infringement,
            and limit liability for indirect or consequential damages arising from use of the
            platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
            10. Contact
          </h2>
          <p>
            Questions about these terms:{" "}
            <a href="mailto:hello@glitterhits.online" className="text-[var(--neon-cyan)] hover:underline">
              hello@glitterhits.online
            </a>{" "}
            or the in-app Contact form.
          </p>
        </section>
      </div>
    </div>
  );
}
