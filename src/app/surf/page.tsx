import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { SurfConsole } from "@/components/surf/SurfConsole";

export const metadata: Metadata = { title: "Surf" };

export default async function SurfPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AppShell
      title="Surf"
      subtitle="Discover websites. Earn Glitter Hits. Keep the countdown visible — no fake organic traffic."
    >
      <SurfConsole />
    </AppShell>
  );
}
