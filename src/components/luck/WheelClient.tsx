"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type Segment = {
  id: string;
  label: string;
  color: string;
  rewardType: string;
  rewardValue: number;
};

export function WheelClient({
  spins,
  segments,
  history,
}: {
  spins: number;
  segments: Segment[];
  history: { id: string; rewardLabel: string; createdAt: string | Date }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localSpins, setLocalSpins] = useState(spins);

  const slice = useMemo(
    () => (segments.length ? 360 / segments.length : 360),
    [segments.length],
  );

  function spin() {
    if (localSpins < 1 || spinning || pending) return;
    setError(null);
    setResult(null);
    const clientKey = `spin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    setSpinning(true);

    startTransition(async () => {
      const res = await fetch("/api/luck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spin_wheel", clientKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Spin failed");
        setSpinning(false);
        return;
      }

      const segmentId = data.spin?.segmentId as string | undefined;
      const idx = Math.max(
        0,
        segments.findIndex((s) => s.id === segmentId),
      );
      const target =
        360 * 5 + (360 - idx * slice - slice / 2);
      setRotation(target);
      setLocalSpins((s) => Math.max(0, s - (data.replay ? 0 : 1)));

      window.setTimeout(() => {
        setResult(data.spin?.rewardLabel || data.segment?.label || "Reward!");
        setSpinning(false);
        router.refresh();
      }, 3200);
    });
  }

  return (
    <div className="space-y-6">
      <div className="gh-glass flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Available spins</p>
          <p className="text-3xl font-bold">{localSpins}</p>
        </div>
        <button
          type="button"
          className="gh-btn gh-btn-primary"
          disabled={localSpins < 1 || spinning || pending}
          onClick={spin}
        >
          {spinning ? "Spinning…" : "Spin the Wheel"}
        </button>
      </div>

      <div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-2xl">▼</div>
        <div
          className="gh-wheel h-full w-full rounded-full border-4 border-white/20"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 3s cubic-bezier(0.12, 0.75, 0.12, 1)" : undefined,
            background: `conic-gradient(${segments
              .map((s, i) => `${s.color} ${i * slice}deg ${(i + 1) * slice}deg`)
              .join(", ")})`,
          }}
        />
      </div>

      {result ? (
        <p className="text-center font-[family-name:var(--font-syne)] text-xl text-[var(--neon-gold)]">
          ✨ {result}
        </p>
      ) : null}
      {error ? <p className="text-center text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="gh-glass p-5">
        <h2 className="font-semibold">Recent spins</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {history.length === 0 && (
            <li className="text-[var(--text-muted)]">No spins yet — earn them by surfing.</li>
          )}
          {history.map((h) => (
            <li key={h.id} className="flex justify-between gap-3 border-b border-white/5 pb-2">
              <span>{h.rewardLabel}</span>
              <span className="text-xs text-white/40">
                {new Date(h.createdAt).toISOString().slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
