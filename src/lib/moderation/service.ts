import { prisma } from "@/lib/db";
import type { ModerationStatus } from "@prisma/client";
import { notifyUser } from "@/lib/notifications/service";

export async function setWebsiteModeration(params: {
  websiteId: string;
  status: ModerationStatus;
  notes?: string;
  actorId: string;
  queerdomPick?: boolean;
  featured?: boolean;
}) {
  const website = await prisma.website.update({
    where: { id: params.websiteId },
    data: {
      moderationStatus: params.status,
      moderationNotes: params.notes,
      isQueerdomPick: params.queerdomPick ?? undefined,
      isFeatured: params.featured ?? undefined,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: params.actorId,
      action: `website.moderation.${params.status}`,
      targetType: "website",
      targetId: params.websiteId,
      detailsJson: JSON.stringify({ notes: params.notes, queerdomPick: params.queerdomPick }),
    },
  });

  if (params.status === "approved") {
    await notifyUser({
      userId: website.userId,
      type: "site_approved",
      title: "Website approved",
      body: `"${website.title}" is live for Surf discovery.`,
      href: "/websites",
    });
  } else if (params.status === "rejected") {
    await notifyUser({
      userId: website.userId,
      type: "site_rejected",
      title: "Website needs changes",
      body: params.notes?.trim()
        ? `"${website.title}" was rejected: ${params.notes}`
        : `"${website.title}" was rejected. Update and resubmit.`,
      href: "/websites",
    });
  } else if (params.status === "suspended" || params.status === "blocked") {
    await notifyUser({
      userId: website.userId,
      type: "site_suspended",
      title: "Website moderation update",
      body: `"${website.title}" is now ${params.status}.`,
      href: "/websites",
    });
  }

  return website;
}

export async function reportWebsite(params: {
  websiteId: string;
  reporterId: string;
  reason: string;
  details?: string;
}) {
  const report = await prisma.siteReport.create({
    data: {
      websiteId: params.websiteId,
      reporterId: params.reporterId,
      reason: params.reason,
      details: params.details,
    },
  });
  await prisma.website.update({
    where: { id: params.websiteId },
    data: { reportCount: { increment: 1 } },
  });
  return report;
}

export async function listModerationQueue() {
  const [pendingSites, openReports] = await Promise.all([
    prisma.website.findMany({
      where: { moderationStatus: { in: ["pending", "suspended"] } },
      include: { user: { select: { id: true, email: true, name: true } }, category: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.siteReport.findMany({
      where: { status: "open" },
      include: {
        website: true,
        reporter: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);
  return { pendingSites, openReports };
}
