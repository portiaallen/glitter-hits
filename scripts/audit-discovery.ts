/**
 * Discovery count audit (founder directive 2026-10-20).
 * Run with a real DATABASE_URL:  DATABASE_URL=... npx tsx scripts/audit-discovery.ts
 *
 * Lists every website record with its origin signals (owner role, seeded vs
 * submitted), current discoverCount, and the activity breakdown needed to
 * distinguish test/internal activity from authentic public participation.
 * Read-only: it never writes to the database.
 */
import { prisma } from "../src/lib/db";
import { HIDDEN_DISCOVERY_SITES } from "../src/lib/discovery/visibility";

async function main() {
  const sites = await prisma.website.findMany({
    include: {
      owner: { select: { email: true, role: true, createdAt: true } },
      visitsReceived: {
        select: { visitor: { select: { email: true, createdAt: true } }, createdAt: true },
      },
      category: { select: { name: true } },
    },
    orderBy: [{ discoverCount: "desc" }],
  });

  const seedAccountSuffixes = ["@glitterhits.online", "@glittertraffic.online"];

  console.log(`Total website records: ${sites.length}\n`);
  for (const site of sites) {
    const hidden = HIDDEN_DISCOVERY_SITES.find(
      (h) => h.url === site.url || h.title === site.title,
    );
    const visits = site.visitsReceived;
    const seedVisits = visits.filter((v) =>
      seedAccountSuffixes.some((sfx) => v.visitor?.email?.endsWith(sfx)),
    );
    const founderAccountVisits = visits.filter(
      (v) => v.visitor?.email === site.owner.email,
    );
    const otherVisits = visits.length - seedVisits.length - founderAccountVisits;
    console.log(
      [
        `title=${site.title}`,
        `url=${site.url}`,
        `status=${site.moderationStatus}`,
        `owner=${site.owner.email} (role=${site.owner.role}, joined ${site.owner.createdAt.toISOString().slice(0, 10)})`,
        `created=${site.createdAt.toISOString()}`,
        `discoverCount=${site.discoverCount}`,
        `featured=${site.isFeatured}`,
        `queerdomPick=${site.isQueerdomPick}`,
        `category=${site.category?.name ?? "none"}`,
        `visits_total=${visits.length}`,
        `visits_seed_accounts=${seedVisits.length}`,
        `visits_own_account=${founderAccountVisits.length}`,
        `visits_other=${otherVisits}`,
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
