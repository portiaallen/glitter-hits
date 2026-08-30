"use client";

import { useEffect, useState } from "react";

export function LuckMeter({
  levelName,
  levelIcon,
  levelNumber,
  progressPct,
  luckPoints,
  animate,
}: {
  levelName: string;
  levelIcon: string;
  levelNumber: number;
  progressPct: number;
  luckPoints: number;
  animate?: boolean;
}) {
  const [spark, setSpark] = useState(false);
  useEffect(() => {
    if (!animate) return;
    setSpark(true);
    const t = window.setTimeout(() => setSpark(false), 1200);
    return () => window.clearTimeout(t);
  }, [animate, luckPoints]);

  const filled = Math.round(progressPct / 10);
  const bar = "█".repeat(filled) + "░".repeat(Math.max(0, 10 - filled));

  return (
    <div className={`gh-glass relative overflow-hidden p-5 ${spark ? "gh-luck-spark" : ""}`}>
      {spark ? <div className="gh-glitter-burst" aria-hidden /> : null}
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Your Glitter Status</p>
      <p className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold sm:text-2xl">
        {levelIcon} Luck Level {levelNumber} — {levelName}
      </p>
      <p className="mt-3 font-mono text-sm tracking-widest text-[var(--neon-gold)]">
        {bar} {progressPct}%
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{luckPoints} Luck points</p>
    </div>
  );
}
