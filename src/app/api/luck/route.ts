import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/anti-abuse/rate-limit";
import { getLuckStatus, listRecentRewardEvents } from "@/lib/luck/engine";
import { claimGlitterDrop, getPendingDrop } from "@/lib/luck/drops";
import { getWheelState, spinWheel } from "@/lib/luck/wheel";
import { listUserQuests, claimQuest } from "@/lib/luck/quests";
import { listActiveChallenges } from "@/lib/luck/challenges";
import { getGlitterRoyalty, listPersonas, selectPersona } from "@/lib/luck/royalty";
import { getLuckEngineConfig } from "@/lib/luck/config";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const view = new URL(req.url).searchParams.get("view") || "status";
  const userId = session.user.id;

  if (view === "status") {
    const [status, pendingDrop, events, quests, challenges, config] = await Promise.all([
      getLuckStatus(userId),
      getPendingDrop(userId),
      listRecentRewardEvents(userId, 12),
      listUserQuests(userId),
      listActiveChallenges(),
      getLuckEngineConfig(),
    ]);
    return NextResponse.json({
      status,
      pendingDrop,
      events,
      quests: quests.slice(0, 8),
      challenges,
      mantra: config.mantra,
    });
  }
  if (view === "wheel") return NextResponse.json(await getWheelState(userId));
  if (view === "quests") return NextResponse.json({ quests: await listUserQuests(userId) });
  if (view === "challenges") {
    return NextResponse.json({ challenges: await listActiveChallenges() });
  }
  if (view === "royalty") return NextResponse.json({ boards: await getGlitterRoyalty() });
  if (view === "personas") return NextResponse.json({ personas: await listPersonas(userId) });

  return NextResponse.json({ error: "Unknown view" }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit({
    key: clientKey(req, `luck:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "claim_drop") {
      const drop = await claimGlitterDrop(session.user.id, String(body.dropId ?? ""));
      return NextResponse.json({ ok: true, drop });
    }
    if (body.action === "spin_wheel") {
      const result = await spinWheel(session.user.id, String(body.clientKey ?? ""));
      return NextResponse.json(result);
    }
    if (body.action === "claim_quest") {
      const quest = await claimQuest(session.user.id, String(body.userQuestId ?? ""));
      return NextResponse.json({ ok: true, quest });
    }
    if (body.action === "select_persona") {
      await selectPersona(session.user.id, String(body.personaId ?? ""));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
