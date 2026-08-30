import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Tell Glitter Hits",
  description: "Help us make Glitter Hits more fun, clearer, and weirder in the best way.",
};

export default async function FeedbackPage() {
  const session = await auth();
  let name = "";
  let email = "";
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    name = user?.name || "";
    email = user?.email || "";
  }

  return (
    <div>
      <PageHero
        title="Help us make Glitter Hits better."
        description="What you love, what you hate, what is confusing, what games you want, and what bizarre monthly theme we should try next."
        eyebrow="Tell Glitter Hits"
      />
      <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <div className="gh-glass p-6 sm:p-8">
          <FeedbackForm
            defaultCategory="suggestion"
            defaultName={name}
            defaultEmail={email}
          />
        </div>
      </section>
    </div>
  );
}
