// ─── Public discovery visibility registry ───────────────────────────────────
//
// Founder directive, 2026-10-20 ("Glitter Traffic Public Listings Removal and
// Replacement"): the entire existing public Trending Sites collection is hidden
// from every public discovery surface, effective immediately.
//
// Rules encoded here (do not weaken without founder approval):
//  - Records are HIDDEN, never deleted. Database rows, discover counts, and
//    audit history stay intact; these filters change only what is displayed.
//  - Hidden entries must not appear in public rankings, recommendations,
//    discovery cards, or any other public surface.
//  - No destination is featured publicly until the founder verifies it as
//    visitor-ready and approves it. Approved entries go in
//    CURATED_DESTINATIONS below; that list is never auto-populated.
//  - Never fabricate popularity. Seeded or internal counts are never
//    presented as organic public activity.

export type HiddenDiscoverySite = {
  title: string;
  url: string;
  origin: string;
  reason: string;
};

export const HIDDEN_DISCOVERY_SITES: HiddenDiscoverySite[] = [
  { title: "Glitter Casino", url: "https://www.glittercasino.gay", origin: "prisma/seed.ts founder-network record", reason: "No visitor-ready experience yet; appeared #1 in Trending." },
  { title: "Glitter Persona", url: "https://www.glitterpersona.gay", origin: "prisma/seed.ts founder-network record", reason: "Not a founder-confirmed owned domain; under investigation." },
  { title: "Sacred Luck", url: "https://www.sacredluck.gay", origin: "prisma/seed.ts founder-network record", reason: "Hidden with the collection pending founder curation." },
  { title: "VentureMap", url: "https://www.venturemap.gay", origin: "prisma/seed.ts founder-network record", reason: "Hidden with the collection pending founder curation." },
  { title: "LibertyVault", url: "https://www.libertyvault.gay", origin: "prisma/seed.ts founder-network record", reason: "Hidden with the collection pending founder curation." },
  { title: "Wikipedia", url: "https://www.wikipedia.org", origin: "prisma/seed.ts launch-testing filler", reason: "Seeded inventory, not authentic member discovery." },
  { title: "MDN Web Docs", url: "https://developer.mozilla.org", origin: "prisma/seed.ts discovery filler", reason: "Seeded inventory, not authentic member discovery." },
  { title: "NASA", url: "https://www.nasa.gov", origin: "prisma/seed.ts surf-rotation filler", reason: "Seeded inventory, not authentic member discovery." },
  { title: "Internet Archive", url: "https://www.archive.org", origin: "prisma/seed.ts discovery filler", reason: "Seeded inventory, not authentic member discovery." },
  { title: "Example Discovery Site", url: "https://example.com", origin: "prisma/seed.ts demo record", reason: "Local testing demo site." },
  { title: "W3C", url: "https://www.w3.org", origin: "prisma/seed.ts demo record", reason: "Local testing demo site." },
  { title: "web.dev", url: "https://web.dev", origin: "prisma/seed.ts demo record", reason: "Local testing demo site." },
];

export const HIDDEN_DISCOVERY_URLS = HIDDEN_DISCOVERY_SITES.map((s) => s.url);
export const HIDDEN_DISCOVERY_TITLES = HIDDEN_DISCOVERY_SITES.map((s) => s.title);

/** Prisma fragment that excludes every hidden site from a public query. */
export function excludeHiddenDiscoverySites() {
  return {
    AND: [
      { url: { notIn: HIDDEN_DISCOVERY_URLS } },
      { title: { notIn: HIDDEN_DISCOVERY_TITLES } },
    ],
  };
}

/** True when a website (or placement target) is hidden from public discovery. */
export function isHiddenFromDiscovery(
  url?: string | null,
  title?: string | null,
): boolean {
  if (url && HIDDEN_DISCOVERY_URLS.includes(url)) return true;
  if (title && HIDDEN_DISCOVERY_TITLES.includes(title)) return true;
  return false;
}

/**
 * Founder-approved, verified, visitor-ready destinations. This is the ONLY
 * source /trending may feature. Empty until the founder confirms entries;
 * nothing is ever auto-populated here.
 */
export const CURATED_DESTINATIONS: {
  title: string;
  url: string;
  description: string;
  category: string;
  approvedBy: string;
  approvedAt: string;
}[] = [];
