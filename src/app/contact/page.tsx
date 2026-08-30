import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Glitter Hits team.",
};

export default function ContactPage() {
  const email = "hello@glitterhits.gay";

  return (
    <div>
      <PageHero
        title="Say hello."
        description="Partnerships, support, moderation appeals, or press — we read every note."
        eyebrow="Contact"
      />
      <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <div className="gh-glass p-6 sm:p-8">
          <p className="text-sm text-[var(--text-muted)]">
            Prefer email? Reach us at{" "}
            <a href={`mailto:${email}`} className="text-[var(--neon-cyan)] hover:underline">
              {email}
            </a>
            . For product ideas, bugs, and theme suggestions, use{" "}
            <a href="/feedback" className="text-[var(--neon-cyan)] hover:underline">
              Tell Glitter Hits
            </a>
            .
          </p>
          <div className="mt-8">
            <FeedbackForm defaultCategory="contact" />
          </div>
        </div>
      </section>
    </div>
  );
}
