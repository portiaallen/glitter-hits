import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { FoundingCounter } from "@/components/founding/FoundingCounter";
import { getFoundingStatus } from "@/lib/founding";

export const metadata: Metadata = {
  title: "The Founding 500",
  description:
    "The first 500 Glitter Traffic members claim the Founding Free Member package: 500 bonus Hits, a permanent founding badge, and early access to everything new.",
};

const perks = [
  {
    step: "01",
    title: "500 bonus Hits, day one",
    body: "Join while founding spots are open and 500 bonus Glitter Traffic land in your balance the moment you sign up, on top of the standard welcome bonus.",
  },
  {
    step: "02",
    title: "Your spot number, forever",
    body: "Founding members keep a permanent Founding Member badge with their join number. It stays on your profile even after the 500 close.",
  },
  {
    step: "03",
    title: "Early access to everything new",
    body: "Network Mail, contests, and every feature we ship lands in founding members' hands first.",
  },
  {
    step: "04",
    title: "Free stays free",
    body: "Your membership is free and stays free. Founding status is earned by showing up early, and it can't be bought later.",
  },
];

export default async function FoundingPage() {
  const status = await getFoundingStatus();

  return (
    <div>
      <PageHero
        eyebrow="Limited founding window"
        title="The first 500 members get the Founding Free Member package. After that, it never exists again."
        description="Glitter Traffic is free for everyone. The Founding 500 is the layer on top: the people who believed early get the best version of the deal, permanently."
      />

      <section className="relative overflow-hidden py-12">
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, var(--theme-wash), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <FoundingCounter initial={status} />

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {perks.map((perk) => (
              <article key={perk.step} className="gh-glass rounded-3xl p-6">
                <p className="gh-gradient-text font-[family-name:var(--font-syne)] text-3xl font-extrabold">
                  {perk.step}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-syne)] text-lg font-semibold text-[var(--text)]">
                  {perk.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{perk.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {status.open ? (
              <Link href="/signup" className="gh-btn gh-btn-primary text-base">
                Claim your founding spot
              </Link>
            ) : (
              <Link href="/signup" className="gh-btn gh-btn-primary text-base">
                Join the wait
              </Link>
            )}
            <Link href="/how-it-works" className="gh-btn gh-btn-ghost text-base">
              See how it works
            </Link>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-[var(--text-muted)]">
            <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-[var(--text)]">
              Founding member PK coupon — offer terms
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>10% off one qualifying PK Business Services invoice.</li>
              <li>One redemption per member, ever. Nontransferable. No stacking with other offers.</li>
              <li>For subscription services, the discount applies to the first invoice only.</li>
              <li>
                Excluded: the $99 Business &amp; Tax Season Readiness Assessment and all tax
                preparation services.
              </li>
              <li>Lifetime eligibility requires the account to stay in good standing.</li>
              <li>
                Codes are unique and member-specific, issued in your dashboard with your founding
                welcome — never a shared public promo code.
              </li>
              <li>
                Founding membership and the coupon never depend on the optional marketing email
                choice. Your spot and your discount are yours either way.
              </li>
            </ul>
          </div>

          <p className="mx-auto mt-12 max-w-xl text-center text-sm text-[var(--text-muted)]">
            Running a business too? PK Business Services keeps books and taxes ready.
            Start with the{" "}
            <a
              href="https://pkservices.business/assessment"
              className="underline decoration-dotted underline-offset-4"
            >
              $99 Readiness Assessment
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
