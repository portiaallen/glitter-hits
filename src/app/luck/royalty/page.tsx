import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { getGlitterRoyalty } from "@/lib/luck/royalty";

export const metadata: Metadata = { title: "Glitter Royalty" };

export default async function RoyaltyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const boards = await getGlitterRoyalty(6);

  return (
    <AppShell
      title="👑 Glitter Royalty"
      subtitle="Celebrate different kinds of participation — not just who spent the most."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {boards.map(({ category, leaders }) => (
          <section key={category.id} className="gh-glass p-5">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
              {category.icon} {category.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{category.description}</p>
            <ol className="mt-4 space-y-2 text-sm">
              {leaders.length === 0 && (
                <li className="text-[var(--text-muted)]">No royalty yet.</li>
              )}
              {leaders.map((l, i) => (
                <li key={l.id} className="flex justify-between gap-3 border-b border-[var(--border-glass)] pb-2">
                  <span>
                    #{i + 1} {l.name || "Anonymous"}
                    {l.meta ? ` · ${l.meta}` : ""}
                  </span>
                  <span className="text-[var(--neon-gold)]">{l.value}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
