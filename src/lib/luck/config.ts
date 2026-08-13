import { getSetting, setSetting } from "@/lib/settings/economy";

export type LuckActivityWeights = {
  surfComplete: number;
  websiteAdded: number;
  campaignCreated: number;
  placementPurchased: number;
  referralActivated: number;
  questCompleted: number;
  streakDay: number;
  mailOpened: number;
  dailyReturn: number;
  dropClaimed: number;
  wheelSpin: number;
};

export type DropConfig = {
  enabled: boolean;
  chancePerSurfBps: number; // basis points: 100 = 1%
  ttlSeconds: number;
  maxPending: number;
  cooldownSeconds: number;
};

export type JackpotConfig = {
  enabled: boolean;
  chancePerActivityBps: number;
  cooldownSeconds: number;
  maxDailyPerUser: number;
  maxDailyGlobal: number;
  rewards: { type: string; value: number; label: string; weight: number }[];
};

export type WheelConfig = {
  enabled: boolean;
  dailyLoginSpin: boolean;
  surfSpinsEvery: number; // grant 1 spin every N completed surfs (0 = off)
};

export type LuckEngineConfig = {
  weights: LuckActivityWeights;
  drops: DropConfig;
  jackpot: JackpotConfig;
  wheel: WheelConfig;
  mantra: string;
};

export const DEFAULT_LUCK_ENGINE: LuckEngineConfig = {
  mantra: "Surf. Spark. Share. Get Lucky.",
  weights: {
    surfComplete: 2,
    websiteAdded: 8,
    campaignCreated: 10,
    placementPurchased: 12,
    referralActivated: 25,
    questCompleted: 15,
    streakDay: 5,
    mailOpened: 1,
    dailyReturn: 3,
    dropClaimed: 4,
    wheelSpin: 2,
  },
  drops: {
    enabled: true,
    chancePerSurfBps: 800, // 8%
    ttlSeconds: 90,
    maxPending: 1,
    cooldownSeconds: 120,
  },
  jackpot: {
    enabled: true,
    chancePerActivityBps: 50, // 0.5%
    cooldownSeconds: 3600,
    maxDailyPerUser: 2,
    maxDailyGlobal: 50,
    rewards: [
      { type: "hits", value: 100, label: "+100 Hits", weight: 40 },
      { type: "hits", value: 250, label: "+250 Hits", weight: 25 },
      { type: "hits", value: 500, label: "+500 Hits", weight: 10 },
      { type: "multiplier", value: 200, label: "2X Surf Credits · 30 min", weight: 15 },
      { type: "luck", value: 40, label: "+40 Luck", weight: 10 },
    ],
  },
  wheel: {
    enabled: true,
    dailyLoginSpin: true,
    surfSpinsEvery: 15,
  },
};

export async function getLuckEngineConfig(): Promise<LuckEngineConfig> {
  const stored = await getSetting<Partial<LuckEngineConfig>>("luck_engine", {});
  return {
    ...DEFAULT_LUCK_ENGINE,
    ...stored,
    weights: { ...DEFAULT_LUCK_ENGINE.weights, ...(stored.weights ?? {}) },
    drops: { ...DEFAULT_LUCK_ENGINE.drops, ...(stored.drops ?? {}) },
    jackpot: { ...DEFAULT_LUCK_ENGINE.jackpot, ...(stored.jackpot ?? {}) },
    wheel: { ...DEFAULT_LUCK_ENGINE.wheel, ...(stored.wheel ?? {}) },
  };
}

export async function setLuckEngineConfig(
  patch: Partial<LuckEngineConfig>,
  updatedBy?: string,
) {
  const current = await getLuckEngineConfig();
  const next: LuckEngineConfig = {
    ...current,
    ...patch,
    weights: { ...current.weights, ...(patch.weights ?? {}) },
    drops: { ...current.drops, ...(patch.drops ?? {}) },
    jackpot: { ...current.jackpot, ...(patch.jackpot ?? {}) },
    wheel: { ...current.wheel, ...(patch.wheel ?? {}) },
  };
  await setSetting("luck_engine", next, updatedBy);
  return next;
}

export const DEFAULT_LUCK_LEVELS = [
  { slug: "spark", name: "Spark", minLuck: 0, sortOrder: 1, icon: "✨", description: "Your first spark of glitter." },
  { slug: "twinkle", name: "Twinkle", minLuck: 50, sortOrder: 2, icon: "🌟", description: "A little light finds you." },
  { slug: "glow", name: "Glow", minLuck: 150, sortOrder: 3, icon: "💫", description: "You're starting to shine." },
  { slug: "shine", name: "Shine", minLuck: 350, sortOrder: 4, icon: "🔆", description: "Bright enough to be seen." },
  { slug: "radiant", name: "Radiant", minLuck: 700, sortOrder: 5, icon: "🌈", description: "Radiance follows you." },
  { slug: "brilliant", name: "Brilliant", minLuck: 1200, sortOrder: 6, icon: "💎", description: "Brilliant luck energy." },
  { slug: "diamond", name: "Diamond", minLuck: 2000, sortOrder: 7, icon: "💠", description: "Hard sparkle, soft heart." },
  { slug: "glitter-royalty", name: "Glitter Royalty", minLuck: 3200, sortOrder: 8, icon: "👑", description: "Crowned in glitter." },
  { slug: "lucky-legend", name: "Lucky Legend", minLuck: 5000, sortOrder: 9, icon: "🦄", description: "Legend of the runway." },
  { slug: "sacred-spark", name: "Sacred Spark", minLuck: 8000, sortOrder: 10, icon: "🔮", description: "Sacred Luck Universe spark." },
];
