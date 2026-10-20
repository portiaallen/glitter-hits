import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Unsubscribed" };

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const invalid = params.status === "invalid";
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-semibold text-[var(--text)]">
        {invalid ? "That link didn't work" : "You're unsubscribed"}
      </h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        {invalid
          ? "The unsubscribe link looks broken or expired. You can turn marketing email off anytime in Settings, or reply to any email and we'll handle it."
          : "You're off every marketing list across Glitter Traffic, Glitter Universe, and PK Business Services. Transactional email (password resets, support) still works. Changed your mind? Turn marketing back on anytime in Settings."}
      </p>
      <Link href="/settings" className="gh-btn gh-btn-primary mt-6 inline-block">
        Open Settings
      </Link>
    </div>
  );
}
