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
  { key: "credit_purchases", name: "Promotional Credit Purchases", enabled: false },
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

  for (const pack of CREDIT_PACKS) {
    await prisma.creditPack.upsert({
      where: { slug: pack.slug },
      create: pack,
      update: {
        name: pack.name,
        description: pack.description,
        credits: pack.credits,
        priceCents: pack.priceCents,
        badge: pack.badge,
        sortOrder: pack.sortOrder,
        isActive: true,
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

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@glitterhits.gay").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMeNow!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
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
    update: {
      passwordHash,
      role: "founder",
    },
  });

  // Demo member
  const demoHash = await bcrypt.hash("demo12345", 12);
  const demo = await prisma.user.upsert({
    where: { email: "demo@glitterhits.gay" },
    create: {
      email: "demo@glitterhits.gay",
      name: "Demo Discoverer",
      passwordHash: demoHash,
      role: "member",
      referralCode: "DEMO-SURF",
      creditBalance: 500,
      lifetimeEarned: 500,
      levelSlug: "newcomer",
    },
    update: { passwordHash: demoHash, creditBalance: 500 },
  });

  // Extra network members so mailing has recipients beyond demo/admin
  const networkMembers = [
    { email: "nova@glitterhits.gay", name: "Nova", code: "NOVA-01" },
    { email: "rio@glitterhits.gay", name: "Rio", code: "RIO-02" },
    { email: "sage@glitterhits.gay", name: "Sage", code: "SAGE-03" },
    { email: "kai@glitterhits.gay", name: "Kai", code: "KAI-04" },
    { email: "lux@glitterhits.gay", name: "Lux", code: "LUX-05" },
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
      update: { lastSurfDate: new Date() },
    });
  }

  const lgbtq = await prisma.category.findUnique({ where: { slug: "lgbtq" } });
  const entertainment = await prisma.category.findUnique({ where: { slug: "entertainment" } });

  const creators = await prisma.category.findUnique({ where: { slug: "creators" } });
  const tech = await prisma.category.findUnique({ where: { slug: "technology" } });
  const communities = await prisma.category.findUnique({ where: { slug: "communities" } });

  const sampleSites = [
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
  ];

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
      title: "Welcome to Glitter Hits",
      body: "Get Seen. Get Hits. Get Glitter. Earn promotional credits by discovering websites — spend them to promote your own. Exchange traffic is always labeled honestly.",
      isActive: true,
    },
    update: {
      title: "Welcome to Glitter Hits",
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

  console.log("Seed complete.");
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log("  Demo:  demo@glitterhits.gay / demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
