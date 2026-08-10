import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminSession } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin",
  description: "Glitter Hits network administration console.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="font-[family-name:var(--font-syne)] text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Glitter Hits
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-extrabold sm:text-4xl">
          <span className="gh-gradient-text">Admin Console</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          Manage users, sites, campaigns, economy, and the Founder Network brand directory.
        </p>
      </header>
      <AdminNav />
      {children}
    </div>
  );
}
