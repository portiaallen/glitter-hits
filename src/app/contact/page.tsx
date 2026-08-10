import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Glitter Hits team.",
};

export default function ContactPage() {
  const email = "hello@glitterhits.com";

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
            .
          </p>
          <form
            className="mt-8 space-y-5"
            action={`mailto:${email}`}
            method="post"
            encType="text/plain"
          >
            <div>
              <label htmlFor="name" className="gh-label">
                Name
              </label>
              <input id="name" name="name" required className="gh-input" placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="reply" className="gh-label">
                Reply email
              </label>
              <input
                id="reply"
                name="reply"
                type="email"
                required
                className="gh-input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="body" className="gh-label">
                Message
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={5}
                className="gh-input resize-y"
                placeholder="How can we help?"
              />
            </div>
            <button type="submit" className="gh-btn gh-btn-primary w-full">
              Open email draft
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
