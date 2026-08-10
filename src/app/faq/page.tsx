import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Glitter Hits.",
};

const faqs = [
  {
    q: "What is Glitter Hits?",
    a: "A transparent traffic exchange and discovery network. You earn promotional credits by visiting sites, then spend them to promote your own.",
  },
  {
    q: "Is exchange traffic labeled?",
    a: "Yes. Visits are always exchange traffic — we never spoof Google, social, or organic referrers.",
  },
  {
    q: "Are credits whole numbers?",
    a: "Always. Glitter Hits uses integer credits only — no fractional balances.",
  },
  {
    q: "Do estimates guarantee traffic?",
    a: "No. Network snapshots and estimated daily delivery are guidance based on current capacity, not guarantees.",
  },
  {
    q: "How do referrals work?",
    a: "Share your referral code. When friends sign up and activate, you can earn bonus credits subject to anti-abuse rules.",
  },
  {
    q: "Is the free exchange enough?",
    a: "Yes for many creators. Monetization features may appear later; the free earn/spend loop remains the core product.",
  },
];

export default function FaqPage() {
  return (
    <div>
      <PageHero
        title="Questions, answered."
        description="Short answers about the earn/spend loop, transparency, and how Glitter Hits stays fair."
        eyebrow="FAQ"
      />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-14 sm:px-6">
        {faqs.map((item) => (
          <details key={item.q} className="gh-glass group p-5 open:border-pink-400/30">
            <summary className="cursor-pointer list-none font-[family-name:var(--font-syne)] text-lg font-semibold marker:content-none">
              {item.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
          </details>
        ))}
        <p className="pt-6 text-sm text-[var(--text-muted)]">
          Still stuck?{" "}
          <Link href="/contact" className="text-[var(--neon-cyan)] hover:underline">
            Contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
