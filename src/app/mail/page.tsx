import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { MailComposeForm } from "@/components/mail/MailComposeForm";
import { MailInboxList } from "@/components/mail/MailInboxList";
import {
  getInbox,
  getMailEconomy,
  membershipAllowsMailTier,
} from "@/lib/mail/service";
import { prisma } from "@/lib/db";
import type { MailTier } from "@prisma/client";

export const metadata: Metadata = { title: "Mail" };

const TIERS: MailTier[] = ["standard", "boosted", "featured", "premium_solo"];

export default async function MailPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [inbox, economy, user, sent] = await Promise.all([
    getInbox(session.user.id),
    getMailEconomy(),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { membership: true, creditBalance: true },
    }),
    prisma.mailCampaign.findMany({
      where: { senderId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const unlockedTiers = TIERS.filter((t) =>
    membershipAllowsMailTier(user.membership, t),
  );

  return (
    <AppShell
      title="Network Mail"
      subtitle="Credit-priced member mailings with optional Paid Solo upgrades for featured inbox placement."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <MailComposeForm
          economy={economy}
          unlockedTiers={unlockedTiers}
          balance={user.creditBalance}
        />
        <section className="gh-glass p-5">
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-semibold">
            Inbox
          </h2>
          <MailInboxList items={inbox} />
        </section>
      </div>

      <section className="gh-glass mt-8 p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
          Sent mailings
        </h2>
        {sent.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">No mailings sent yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sent.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-glass)] pb-3 text-sm"
              >
                <div>
                  <p className="font-medium">{m.subject}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {m.tier}
                    {m.isPaidSolo ? " · paid solo" : ""} · {m.recipientCount} recipients ·{" "}
                    {m.readCount} reads
                  </p>
                </div>
                <span className="text-[var(--text-muted)]">
                  {m.creditCost + m.upgradeCreditCost} hits
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
