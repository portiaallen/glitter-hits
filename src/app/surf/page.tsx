import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { SurfConsole } from "@/components/surf/SurfConsole";
import { getActiveMonthlyTheme } from "@/lib/experience/monthly-theme";

export const metadata: Metadata = { title: "Explore the Hits" };

export default async function SurfPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const theme = await getActiveMonthlyTheme();

  return (
    <AppShell
      title="Explore the Hits"
      subtitle={`${theme.discoveryLine} Watch each channel, collect Hits, get your sites seen — fair exchange, playful discovery.`}
    >
      <SurfConsole themeLine={theme.discoveryLine} />
    </AppShell>
  );
}
