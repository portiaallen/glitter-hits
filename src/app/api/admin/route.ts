import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { setEconomySettings, getEconomySettings } from "@/lib/settings/economy";
import { setWebsiteModeration, listModerationQueue } from "@/lib/moderation/service";
import { getAdminNetworkAnalytics } from "@/lib/analytics/service";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role as UserRole | undefined;
  if (!session?.user?.id || !role || !["admin", "founder", "moderator"].includes(role)) {
    return null;
  }
  return session.user;
}

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") || "overview";

  if (view === "overview") {
    const analytics = await getAdminNetworkAnalytics();
    const economy = await getEconomySettings();
    return NextResponse.json({ analytics, economy });
  }
  if (view === "moderation") {
    return NextResponse.json(await listModerationQueue());
  }
  if (view === "users") {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        creditBalance: true,
        levelSlug: true,
        isSuspended: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ users });
  }
  if (view === "brands") {
    const brands = await prisma.brand.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ brands });
  }
  if (view === "settings") {
    const [economy, features, settings] = await Promise.all([
      getEconomySettings(),
      prisma.monetizationFeature.findMany(),
      prisma.systemSetting.findMany(),
    ]);
    return NextResponse.json({ economy, features, settings });
  }
  return NextResponse.json({ error: "Unknown view" }, { status: 400 });
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "moderate_website") {
      const data = z
        .object({
          websiteId: z.string(),
          status: z.enum(["pending", "approved", "rejected", "suspended", "blocked"]),
          notes: z.string().optional(),
          queerdomPick: z.boolean().optional(),
          featured: z.boolean().optional(),
        })
        .parse(body);
      const website = await setWebsiteModeration({ ...data, actorId: user.id });
      return NextResponse.json({ website });
    }

    if (action === "adjust_credits") {
      const data = z
        .object({
          userId: z.string(),
          amount: z.number().int(),
          description: z.string().min(3),
        })
        .parse(body);
      const result = await moveCredits({
        userId: data.userId,
        amount: data.amount,
        type: "admin_adjustment",
        description: data.description,
        createdById: user.id,
      });
      await prisma.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "credits.adjust",
          targetType: "user",
          targetId: data.userId,
          detailsJson: JSON.stringify(data),
        },
      });
      return NextResponse.json(result);
    }

    if (action === "update_economy") {
      const economy = await setEconomySettings(body.settings ?? {}, user.id);
      await prisma.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "settings.economy",
          detailsJson: JSON.stringify(economy),
        },
      });
      return NextResponse.json({ economy });
    }

    if (action === "upsert_brand") {
      const data = z
        .object({
          id: z.string().optional(),
          name: z.string(),
          slug: z.string(),
          url: z.string().url(),
          description: z.string().optional(),
          logoUrl: z.string().optional(),
          category: z.string().optional(),
          network: z.string().default("founder"),
          isFeatured: z.boolean().optional(),
          isEnabled: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
        })
        .parse(body.brand);

      const brand = data.id
        ? await prisma.brand.update({ where: { id: data.id }, data })
        : await prisma.brand.create({ data });

      await prisma.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: data.id ? "brand.update" : "brand.create",
          targetType: "brand",
          targetId: brand.id,
          detailsJson: JSON.stringify(brand),
        },
      });
      return NextResponse.json({ brand });
    }

    if (action === "toggle_monetization") {
      const data = z
        .object({ key: z.string(), enabled: z.boolean() })
        .parse(body);
      const feature = await prisma.monetizationFeature.update({
        where: { key: data.key },
        data: { enabled: data.enabled },
      });
      await prisma.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "monetization.toggle",
          targetType: "monetization",
          targetId: data.key,
          detailsJson: JSON.stringify(data),
        },
      });
      return NextResponse.json({ feature });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
