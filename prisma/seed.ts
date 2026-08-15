import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_ECONOMY } from "../src/lib/settings/economy";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "lgbtq", name: "LGBTQ+", icon: "🏳️‍🌈", sortOrder: 1 },
  { slug: "business", name: "Business", icon: "💼", sortOrder: 2 },
  { slug: "creators", name: "Creators", icon: "✨", sortOrder: 3 },
  { slug: "gaming", name: "Gaming", icon: "🎮", sortOrder: 4 },
  { slug: "entertainment", name: "Entertainment", icon: "🎭", sortOrder: 5 },
  { slug: "shopping", name: "Shopping", icon: "🛍️", sortOrder: 6 },
  { slug: "technology", name: "Technology", icon: "💻", sortOrder: 7 },
  { slug: "ai", name: "AI", icon: "🤖", sortOrder: 8 },
  { slug: "finance", name: "Finance", icon: "📈", sortOrder: 9 },
  { slug: "travel", name: "Travel", icon: "✈️", sortOrder: 10 },
  { slug: "food", name: "Food", icon: "🍽️", sortOrder: 11 },
  { slug: "lifestyle", name: "Lifestyle", icon: "🌿", sortOrder: 12 },
  { slug: "blogs", name: "Blogs", icon: "📝", sortOrder: 13 },
  { slug: "communities", name: "Communities", icon: "🤝", sortOrder: 14 },
  { slug: "nonprofit", name: "Nonprofit", icon: "💜", sortOrder: 15 },
  { slug: "personal", name: "Personal", icon: "👤", sortOrder: 16 },
  { slug: "adult", name: "Adult", icon: "🔒", sortOrder: 17, isAdult: true },
  { slug: "other", name: "Other", icon: "🌐", sortOrder: 18 },
];

const LEVELS = [
  { slug: "newcomer", name: "Newcomer", minPoints: 0, sortOrder: 1, description: "Just arrived at the glitter runway." },
  { slug: "explorer", name: "Explorer", minPoints: 50, sortOrder: 2, description: "Discovering the network." },
  { slug: "discoverer", name: "Discoverer", minPoints: 200, sortOrder: 3, description: "A habitual site-hopper." },
  { slug: "trendsetter", name: "Trendsetter", minPoints: 500, sortOrder: 4, description: "Setting the pace for discovery." },
  { slug: "glitter-guide", name: "Glitter Guide", minPoints: 1200, sortOrder: 5, description: "Lighting the path for others." },
  { slug: "queerdom-vip", name: "Queerdom VIP", minPoints: 3000, sortOrder: 6, description: "Inner-circle discovery royalty." },
];

const ACHIEVEMENTS = [
  { slug: "first-surf", name: "First Surf", description: "Complete your first discovery visit.", criteriaJson: JSON.stringify({ firstSurf: 1 }), creditReward: 5, pointsReward: 10 },
  { slug: "sites-100", name: "100 Sites Discovered", description: "Discover 100 websites.", criteriaJson: JSON.stringify({ sitesDiscovered: 100 }), creditReward: 50, pointsReward: 100 },
  { slug: "hits-1000", name: "1,000 Hits Earned", description: "Earn 1,000 Glitter Hits.", criteriaJson: JSON.stringify({ hitsEarned: 1000 }), creditReward: 100, pointsReward: 200 },
  { slug: "first-campaign", name: "First Campaign", description: "Launch your first campaign.", criteriaJson: JSON.stringify({ firstCampaign: 1 }), creditReward: 10, pointsReward: 25 },
  { slug: "first-referral", name: "First Referral", description: "Invite your first activated friend.", criteriaJson: JSON.stringify({ firstReferral: 1 }), creditReward: 15, pointsReward: 30 },
  { slug: "campaigns-10", name: "10 Active Campaigns", description: "Run 10 active campaigns at once.", criteriaJson: JSON.stringify({ activeCampaigns: 10 }), creditReward: 75, pointsReward: 150 },
  { slug: "community-explorer", name: "Community Explorer", description: "Discover 25 sites.", criteriaJson: JSON.stringify({ sitesDiscovered: 25 }), creditReward: 20, pointsReward: 40 },
  { slug: "glitter-guide", name: "Glitter Guide", description: "Earn 500 Glitter Hits.", criteriaJson: JSON.stringify({ hitsEarned: 500 }), creditReward: 40, pointsReward: 80 },
];

