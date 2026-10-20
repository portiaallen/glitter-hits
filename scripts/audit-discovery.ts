/**
 * Discovery count audit (founder directive 2026-10-20).
 * Run with a real DATABASE_URL:  DATABASE_URL=... npx tsx scripts/audit-discovery.ts
 *
 * Lists every website record with origin signals (owner role/email, creation
 * date), current discoverCount, and a visit-activity breakdown so seeded,
 * internal/test, and authentic public activity can be told apart.
 * Read-only: it never writes to the database.
 */
import { prisma } from "../src/lib/db";
import { HIDDEN_DISCOVERY_SITES } from "../src/lib/discovery/visibility";

async function main() {
  const [sites, visitsBySite, visitsBySiteType, platformAccounts] =
    await Promise.all([
      prisma.website.findMany({
        include: {
          user: { select: { email: true, role: true, createdAt: true } },
          category: { select: { name: true } },
        },
        orderBy: [{ discoverCount: "desc" }],
      }),
      prisma.visit.groupBy({ by: ["websiteId"], _count: { _all: true } }),
      prisma.visit.groupBy({
        by: ["websiteId", "viewerType"],
        _count: { _all: true },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: "@glitterhits.online" } },
            { email: { contains: "@glittertraffic.online" } },
          ],
        },
        select: { id: true, email: true, role: true },
      }),
    ]);

  const platformAccountIds = new Set(platformAccounts.map((u) => u.id));
  const platformAccountEmails = new Set(platformAccounts.map((u) => u.email));

  // Visits placed by platform (seed) accounts, grouped by target website.
  const seedVisitsBySite = await prisma.visit.groupBy({
    by: ["websiteId"],
    where: { visitorUserId: { in: [...platformAccountIds] } },
    _count: { _all: true },
  });
  // Anonymous traffic (no logged-in viewer) per website.
  const anonVisitsBySite = await prisma.visit.groupBy({
    by: ["websiteId"],
    where: { visitorUserId: null },
    _count: { _all: true },
  });

  const totalBySite = new Map(
    visitsBySite.map((v) => [v.websiteId, v._count._all]),
  );
  const typeBySite = new Map<
    string,
    Record<string, number>
  >();
  for (const row of visitsBySiteType) {
    const acc = typeBySite.get(row.websiteId) ?? {};
    acc[row.viewerType] = row._count._all;
    typeBySite.set(row.websiteId, acc);
  }
  const seedBySite = new Map(
    seedVisitsBySite.map((v) => [v.websiteId, v._count._all]),
  );
  const anonBySite = new Map(
    anonVisitsBySite.map((v) => [v.websiteId, v._count._all]),
  );

  console.log(
    `Total website records: ${sites.length}; platform/seed accounts: ${platformAccountEmails.size ? [...platformAccountEmails].join(", ") : "none found"}`,
  );
  console.log("");
  for (const site of sites) {
    const hidden = HIDDEN_DISCOVERY_SITES.find(
      (h) => h.url === site.url || h.title === site.title,
    );
    const total = totalBySite.get(site.id) ?? 0;
    const types = typeBySite.get(site.id) ?? {};
    const typeSummary = Object.entries(types)
      .map(([k, n]) => `${k}=${n}`)
      .join(" ")
      .trim();
    const seed = seedBySite.get(site.id) ?? 0;
    const anon = anonBySite.get(site.id) ?? 0;
    // Logged-in, non-platform-account visits = closest proxy for organic.
    const organic = total - seed - anon;
    console.log(
      [
        `title=${site.title}`,
        `url=${site.url}`,
        `status=${site.moderationStatus}`,
        `owner=${site.user.email} (role=${site.user.role}, joined ${site.user.createdAt.toISOString().slice(0, 10)})`,
        `created=${site.createdAt.toISOString()}`,
        `discoverCount=${site.discoverCount}`,
        `featured=${site.isFeatured}`,
        `trendingFlag=${site.isTrending}`,
        `category=${site.category?.name ?? "none"}`,
        `visits_total=${total} (viewerType: ${typeSummary || "none"})`,
        `visits_seed_platform_accounts=${seed}`,
        `visits_anonymous=${anon}`,
        `visits_other_logged_in=${organic}`,
        hidden ? `HIDDEN_FROM_DISCOVERY (${hidden.reason})` : "visible",
        "",
      ].join(" · "),
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
