import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { WheelClient } from "@/components/luck/WheelClient";
import { getWheelState } from "@/lib/luck/wheel";

export const metadata: Metadata = { title: "Glitter Wheel" };

export default async function WheelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const state = await getWheelState(session.user.id);

  return (
    <AppShell
      title="🎡 Glitter Wheel"
      subtitle="Daily spins and surf rewards. Idempotent — refreshing mid-spin won't double-pay."
    >
      {!state.enabled ? (
        <p className="gh-glass p-5 text-sm text-[var(--text-muted)]">Wheel is currently disabled.</p>
      ) : (
        <WheelClient
          spins={state.spins}
          segments={state.segments}
          history={state.history}
        />
      )}
    </AppShell>
  );
}
