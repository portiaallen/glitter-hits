import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { PersonaPicker } from "@/components/luck/PersonaPicker";
import { listPersonas } from "@/lib/luck/royalty";

export const metadata: Metadata = { title: "Personas" };

export default async function PersonasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const personas = await listPersonas(session.user.id);

  return (
    <AppShell
      title="Member Personas"
      subtitle="Optional identity cosmetics for your Glitter Hits vibe — unlock with Luck."
    >
      <PersonaPicker personas={personas} />
    </AppShell>
  );
}
