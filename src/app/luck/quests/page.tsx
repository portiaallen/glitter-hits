import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { QuestList } from "@/components/luck/QuestList";
import { listUserQuests } from "@/lib/luck/quests";

export const metadata: Metadata = { title: "Glitter Quests" };

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const quests = await listUserQuests(session.user.id);

  return (
    <AppShell
      title="✨ Glitter Quests"
      subtitle="Turn surfing, promoting, and inviting into missions with Hits + Luck rewards."
    >
      <QuestList quests={quests} />
    </AppShell>
  );
}
