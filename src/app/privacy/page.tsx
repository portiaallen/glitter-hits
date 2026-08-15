import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div>
      <PageHero
        title="Privacy"
        description="We collect account, session, and delivery signals needed to run a fair exchange — not to fabricate fake popularity."
        eyebrow="Legal"
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-sm leading-relaxed text-[var(--text-muted)] sm:px-6">
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-amber-100">
          Launch draft — have counsel review before treating as final. Last updated: August 12, 2026.
        </p>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            1. What we collect
          </h2>
          <p>
            Account data: email, display name, hashed password, membership/role flags, referral
            codes, and profile fields you choose to provide. Exchange data: websites, campaigns,
            surf sessions, visits, credit ledger entries, Luck Engine progress, mail/placement
            purchases, and moderation reports. Contact form submissions and support email.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            2. Technical &amp; anti-abuse signals
          </h2>
          <p>
            We may store hashed IP addresses, hashed user-agent strings, coarse device/geo hints,
            rate-limit counters, and bot-protection tokens (e.g. Cloudflare Turnstile) to prevent
            farming and keep delivery fair. We do not use these signals to spoof traffic sources.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            3. How we use data
          </h2>
          <p>
            Operate the exchange, authenticate users, send transactional email (password reset,
            support), moderate inventory, enforce economy rules, provide analytics labeled as
            exchange traffic, and improve reliability and safety.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            4. Sharing
          </h2>
          <p>
            We use processors such as hosting (e.g. Vercel), database (e.g. Neon), email (e.g.
            Resend), and bot protection (e.g. Cloudflare) under their respective terms. We do not
            sell personal data. We may disclose information if required by law or to protect the
            platform and members from abuse.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            5. Retention
          </h2>
          <p>
            Account and ledger data are retained while your account is active and for a reasonable
            period afterward for abuse investigation, bookkeeping of credits, and legal compliance.
            You may request account closure via support.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            6. Your choices
          </h2>
          <p>
            Update profile fields in-app, change your password, and contact us to correct or delete
            account data where applicable law requires. Some ledger and moderation records may be
            retained in anonymized or limited form when needed for integrity of the exchange.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            7. Children
          </h2>
          <p>
            Glitter Hits is not directed at children under 16 (or the age of digital consent in
            your region). Do not create an account if you are under that age.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white">
            8. Contact
          </h2>
          <p>
            Privacy questions:{" "}
            <a href="mailto:hello@glitterhits.online" className="text-[var(--neon-cyan)] hover:underline">
              hello@glitterhits.online
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