const FOUNDER_BRANDS = [
  {
    name: "Glitter Casino",
    slug: "glitter-casino",
    url: "https://www.glittercasino.gay",
    description: "Queer luxury gaming nightlife.",
    category: "Entertainment",
    network: "founder",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    name: "Glitter Persona",
    slug: "glitter-persona",
    url: "https://www.glitterpersona.gay",
    description: "Identity, expression, and digital self.",
    category: "Lifestyle",
    network: "founder",
    isFeatured: true,
    sortOrder: 2,
  },
  {
    name: "Sacred Luck",
    slug: "sacred-luck",
    url: "https://www.sacredluck.gay",
    description: "Mystic chance meets modern play.",
    category: "Entertainment",
    network: "founder",
    isFeatured: true,
    sortOrder: 3,
  },
  {
    name: "VentureMap",
    slug: "venturemap",
    url: "https://www.venturemap.gay",
    description: "Find the business path that's right for you.",
    category: "Business",
    network: "founder",
    isFeatured: true,
    sortOrder: 4,
  },
  {
    name: "LibertyVault",
    slug: "libertyvault",
    url: "https://www.libertyvault.gay",
    description: "Privacy-forward digital vault.",
    category: "Technology",
    network: "founder",
    isFeatured: true,
    sortOrder: 5,
  },
];

const MONETIZATION = [
  { key: "premium_memberships", name: "Premium Memberships", enabled: true },
  { key: "credit_purchases", name: "Promotional Credit Purchases", enabled: true },
  { key: "featured_placements", name: "Featured Placements", enabled: true },
  { key: "banner_advertising", name: "Banner Advertising", enabled: false },
  { key: "sponsored_listings", name: "Sponsored Listings", enabled: false },
  { key: "priority_campaigns", name: "Priority Campaigns", enabled: true },
  { key: "extra_website_slots", name: "Extra Website Slots", enabled: true },
  { key: "premium_analytics", name: "Premium Analytics", enabled: false },
  { key: "brand_packages", name: "Brand Promotion Packages", enabled: false },
];

const CREDIT_PACKS = [
  {
    slug: "starter-100",
    name: "Starter Pack",
    description: "100 promotional Glitter Hits",
    credits: 100,
    priceCents: 499,
    badge: null as string | null,
    sortOrder: 1,
  },
  {
    slug: "boost-500",
    name: "Boost Pack",
    description: "500 hits for campaign bursts",
    credits: 500,
    priceCents: 1999,
    badge: "Popular",
    sortOrder: 2,
  },
  {
    slug: "launch-1500",
    name: "Launch Pack",
    description: "1,500 hits for bigger campaigns",
    credits: 1500,
    priceCents: 4999,
    badge: "Best value",
    sortOrder: 3,
  },
  {
    slug: "empire-5000",
    name: "Empire Pack",
    description: "5,000 hits for network-scale pushes",
    credits: 5000,
    priceCents: 14999,
    badge: null,
    sortOrder: 4,
  },
];

const MAIL_ECONOMY = {
  standardCost: 25,
  boostedCost: 75,
  featuredCost: 150,
  premiumSoloCost: 400,
  paidSoloUpgradeCost: 200,
  maxRecipientsStandard: 50,
  maxRecipientsBoosted: 150,
  maxRecipientsFeatured: 400,
  maxRecipientsPremiumSolo: 2000,
  minAccountAgeHours: 0,
};

