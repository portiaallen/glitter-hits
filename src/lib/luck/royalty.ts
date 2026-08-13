import { prisma } from "@/lib/db";

export async function getGlitterRoyalty(limit = 8) {
  const categories = await prisma.royaltyCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const boards = [];
  for (const cat of categories) {
    let leaders: { id: string; name: string | null; value: number; meta?: string }[] = [];

    if (cat.metric === "luck") {
      const rows = await prisma.user.findMany({
        where: { isSuspended: false },
        orderBy: { luckPoints: "desc" },
        take: limit,
        select: { id: true, name: true, luckPoints: true, luckLevelSlug: true },
      });
      leaders = rows.map((r) => ({
        id: r.id,
        name: r.name,
        value: r.luckPoints,
        meta: r.luckLevelSlug,
      }));
    } else if (cat.metric === "streak") {
      const rows = await prisma.user.findMany({
        where: { isSuspended: false },
        orderBy: { streakDays: "desc" },
        take: limit,
        select: { id: true, name: true, streakDays: true },
      });
      leaders = rows.map((r) => ({
        id: r.id,
        name: r.name,
        value: r.streakDays,
      }));
    } else if (cat.metric === "referrals") {
      const rows = await prisma.referralEvent.groupBy({
        by: ["referrerId"],
        where: { status: { in: ["activated", "qualified"] } },
        _count: { _all: true },
        orderBy: { _count: { referrerId: "desc" } },
        take: limit,
      });
      const users = await prisma.user.findMany({
        where: { id: { in: rows.map((r) => r.referrerId) } },
        select: { id: true, name: true },
      });
      const map = new Map(users.map((u) => [u.id, u.name]));
      leaders = rows.map((r) => ({
        id: r.referrerId,
        name: map.get(r.referrerId) ?? null,
        value: r._count._all,
      }));
    } else if (cat.metric === "visits_given" || cat.metric === "surfs") {
      const rows = await prisma.visit.groupBy({
        by: ["visitorUserId"],
        where: { completed: true, visitorUserId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { visitorUserId: "desc" } },
        take: limit,
      });
      const ids = rows.map((r) => r.visitorUserId!).filter(Boolean);
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      const map = new Map(users.map((u) => [u.id, u.name]));
      leaders = rows.map((r) => ({
        id: r.visitorUserId!,
        name: map.get(r.visitorUserId!) ?? null,
        value: r._count._all,
      }));
    } else if (cat.metric === "visits_received") {
      const rows = await prisma.visit.groupBy({
        by: ["ownerUserId"],
        where: { completed: true },
        _count: { _all: true },
        orderBy: { _count: { ownerUserId: "desc" } },
        take: limit,
      });
      const users = await prisma.user.findMany({
        where: { id: { in: rows.map((r) => r.ownerUserId) } },
        select: { id: true, name: true },
      });
      const map = new Map(users.map((u) => [u.id, u.name]));
      leaders = rows.map((r) => ({
        id: r.ownerUserId,
        name: map.get(r.ownerUserId) ?? null,
        value: r._count._all,
      }));
    }

    boards.push({ category: cat, leaders });
  }

  return boards;
}

export async function listPersonas(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const personas = await prisma.persona.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return personas.map((p) => ({
    ...p,
    unlocked: user.luckPoints >= p.unlockLuckMin,
    selected: user.personaId === p.id,
  }));
}

export async function selectPersona(userId: string, personaId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const persona = await prisma.persona.findFirst({
    where: { id: personaId, isActive: true },
  });
  if (!persona) throw new Error("Persona not found.");
  if (user.luckPoints < persona.unlockLuckMin) {
    throw new Error(`Requires ${persona.unlockLuckMin} Luck to unlock.`);
  }
  return prisma.user.update({
    where: { id: userId },
    data: { personaId: persona.id },
  });
}
