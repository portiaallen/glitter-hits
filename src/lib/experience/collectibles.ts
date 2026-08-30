/**
 * Collectibles scaffolding — unique to Glitter Hits.
 * UI/architecture only for now; rewards can plug into the credit ledger later.
 */

export type CollectibleKind =
  | "glitter_piece"
  | "glitter_gem"
  | "sparkle"
  | "prism_token"
  | "theme_special"
  | "badge";

export type CollectibleDefinition = {
  slug: string;
  name: string;
  kind: CollectibleKind;
  description: string;
  themeSlug?: string;
  /** Future: bonus Hits, profile flair, homepage exposure */
  futureRewardHint: string;
};

export const COLLECTIBLE_CATALOG: CollectibleDefinition[] = [
  {
    slug: "sparkle-daily",
    name: "Today's Sparkle",
    kind: "sparkle",
    description: "A daily discovery sparkle — come back tomorrow for a new one.",
    futureRewardHint: "Streaks of sparkles may unlock bonus Hits later.",
  },
  {
    slug: "glitter-piece-rose",
    name: "Rose Glitter Piece",
    kind: "glitter_piece",
    description: "A playful shard of the Glitter Hits spectrum.",
    futureRewardHint: "Collect pieces toward profile decorations.",
  },
  {
    slug: "prism-token",
    name: "Prismatic Token",
    kind: "prism_token",
    description: "Rare light caught mid-surf.",
    futureRewardHint: "May unlock special features or homepage exposure.",
  },
  {
    slug: "theme-rainbow-ribbon",
    name: "Rainbow Ribbon",
    kind: "theme_special",
    themeSlug: "rainbow",
    description: "This month's collectible — only while Rainbow Month is live.",
    futureRewardHint: "Theme trophies for the dedicated explorers.",
  },
];

export function collectiblesForTheme(themeSlug: string) {
  return COLLECTIBLE_CATALOG.filter(
    (c) => !c.themeSlug || c.themeSlug === themeSlug,
  );
}
