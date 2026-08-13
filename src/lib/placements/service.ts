import type { PlacementType, MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { notifyUser } from "@/lib/notifications/service";

export type PlacementOffer = {
  type: PlacementType;
  name: string;
  description: string;
  creditCost: number;
  durationDays: number;
  membershipMin: MembershipTier;
};

const TIER_RANK: MembershipTier[] = ["free", "plus", "premium", "vip"];

export const PLACEMENT_OFFERS: PlacementOffer[] = [
  {
    type: "featured_site",
    name: "Featured Site Badge",
    description: "Mark your approved site as Featured across discovery surfaces.",
    creditCost: 150,
    durationDays: 7,
    membershipMin: "free",
  },
  {
    type: "homepage_spotlight",
    name: "Homepage Spotlight",
    description: "Premium slot on the Glitter Hits homepage.",
    creditCost: 250,
    durationDays: 7,
    membershipMin: "plus",
  },
  {
    type: "category_spotlight",
    name: "Category Spotlight",
    description: "Highlight inside your site’s category browse.",
    creditCost: 120,
    durationDays: 7,
    membershipMin: "free",
  },
  {
    type: "trending_placement",
    name: "Trending Placement",
    description: "Appear in the Trending promotional rail.",
    creditCost: 140,
    durationDays: 5,
    membershipMin: "plus",
  },
  {
    type: "banner_ad",
    name: "Network Banner",
    description: "Banner inventory across browse & discovery pages.",
    creditCost: 200,
    durationDays: 7,
    membershipMin: "premium",
  },
  {
    type: "text_ad",
    name: "Text Ad",
    description: "Compact sponsored text listing.",
    creditCost: 80,
    durationDays: 7,
    membershipMin: "free",
  },
  {
    type: "sponsored_discovery",
    name: "Sponsored Discovery",
    description: "Sponsored card in discovery feeds.",
    creditCost: 160,
    durationDays: 7,
    membershipMin: "plus",
  },
];

function membershipMeets(user: MembershipTier, min: MembershipTier) {
  return TIER_RANK.indexOf(user) >= TIER_RANK.indexOf(min);
}

export function getPlacementOffer(type: PlacementType) {
  return PLACEMENT_OFFERS.find((o) => o.type === type);
}

/** Premium+ get 20% off placement credit costs */
export function placementCostForMembership(
  offer: PlacementOffer,
  membership: MembershipTier,
) {
  if (membership === "premium" || membership === "vip") {
    return Math.max(1, Math.floor(offer.creditCost * 0.8));
  }
  return offer.creditCost;
}

export async function purchasePlacement(params: {
  userId: string;
  websiteId: string;
  type: PlacementType;
  title?: string;
  body?: string;
}) {
  const offer = getPlacementOffer(params.type);
  if (!offer) throw new Error("Unknown placement type.");

  const feature = await prisma.monetizationFeature.findUnique({
    where: { key: "featured_placements" },
  });
  if (feature && !feature.enabled) {
    throw new Error("Featured placements are currently disabled.");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  if (user.isSuspended) throw new Error("Account suspended.");
  if (!membershipMeets(user.membership, offer.membershipMin)) {
    throw new Error(
      `${offer.name} requires ${offer.membershipMin}+ membership. Upgrade in the Store.`,
    );
  }

  const website = await prisma.website.findFirst({
    where: { id: params.websiteId, userId: params.userId },
  });
  if (!website) throw new Error("Website not found.");
  if (website.moderationStatus !== "approved") {
    throw new Error("Only approved websites can purchase placements.");
  }

  const cost = placementCostForMembership(offer, user.membership);
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + offer.durationDays * 86_400_000);

  const placement = await prisma.$transaction(async (tx) => {
    await moveCredits({
      tx,
      userId: params.userId,
      amount: -cost,
      type: "spent_featured",
      description: `${offer.name} · ${website.title} (${offer.durationDays}d)`,
      metadata: {
        placementType: params.type,
        websiteId: website.id,
        durationDays: offer.durationDays,
      },
    });

    const created = await tx.featuredPlacement.create({
      data: {
        websiteId: website.id,
        type: params.type,
        status: "active",
        title: params.title?.trim() || `${website.title} — ${offer.name}`,
        body: params.body?.trim() || website.description,
        targetUrl: website.url,
        creditCost: cost,
        startAt,
        endAt,
        sortOrder: params.type === "homepage_spotlight" ? 1 : 10,
      },
    });

    if (params.type === "featured_site") {
      await tx.website.update({
        where: { id: website.id },
        data: { isFeatured: true },
      });
    }

    return created;
  });

  await notifyUser({
    userId: params.userId,
    type: "placement_purchased",
    title: "Placement live",
    body: `${offer.name} is active through ${endAt.toISOString().slice(0, 10)}.`,
    href: "/promote",
  });

  const { onMeaningfulActivity } = await import("@/lib/luck/activity");
  await onMeaningfulActivity({
    userId: params.userId,
    kind: "placement",
    silentLuckNotify: true,
  });

  return placement;
}

export async function listActivePlacements(types?: PlacementType[]) {
  const now = new Date();
  return prisma.featuredPlacement.findMany({
    where: {
      status: "active",
      ...(types?.length ? { type: { in: types } } : {}),
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    include: { website: { include: { category: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function expireDuePlacements() {
  const now = new Date();
  const expired = await prisma.featuredPlacement.updateMany({
    where: {
      status: "active",
      endAt: { lte: now },
    },
    data: { status: "expired" },
  });
  return expired.count;
}

export async function listUserPlacements(userId: string) {
  return prisma.featuredPlacement.findMany({
    where: { website: { userId } },
    include: { website: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}
