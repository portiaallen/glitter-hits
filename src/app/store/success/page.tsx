import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { fulfillCheckoutSessionById } from "@/lib/stripe";

export const metadata: Metadata = { title: "Purchase complete" };

export default async function StoreSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; kind?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const sessionId = params.session_id;
  let message = "Thanks — your purchase is processing.";
  let ok = false;

  if (sessionId) {
    const result = await fulfillCheckoutSessionById(sessionId, session.user.id);
    ok = result.ok;
    message = result.ok
      ? params.kind === "membership"
        ? "Membership unlocked. Welcome to the next tier."
        : "Glitter Hits credited to your balance."
      : result.error || message;
  }

  return (
    <AppShell title="Store" subtitle="Checkout result">
      <div className="gh-glass mx-auto max-w-lg space-y-4 p-6 text-center">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-semibold">
          {ok ? "You're set" : "Almost there"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/store" className="gh-btn gh-btn-primary text-sm">
            Back to Store
          </Link>
          <Link href="/credits" className="gh-btn gh-btn-ghost text-sm">
            View credits
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