async function main() {
  console.log("Seeding Glitter Hits…");

  await prisma.systemSetting.upsert({
    where: { key: "economy" },
    create: { key: "economy", valueJson: JSON.stringify(DEFAULT_ECONOMY) },
    update: { valueJson: JSON.stringify(DEFAULT_ECONOMY) },
  });

  await prisma.systemSetting.upsert({
    where: { key: "mail_economy" },
    create: { key: "mail_economy", valueJson: JSON.stringify(MAIL_ECONOMY) },
    update: { valueJson: JSON.stringify(MAIL_ECONOMY) },
  });

  const packPriceEnv: Record<string, string | undefined> = {
    "starter-100": process.env.STRIPE_PRICE_PACK_STARTER,
    "boost-500": process.env.STRIPE_PRICE_PACK_BOOST,
    "launch-1500": process.env.STRIPE_PRICE_PACK_LAUNCH,
    "empire-5000": process.env.STRIPE_PRICE_PACK_EMPIRE,
  };

  for (const pack of CREDIT_PACKS) {
    const stripePriceId = packPriceEnv[pack.slug] || null;
    await prisma.creditPack.upsert({
      where: { slug: pack.slug },
      create: { ...pack, stripePriceId },
      update: {
        name: pack.name,
        description: pack.description,
        credits: pack.credits,
        priceCents: pack.priceCents,
        badge: pack.badge,
        sortOrder: pack.sortOrder,
        isActive: true,
        ...(stripePriceId ? { stripePriceId } : {}),
      },
    });
  }

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isAdult: "isAdult" in cat ? !!cat.isAdult : false,
      },
      update: {
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });
  }

  for (const level of LEVELS) {
    await prisma.levelDefinition.upsert({
      where: { slug: level.slug },
      create: level,
      update: level,
    });
  }

  for (const a of ACHIEVEMENTS) {
    await prisma.achievementDefinition.upsert({
      where: { slug: a.slug },
      create: a,
      update: a,
    });
  }

  for (const brand of FOUNDER_BRANDS) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: brand,
    });
  }

  for (const feature of MONETIZATION) {
    await prisma.monetizationFeature.upsert({
      where: { key: feature.key },
      create: {
        key: feature.key,
        name: feature.name,
        enabled: feature.enabled,
        description: "Admin-toggleable revenue stream",
      },
      update: { name: feature.name, enabled: feature.enabled },
    });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@glitterhits.online").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMeNow!";
  const prodLike =
    process.env.SEED_MODE === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  const allowDemoSeed = process.env.ALLOW_DEMO_SEED === "true" || !prodLike;

  if (prodLike) {
    if (!process.env.SEED_ADMIN_PASSWORD) {
      throw new Error("SEED_ADMIN_PASSWORD is required for production seed.");
    }
    if (adminPassword === "ChangeMeNow!" || adminPassword.length < 12) {
      throw new Error("Refuse weak/default SEED_ADMIN_PASSWORD for production seed.");
    }
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existingAdmin =
    (await prisma.user.findUnique({ where: { email: adminEmail } })) ??
    (await prisma.user.findUnique({ where: { referralCode: "FOUNDER-GLITTER" } })) ??
    (await prisma.user.findFirst({ where: { role: { in: ["founder", "admin"] } } }));

  const admin = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: adminEmail,
          ...(process.env.SEED_RESET_ADMIN_PASSWORD === "true" || !existingAdmin.passwordHash
            ? { passwordHash }
            : {}),
          role: "founder",
          referralCode: existingAdmin.referralCode || "FOUNDER-GLITTER",
        },
      })
    : await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Founder",
          passwordHash,
          role: "founder",
          membership: "vip",
          referralCode: "FOUNDER-GLITTER",
          creditBalance: 1000,
          lifetimeEarned: 1000,
          levelSlug: "queerdom-vip",
          levelPoints: 3000,
        },
      });

  const demoEmails = [
    "demo@glitterhits.online",
    "nova@glitterhits.online",
    "rio@glitterhits.online",
    "sage@glitterhits.online",
    "kai@glitterhits.online",
    "lux@glitterhits.online",
  ];

  let demo: { id: string } | null = null;

  if (allowDemoSeed) {
    // Demo member
    const demoHash = await bcrypt.hash("demo12345", 12);
    demo = await prisma.user.upsert({
      where: { email: "demo@glitterhits.online" },
      create: {
        email: "demo@glitterhits.online",
        name: "Demo Discoverer",
        passwordHash: demoHash,
        role: "member",
        referralCode: "DEMO-SURF",
        creditBalance: 500,
        lifetimeEarned: 500,
        levelSlug: "newcomer",
      },
      update: { passwordHash: demoHash, creditBalance: 500, isSuspended: false },
    });

    // Extra network members so mailing has recipients beyond demo/admin
    const networkMembers = [
      { email: "nova@glitterhits.online", name: "Nova", code: "NOVA-01" },
      { email: "rio@glitterhits.online", name: "Rio", code: "RIO-02" },
      { email: "sage@glitterhits.online", name: "Sage", code: "SAGE-03" },
      { email: "kai@glitterhits.online", name: "Kai", code: "KAI-04" },
      { email: "lux@glitterhits.online", name: "Lux", code: "LUX-05" },
    ];
    const memberHash = await bcrypt.hash("networkmember1", 12);
    for (const m of networkMembers) {
      await prisma.user.upsert({
        where: { email: m.email },
        create: {
          email: m.email,
          name: m.name,
          passwordHash: memberHash,
          role: "member",
          referralCode: m.code,
          creditBalance: 75,
          lifetimeEarned: 75,
          levelSlug: "explorer",
          levelPoints: 60,
          lastSurfDate: new Date(),
        },
        update: { lastSurfDate: new Date(), isSuspended: false },
      });
    }
  } else {
    await prisma.user.updateMany({
      where: { email: { in: demoEmails } },
      data: { isSuspended: true },
    });
    console.log("Production seed: demo/network accounts skipped or suspended.");
  }

  const lgbtq = await prisma.category.findUnique({ where: { slug: "lgbtq" } });
  const entertainment = await prisma.category.findUnique({ where: { slug: "entertainment" } });

  const creators = await prisma.category.findUnique({ where: { slug: "creators" } });
  const tech = await prisma.category.findUnique({ where: { slug: "technology" } });
  const communities = await prisma.category.findUnique({ where: { slug: "communities" } });

  const founderSites = [
    {
      userId: admin.id,
      url: "https://www.glittercasino.gay",
      title: "Glitter Casino",
      description: "Queer luxury gaming — part of the Founder Network.",
      categoryId: entertainment?.id,
      moderationStatus: "approved" as const,
      httpsOk: true,
      isQueerdomPick: true,
      isFeatured: true,
    },
    {
      userId: admin.id,
      url: "https://www.glitterpersona.gay",
      title: "Glitter Persona",
      description: "Identity and expression from the Founder Network.",
      categoryId: creators?.id,
      moderationStatus: "approved" as const,
      httpsOk: true,
      isQueerdomPick: true,
      isFeatured: true,
    },
    {
      userId: admin.id,
      url: "https://www.sacredluck.gay",
      title: "Sacred Luck",
      description: "Mystic chance meets modern play.",
      categoryId: entertainment?.id,
      moderationStatus: "approved" as const,
      httpsOk: true,
      isFeatured: true,
    },
    {
      userId: admin.id,
      url: "https://www.venturemap.gay",
      title: "VentureMap",
      description: "Find the business path that's right for you.",
      categoryId: tech?.id,
      moderationStatus: "approved" as const,
      httpsOk: true,
      isQueerdomPick: true,
    },
    {
      userId: admin.id,
      url: "https://www.libertyvault.gay",
      title: "LibertyVault",
      description: "Privacy-forward digital vault.",
      categoryId: tech?.id,
      moderationStatus: "approved" as const,
      httpsOk: true,
    },
  ];

  const fillerSites = allowDemoSeed
    ? [
        {
          userId: admin.id,
          url: "https://www.wikipedia.org",
          title: "Wikipedia",
          description: "Open knowledge — useful Surf inventory for launch testing.",
          categoryId: communities?.id,
          moderationStatus: "approved" as const,
          httpsOk: true,
          isFeatured: false,
        },
        {
          userId: admin.id,
          url: "https://developer.mozilla.org",
          title: "MDN Web Docs",
          description: "Builder-friendly discovery inventory for the network.",
          categoryId: tech?.id,
          moderationStatus: "approved" as const,
          httpsOk: true,
        },
        {
          userId: admin.id,
          url: "https://www.nasa.gov",
          title: "NASA",
          description: "Space exploration inventory for denser Surf rotation.",
          categoryId: tech?.id,
          moderationStatus: "approved" as const,
          httpsOk: true,
        },
        {
          userId: admin.id,
          url: "https://www.archive.org",
          title: "Internet Archive",
          description: "Digital library — network discovery filler.",
          categoryId: communities?.id,
          moderationStatus: "approved" as const,
          httpsOk: true,
        },
      ]
    : [];

  const demoSites =
    allowDemoSeed && demo
      ? [
          {
            userId: demo.id,
            url: "https://example.com",
            title: "Example Discovery Site",
            description: "A sample campaign site for local Surf testing.",
            categoryId: lgbtq?.id,
            moderationStatus: "approved" as const,
            httpsOk: true,
            isQueerdomPick: true,
          },
          {
            userId: demo.id,
            url: "https://www.w3.org",
            title: "W3C",
            description: "Web standards — secondary demo campaign.",
            categoryId: creators?.id,
            moderationStatus: "approved" as const,
            httpsOk: true,
          },
          {
            userId: demo.id,
            url: "https://web.dev",
            title: "web.dev",
            description: "Modern web guidance for demo Surf density.",
            categoryId: tech?.id,
            moderationStatus: "approved" as const,
            httpsOk: true,
          },
        ]
      : [];

  const sampleSites = [...founderSites, ...fillerSites, ...demoSites];

  for (const site of sampleSites) {
    const existing = await prisma.website.findFirst({
      where: { userId: site.userId, url: site.url },
    });
    const website =
      existing ??
      (await prisma.website.create({
        data: site,
      }));

    const existingCampaign = await prisma.campaign.findFirst({
      where: { websiteId: website.id, userId: site.userId },
    });
    if (!existingCampaign) {
      await prisma.campaign.create({
        data: {
          userId: site.userId,
          websiteId: website.id,
          name: `${site.title} Promo`,
          status: "active",
          creditBalance: site.userId === admin.id ? 500 : 40,
          visitDurationSec: 12,
          priority: "isFeatured" in site && site.isFeatured ? "featured" : "standard",
          geoTargetsJson: JSON.stringify(["WW"]),
          deviceTarget: "all",
        },
      });
    }
  }

  await prisma.announcement.upsert({
    where: { id: "seed-welcome" },
    create: {
      id: "seed-welcome",
      title: "✨ Surf. Spark. Share. Get Lucky.",
      body: "Welcome to the Glitter Luck Engine — earn Hits by surfing, grow Luck, claim Glitter Drops, and keep your streak alive.",
      isActive: true,
    },
    update: {
      title: "✨ Surf. Spark. Share. Get Lucky.",
      body: "Welcome to the Glitter Luck Engine — earn Hits by surfing, grow Luck, claim Glitter Drops, and keep your streak alive.",
      isActive: true,
    },
  });

  // Featured placement inventory (architecture live; some disabled)
  const glitterSite = await prisma.website.findFirst({
    where: { url: "https://www.glittercasino.gay" },
  });
  if (glitterSite) {
    const existingPlacement = await prisma.featuredPlacement.findFirst({
      where: { websiteId: glitterSite.id, type: "homepage_spotlight" },
    });
    if (!existingPlacement) {
      await prisma.featuredPlacement.create({
        data: {
          websiteId: glitterSite.id,
          type: "homepage_spotlight",
          status: "active",
          title: "Homepage Spotlight — Glitter Casino",
          body: "Featured discovery from the Founder Network.",
          targetUrl: glitterSite.url,
          sortOrder: 1,
        },
      });
    }
  }

  // ─── Luck Engine seed ─────────────────────────────────────────────────────
  const { DEFAULT_LUCK_ENGINE, DEFAULT_LUCK_LEVELS } = await import(
    "../src/lib/luck/config"
  );
  await prisma.systemSetting.upsert({
    where: { key: "luck_engine" },
    create: { key: "luck_engine", valueJson: JSON.stringify(DEFAULT_LUCK_ENGINE) },
    update: { valueJson: JSON.stringify(DEFAULT_LUCK_ENGINE) },
  });

  for (const level of DEFAULT_LUCK_LEVELS) {
    await prisma.luckLevelDefinition.upsert({
      where: { slug: level.slug },
      create: level,
      update: level,
    });
  }

  const quests = [
    {
      slug: "first-spark",
      name: "First Spark",
      description: "Complete your first surf.",
      icon: "✨",
      rarity: "common" as const,
      requirementJson: JSON.stringify({ type: "first_surf", target: 1 }),
      rewardHits: 25,
      rewardLuck: 10,
      sortOrder: 1,
    },
    {
      slug: "glitter-seeker",
      name: "Glitter Seeker",
      description: "Surf 25 pages.",
      icon: "🔍",
      rarity: "uncommon" as const,
      requirementJson: JSON.stringify({ type: "surf", target: 25 }),
      rewardHits: 100,
      rewardLuck: 25,
      sortOrder: 2,
    },
    {
      slug: "signal-flare",
      name: "Signal Flare",
      description: "Promote your first website (create a campaign).",
      icon: "📣",
      rarity: "common" as const,
      requirementJson: JSON.stringify({ type: "campaign", target: 1 }),
      rewardHits: 50,
      rewardLuck: 12,
      sortOrder: 3,
    },
    {
      slug: "community-builder",
      name: "Community Builder",
      description: "Refer your first activated member.",
      icon: "🌈",
      rarity: "rare" as const,
      requirementJson: JSON.stringify({ type: "referral", target: 1 }),
      rewardHits: 250,
      rewardLuck: 40,
      sortOrder: 4,
      rewardBadgeSlug: "community-builder",
    },
    {
      slug: "lucky-streak",
      name: "Lucky Streak",
      description: "Stay active 7 days in a row.",
      icon: "🔥",
      rarity: "rare" as const,
      requirementJson: JSON.stringify({ type: "streak", target: 7 }),
      rewardHits: 500,
      rewardLuck: 50,
      sortOrder: 5,
      rewardBadgeSlug: "seven-day-streak",
    },
    {
      slug: "glitter-legend",
      name: "Glitter Legend",
      description: "Complete 25 quests.",
      icon: "👑",
      rarity: "epic" as const,
      requirementJson: JSON.stringify({ type: "quests_completed", target: 25 }),
      rewardHits: 750,
      rewardLuck: 100,
      sortOrder: 6,
      rewardBadgeSlug: "quest-master",
    },
  ];

  for (const q of quests) {
    await prisma.questDefinition.upsert({
      where: { slug: q.slug },
      create: q,
      update: {
        name: q.name,
        description: q.description,
        icon: q.icon,
        rarity: q.rarity,
        requirementJson: q.requirementJson,
        rewardHits: q.rewardHits,
        rewardLuck: q.rewardLuck,
        rewardBadgeSlug: q.rewardBadgeSlug ?? null,
        sortOrder: q.sortOrder,
        isActive: true,
      },
    });
  }

  const milestones = [
    { days: 3, name: "Spark Streak", rewardHits: 25, rewardLuck: 10, rewardSpins: 1 },
    { days: 7, name: "Lucky Streak", rewardHits: 100, rewardLuck: 25, rewardSpins: 1, badgeSlug: "seven-day-streak" },
    { days: 14, name: "Super Streak", rewardHits: 250, rewardLuck: 40, rewardSpins: 2 },
    { days: 30, name: "Glitter Legend", rewardHits: 750, rewardLuck: 80, rewardSpins: 3, badgeSlug: "glitter-legend-streak" },
  ];
  for (const m of milestones) {
    await prisma.streakMilestone.upsert({
      where: { days: m.days },
      create: m,
      update: m,
    });
  }

  const personas = [
    { slug: "unicorn", name: "Unicorn", icon: "🦄", description: "Mythic queer magic.", accentColor: "#ff4fd8", unlockLuckMin: 0, sortOrder: 1 },
    { slug: "royal", name: "Royal", icon: "👑", description: "Crowned discovery energy.", accentColor: "#ffd36a", unlockLuckMin: 150, sortOrder: 2 },
    { slug: "glitter-fairy", name: "Glitter Fairy", icon: "🧚", description: "Soft sparkle chaos.", accentColor: "#c084fc", unlockLuckMin: 50, sortOrder: 3 },
    { slug: "flame", name: "Flame", icon: "🔥", description: "Streak-fueled heat.", accentColor: "#ff6b8a", unlockLuckMin: 350, sortOrder: 4 },
    { slug: "moon-witch", name: "Moon Witch", icon: "🌙", description: "Night glitter rituals.", accentColor: "#4de2ff", unlockLuckMin: 700, sortOrder: 5 },
    { slug: "diamond-diva", name: "Diamond Diva", icon: "💎", description: "Rare drop royalty.", accentColor: "#a5f3fc", unlockLuckMin: 1200, sortOrder: 6 },
    { slug: "rainbow-rebel", name: "Rainbow Rebel", icon: "🌈", description: "Community parade power.", accentColor: "#f472b6", unlockLuckMin: 200, sortOrder: 7 },
  ];
  for (const p of personas) {
    await prisma.persona.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
  }

  const badges = [
    { slug: "first-spark", name: "First Spark", description: "Completed first surf.", icon: "✨", rarity: "common" as const },
    { slug: "unicorn", name: "Unicorn", description: "Chose the Unicorn persona.", icon: "🦄", rarity: "uncommon" as const },
    { slug: "seven-day-streak", name: "7-Day Streak", description: "Seven active days.", icon: "🔥", rarity: "rare" as const },
    { slug: "diamond-drop", name: "Diamond Drop", description: "Claimed a Diamond Drop.", icon: "💎", rarity: "diamond" as const },
    { slug: "glitter-royalty", name: "Glitter Royalty", description: "Entered a royalty board.", icon: "👑", rarity: "epic" as const },
    { slug: "community-builder", name: "Community Builder", description: "First referral activated.", icon: "🌈", rarity: "rare" as const },
    { slug: "first-promotion", name: "First Promotion", description: "Launched a campaign.", icon: "📣", rarity: "common" as const },
    { slug: "quest-master", name: "Quest Master", description: "Completed many quests.", icon: "🎯", rarity: "epic" as const },
    { slug: "glitter-legend-streak", name: "Glitter Legend", description: "30-day streak.", icon: "🌟", rarity: "epic" as const },
  ];
  for (const b of badges) {
    await prisma.badgeDefinition.upsert({
      where: { slug: b.slug },
      create: b,
      update: b,
    });
  }

  const wheel = [
    { label: "+10 Hits", rewardType: "hits", rewardValue: 10, weight: 28, color: "#ff4fd8", sortOrder: 1 },
    { label: "+25 Hits", rewardType: "hits", rewardValue: 25, weight: 20, color: "#c084fc", sortOrder: 2 },
    { label: "+100 Hits", rewardType: "hits", rewardValue: 100, weight: 8, color: "#ffd36a", sortOrder: 3 },
    { label: "+Luck", rewardType: "luck", rewardValue: 15, weight: 18, color: "#4de2ff", sortOrder: 4 },
    { label: "2X Surf", rewardType: "multiplier", rewardValue: 200, weight: 8, color: "#fb7185", sortOrder: 5 },
    { label: "Mystery Drop", rewardType: "drop", rewardValue: 1, weight: 8, color: "#a78bfa", sortOrder: 6 },
    { label: "Extra Spin", rewardType: "spins", rewardValue: 1, weight: 6, color: "#34d399", sortOrder: 7 },
    { label: "Quest Token", rewardType: "token", rewardValue: 1, weight: 4, color: "#fbbf24", sortOrder: 8 },
  ];
  const existingSegments = await prisma.wheelSegment.count();
  if (existingSegments === 0) {
    for (const s of wheel) {
      await prisma.wheelSegment.create({ data: s });
    }
  }

  const royalty = [
    { slug: "queen-of-traffic", name: "Queen of Traffic", metric: "visits_received", icon: "👑", description: "Most visits delivered to your sites.", sortOrder: 1 },
    { slug: "king-of-clicks", name: "King of Clicks", metric: "surfs", icon: "🖱️", description: "Most pages discovered.", sortOrder: 2 },
    { slug: "royal-recruiter", name: "Royal Recruiter", metric: "referrals", icon: "🌈", description: "Most activated referrals.", sortOrder: 3 },
    { slug: "glitter-ambassador", name: "Glitter Ambassador", metric: "visits_given", icon: "✨", description: "Most exchange visits given.", sortOrder: 4 },
    { slug: "surf-sorcerer", name: "Surf Sorcerer", metric: "surfs", icon: "🧙", description: "Dedicated discovery energy.", sortOrder: 5 },
    { slug: "luckiest-member", name: "Luckiest Member", metric: "luck", icon: "🍀", description: "Highest Luck points.", sortOrder: 6 },
    { slug: "longest-streak", name: "Longest Streak", metric: "streak", icon: "🔥", description: "Current active-day streak.", sortOrder: 7 },
  ];
  for (const r of royalty) {
    await prisma.royaltyCategory.upsert({
      where: { slug: r.slug },
      create: r,
      update: r,
    });
  }

  await prisma.communityChallenge.upsert({
    where: { slug: "pride-parade" },
    create: {
      slug: "pride-parade",
      name: "Pride Parade",
      description: "Surf 100,000 pages together. Every active contributor earns bonus Hits.",
      icon: "🌈",
      metric: "pages_surfed",
      goal: 100000,
      progress: 0,
      rewardHits: 250,
      status: "active",
      startsAt: new Date(),
    },
    update: {
      name: "Pride Parade",
      description: "Surf 100,000 pages together. Every active contributor earns bonus Hits.",
      status: "active",
      rewardHits: 250,
      goal: 100000,
    },
  });

  // Give demo a starter spin + luck
  if (demo) {
    await prisma.user.update({
      where: { id: demo.id },
      data: {
        wheelSpins: 2,
        luckPoints: 20,
        luckLevelSlug: "spark",
      },
    });
  }

  console.log("Seed complete.");
  console.log(`  Admin: ${adminEmail}`);
  if (allowDemoSeed) {
    console.log("  Demo accounts seeded (ALLOW_DEMO_SEED / non-production).");
  } else {
    console.log("  Demo accounts not seeded (production-safe).");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
