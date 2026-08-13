"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LuckEngineAdminForm({
  config,
}: {
  config: {
    mantra: string;
    drops: {
      enabled: boolean;
      chancePerSurfBps: number;
      ttlSeconds: number;
      cooldownSeconds: number;
    };
    jackpot: {
      enabled: boolean;
      chancePerActivityBps: number;
      cooldownSeconds: number;
      maxDailyPerUser: number;
      maxDailyGlobal: number;
    };
    wheel: {
      enabled: boolean;
      dailyLoginSpin: boolean;
      surfSpinsEvery: number;
    };
    weights: Record<string, number>;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      action: "update_luck_engine",
      settings: {
        mantra: String(fd.get("mantra") || ""),
        drops: {
          enabled: fd.get("dropsEnabled") === "on",
          chancePerSurfBps: Number(fd.get("dropChance") || 0),
          ttlSeconds: Number(fd.get("dropTtl") || 90),
          cooldownSeconds: Number(fd.get("dropCooldown") || 120),
        },
        jackpot: {
          enabled: fd.get("jackpotEnabled") === "on",
          chancePerActivityBps: Number(fd.get("jackpotChance") || 0),
          cooldownSeconds: Number(fd.get("jackpotCooldown") || 3600),
          maxDailyPerUser: Number(fd.get("jackpotMaxUser") || 2),
          maxDailyGlobal: Number(fd.get("jackpotMaxGlobal") || 50),
        },
        wheel: {
          enabled: fd.get("wheelEnabled") === "on",
          dailyLoginSpin: fd.get("dailyLoginSpin") === "on",
          surfSpinsEvery: Number(fd.get("surfSpinsEvery") || 15),
        },
        weights: {
          surfComplete: Number(fd.get("wSurf") || 2),
          websiteAdded: Number(fd.get("wWebsite") || 8),
          campaignCreated: Number(fd.get("wCampaign") || 10),
          streakDay: Number(fd.get("wStreak") || 5),
          questCompleted: Number(fd.get("wQuest") || 15),
        },
      },
    };

    startTransition(async () => {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setMessage("Luck Engine settings saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="gh-glass space-y-6 p-6">
      <div>
        <label className="gh-label" htmlFor="mantra">
          Mantra
        </label>
        <input
          id="mantra"
          name="mantra"
          className="gh-input"
          defaultValue={config.mantra}
        />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
        <legend className="px-1 text-sm font-semibold">Glitter Drops</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="dropsEnabled" defaultChecked={config.drops.enabled} />
          Enabled
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="gh-label" htmlFor="dropChance">
              Chance (bps)
            </label>
            <input
              id="dropChance"
              name="dropChance"
              type="number"
              className="gh-input"
              defaultValue={config.drops.chancePerSurfBps}
            />
          </div>
          <div>
            <label className="gh-label" htmlFor="dropTtl">
              TTL seconds
            </label>
            <input
              id="dropTtl"
              name="dropTtl"
              type="number"
              className="gh-input"
              defaultValue={config.drops.ttlSeconds}
            />
          </div>
          <div>
            <label className="gh-label" htmlFor="dropCooldown">
              Cooldown seconds
            </label>
            <input
              id="dropCooldown"
              name="dropCooldown"
              type="number"
              className="gh-input"
              defaultValue={config.drops.cooldownSeconds}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
        <legend className="px-1 text-sm font-semibold">Jackpot</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="jackpotEnabled"
            defaultChecked={config.jackpot.enabled}
          />
          Enabled
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="gh-label" htmlFor="jackpotChance">
              Chance (bps)
            </label>
            <input
              id="jackpotChance"
              name="jackpotChance"
              type="number"
              className="gh-input"
              defaultValue={config.jackpot.chancePerActivityBps}
            />
          </div>
          <div>
            <label className="gh-label" htmlFor="jackpotCooldown">
              Cooldown
            </label>
            <input
              id="jackpotCooldown"
              name="jackpotCooldown"
              type="number"
              className="gh-input"
              defaultValue={config.jackpot.cooldownSeconds}
            />
          </div>
          <div>
            <label className="gh-label" htmlFor="jackpotMaxUser">
              Max / user / day
            </label>
            <input
              id="jackpotMaxUser"
              name="jackpotMaxUser"
              type="number"
              className="gh-input"
              defaultValue={config.jackpot.maxDailyPerUser}
            />
          </div>
          <div>
            <label className="gh-label" htmlFor="jackpotMaxGlobal">
              Max global / day
            </label>
            <input
              id="jackpotMaxGlobal"
              name="jackpotMaxGlobal"
              type="number"
              className="gh-input"
              defaultValue={config.jackpot.maxDailyGlobal}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
        <legend className="px-1 text-sm font-semibold">Wheel</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="wheelEnabled" defaultChecked={config.wheel.enabled} />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="dailyLoginSpin"
            defaultChecked={config.wheel.dailyLoginSpin}
          />
          Daily login spin
        </label>
        <div>
          <label className="gh-label" htmlFor="surfSpinsEvery">
            Spin every N surfs
          </label>
          <input
            id="surfSpinsEvery"
            name="surfSpinsEvery"
            type="number"
            className="gh-input"
            defaultValue={config.wheel.surfSpinsEvery}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
        <legend className="px-1 text-sm font-semibold">Luck weights</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["wSurf", "Surf", config.weights.surfComplete],
              ["wWebsite", "Website", config.weights.websiteAdded],
              ["wCampaign", "Campaign", config.weights.campaignCreated],
              ["wStreak", "Streak day", config.weights.streakDay],
              ["wQuest", "Quest", config.weights.questCompleted],
            ] as const
          ).map(([name, label, val]) => (
            <div key={name}>
              <label className="gh-label" htmlFor={name}>
                {label}
              </label>
              <input
                id={name}
                name={name}
                type="number"
                className="gh-input"
                defaultValue={val}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" className="gh-btn gh-btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save Luck Engine"}
      </button>
    </form>
  );
}
