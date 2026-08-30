/**
 * Volume 111 — Monthly Theme architecture.
 * Swap themes without rebuilding the app: change DEFAULT_THEME_SLUG
 * or set SystemSetting key `experience.monthly_theme` to a theme slug.
 */

export type MonthlyTheme = {
  slug: string;
  name: string;
  tagline: string;
  /** Short playful line for surf / daily return */
  discoveryLine: string;
  heroHint: string;
  collectibleName: string;
  collectibleHint: string;
  cssAttr: string;
  accents: {
    primary: string;
    secondary: string;
  };
};

export const MONTHLY_THEMES: MonthlyTheme[] = [
  {
    slug: "rainbow",
    name: "Rainbow Month",
    tagline: "What bizarre thing is Glitter Hits doing this month?",
    discoveryLine: "Today's Hits arrive in full spectrum.",
    heroHint: "Come play. Come explore. Come get your traffic.",
    collectibleName: "Prism Sparkles",
    collectibleHint: "Collect sparkles while you explore — theme rewards coming soon.",
    cssAttr: "rainbow",
    accents: { primary: "#ff4fb8", secondary: "#2ec8e6" },
  },
  {
    slug: "weird-internet",
    name: "Weird Internet Month",
    tagline: "The strange corners of the web are open for business.",
    discoveryLine: "Next channel: something you didn't expect.",
    heroHint: "See where the internet takes you.",
    collectibleName: "Odd Tabs",
    collectibleHint: "Bookmark the weird. Theme collectibles unlock later.",
    cssAttr: "weird-internet",
    accents: { primary: "#2ec8e6", secondary: "#a78bfa" },
  },
  {
    slug: "space",
    name: "Outer Space Month",
    tagline: "Traffic exchange? More like orbital discovery.",
    discoveryLine: "Tuning into the next satellite…",
    heroHint: "Launch. Discover. Get seen.",
    collectibleName: "Stardust Chips",
    collectibleHint: "Stardust collectibles will power future bonuses.",
    cssAttr: "space",
    accents: { primary: "#7c6cff", secondary: "#2ec8e6" },
  },
  {
    slug: "camp",
    name: "Camp Month",
    tagline: "Extra. Theatrical. Delightfully unnecessary.",
    discoveryLine: "This channel is serving… everything.",
    heroHint: "Come get your traffic — dramatically.",
    collectibleName: "Glitter Sequins",
    collectibleHint: "Sequins for profile flair — architecture ready, economy later.",
    cssAttr: "camp",
    accents: { primary: "#ff4fb8", secondary: "#ffc53d" },
  },
];

/** Active default until admin/SystemSetting override is wired. */
export const DEFAULT_THEME_SLUG = "rainbow";

export function getThemeBySlug(slug?: string | null): MonthlyTheme {
  const found = MONTHLY_THEMES.find((t) => t.slug === slug);
  return found ?? MONTHLY_THEMES.find((t) => t.slug === DEFAULT_THEME_SLUG)!;
}

export async function getActiveMonthlyTheme(): Promise<MonthlyTheme> {
  try {
    const { prisma } = await import("@/lib/db");
    const row = await prisma.systemSetting.findUnique({
      where: { key: "experience.monthly_theme" },
    });
    if (row?.valueJson) {
      const parsed = JSON.parse(row.valueJson) as { slug?: string };
      if (parsed.slug) return getThemeBySlug(parsed.slug);
    }
  } catch {
    /* fall through — config file default */
  }
  return getThemeBySlug(DEFAULT_THEME_SLUG);
}
