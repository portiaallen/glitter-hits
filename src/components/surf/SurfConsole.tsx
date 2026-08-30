"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatCredits } from "@/lib/utils";

type SurfSession = {
  id: string;
  creditsEarned?: number;
  sitesViewed?: number;
  sitesSkipped?: number;
  status?: string;
};

type SurfSite = {
  visitId: string;
  campaignId: string;
  website: {
    id: string;
    title: string;
    url: string;
    description?: string | null;
  };
  requiredDurationSec: number;
  creditsEarnedIfComplete: number;
};

type SessionStats = {
  creditsEarned: number;
  sitesViewed: number;
  sitesSkipped: number;
};

async function postJson<T>(url: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `Request failed (${res.status})`,
    );
  }
  return data as T;
}

function deviceHint() {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

const REACTIONS = ["Love it", "Curious", "Weird (in a good way)", "Bookmark vibe"] as const;

export function SurfConsole({
  themeLine = "Next channel: something you didn't expect.",
  dailyGoal = 5,
}: {
  themeLine?: string;
  dailyGoal?: number;
}) {
  const [session, setSession] = useState<SurfSession | null>(null);
  const [site, setSite] = useState<SurfSite | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"iframe" | "external">("iframe");
  const [iframeBroken, setIframeBroken] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [channelKey, setChannelKey] = useState(0);
  const [stats, setStats] = useState<SessionStats>({
    creditsEarned: 0,
    sitesViewed: 0,
    sitesSkipped: 0,
  });

  const completingRef = useRef(false);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);
  const iframeTimerRef = useRef<number | null>(null);

  const loadNext = useCallback(async (sessionId: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setReaction(null);
    completingRef.current = false;
    try {
      const data = await postJson<{
        empty?: boolean;
        message?: string;
        visitId?: string;
        campaignId?: string;
        website?: SurfSite["website"];
        requiredDurationSec?: number;
        creditsEarnedIfComplete?: number;
      }>("/api/surf/next", { sessionId });

      if (data.empty || !data.visitId || !data.website) {
        setSite(null);
        setRemaining(0);
        setElapsed(0);
        setMessage(data.message || "No eligible campaigns right now. Try again soon.");
        return;
      }

      const nextSite: SurfSite = {
        visitId: data.visitId,
        campaignId: data.campaignId!,
        website: data.website,
        requiredDurationSec: data.requiredDurationSec ?? 15,
        creditsEarnedIfComplete: data.creditsEarnedIfComplete ?? 1,
      };
      setSite(nextSite);
      setChannelKey((k) => k + 1);
      setRemaining(nextSite.requiredDurationSec);
      setElapsed(0);
      elapsedRef.current = 0;
      startedAtRef.current = Date.now();
      pausedAccumRef.current = 0;
      pauseStartedRef.current = null;
      setPaused(false);
      setViewMode("iframe");
      setIframeBroken(false);
      if (iframeTimerRef.current) window.clearTimeout(iframeTimerRef.current);
      iframeTimerRef.current = window.setTimeout(() => {
        setIframeBroken(true);
      }, 4500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load next site");
    } finally {
      setBusy(false);
    }
  }, []);

  const startSession = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await postJson<{ session: SurfSession }>("/api/surf/session", {
        deviceHint: deviceHint(),
      });
      setSession(data.session);
      setStats({
        creditsEarned: data.session.creditsEarned ?? 0,
        sitesViewed: data.session.sitesViewed ?? 0,
        sitesSkipped: data.session.sitesSkipped ?? 0,
      });
      await loadNext(data.session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setBusy(false);
    }
  }, [loadNext]);

  const completeVisit = useCallback(async () => {
    if (!session || !site || completingRef.current) return;
    completingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const data = await postJson<{
        earned?: number;
        alreadyCredited?: boolean;
        luckFeedback?: {
          luck?: number;
          messages?: string[];
          dropId?: string;
          jackpot?: { label: string } | null;
        } | null;
      }>("/api/surf/complete", {
        sessionId: session.id,
        visitId: site.visitId,
        actualDurationSec: Math.max(elapsedRef.current, site.requiredDurationSec),
      });

      const earned = data.earned ?? (data.alreadyCredited ? 0 : site.creditsEarnedIfComplete);
      setStats((s) => ({
        ...s,
        creditsEarned: s.creditsEarned + earned,
        sitesViewed: s.sitesViewed + (data.alreadyCredited ? 0 : 1),
      }));
      const bits = [
        earned > 0 ? `+${formatCredits(earned)} Hits collected` : "Discovery complete",
        ...(data.luckFeedback?.messages ?? []),
      ];
      setCelebrate(true);
      setMessage(bits.join(" · "));
      window.setTimeout(() => setCelebrate(false), 900);
      await loadNext(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete visit");
      completingRef.current = false;
    } finally {
      setBusy(false);
    }
  }, [loadNext, session, site]);

  useEffect(() => {
    if (!session || !site || paused || busy) return;

    const id = window.setInterval(() => {
      if (!startedAtRef.current) return;
      const pausedExtra =
        pausedAccumRef.current +
        (pauseStartedRef.current ? Date.now() - pauseStartedRef.current : 0);
      const secs = Math.floor((Date.now() - startedAtRef.current - pausedExtra) / 1000);
      elapsedRef.current = secs;
      setElapsed(secs);
      const left = Math.max(0, site.requiredDurationSec - secs);
      setRemaining(left);
      if (left === 0) {
        void completeVisit();
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [session, site, paused, busy, completeVisit]);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      void postJson("/api/surf/heartbeat", { sessionId: session.id }).catch(() => undefined);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [session]);

  async function togglePause() {
    if (!session || !site) return;
    setBusy(true);
    setError(null);
    try {
      if (paused) {
        await postJson("/api/surf/pause", { sessionId: session.id, action: "resume" });
        if (pauseStartedRef.current) {
          pausedAccumRef.current += Date.now() - pauseStartedRef.current;
          pauseStartedRef.current = null;
        }
        setPaused(false);
      } else {
        await postJson("/api/surf/pause", { sessionId: session.id, action: "pause" });
        pauseStartedRef.current = Date.now();
        setPaused(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pause failed");
    } finally {
      setBusy(false);
    }
  }

  async function skipSite() {
    if (!session || !site) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/surf/skip", {
        sessionId: session.id,
        visitId: site.visitId,
        elapsedSec: elapsedRef.current,
      });
      setStats((s) => ({ ...s, sitesSkipped: s.sitesSkipped + 1 }));
      setMessage("Skipped — tuning the next channel…");
      await loadNext(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skip failed");
    } finally {
      setBusy(false);
    }
  }

  async function reportSite() {
    if (!session || !site) return;
    const reason = window.prompt(
      "Why are you reporting this site?\n(spam, malware, broken, inappropriate, other)",
      "broken",
    );
    if (!reason) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/surf/report", {
        sessionId: session.id,
        visitId: site.visitId,
        websiteId: site.website.id,
        reason,
      });
      setMessage("Report submitted — thank you");
      await loadNext(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed");
    } finally {
      setBusy(false);
    }
  }

  function openExternal() {
    if (!site) return;
    window.open(site.website.url, "_blank", "noopener,noreferrer");
    setViewMode("external");
    setIframeBroken(false);
    setMessage("Opened externally — keep this tab focused while the timer runs.");
  }

  async function endSurf() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/surf/end", { sessionId: session.id });
      setSession(null);
      setSite(null);
      setRemaining(0);
      setElapsed(0);
      setMessage("Session ended — come explore again tomorrow.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setBusy(false);
    }
  }

  const progress =
    site && site.requiredDurationSec > 0
      ? Math.min(100, (elapsed / site.requiredDurationSec) * 100)
      : 0;
  const goalProgress = Math.min(100, (stats.sitesViewed / dailyGoal) * 100);

  return (
    <div className="space-y-4">
      <div className="gh-glass flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Discovery session
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{themeLine}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="gh-badge">Collected {formatCredits(stats.creditsEarned)} Hits</span>
            <span className="gh-badge">
              Explored {stats.sitesViewed}/{dailyGoal} today
            </span>
            <span className="gh-badge">Skipped {stats.sitesSkipped}</span>
          </div>
          <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[var(--bg-cosmic)]">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${goalProgress}%`,
                background: "var(--prism)",
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!session ? (
            <button
              type="button"
              className="gh-btn gh-btn-primary min-h-11"
              disabled={busy}
              onClick={() => void startSession()}
            >
              Start exploring
            </button>
          ) : (
            <button
              type="button"
              className="gh-btn gh-btn-ghost min-h-11"
              disabled={busy}
              onClick={() => void endSurf()}
            >
              End session
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className={`relative overflow-hidden rounded-xl border border-[var(--success)]/25 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)] ${celebrate ? "animate-celebrate" : ""}`}
        >
          {celebrate ? <span className="gh-glitter-burst" aria-hidden /> : null}
          {message}
        </p>
      ) : null}

      {session && site ? (
        <>
          <div className="gh-glass p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Now on channel
                </p>
                <h2 className="mt-1 truncate font-[family-name:var(--font-syne)] text-xl font-bold sm:text-2xl">
                  {site.website.title}
                </h2>
                {site.website.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                    {site.website.description}
                  </p>
                ) : null}
                <a
                  href={site.website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-sm text-[var(--neon-cyan)]"
                >
                  {site.website.url}
                </a>
              </div>
              <div className="text-center lg:text-right">
                <p
                  className="gh-surf-countdown font-[family-name:var(--font-syne)] text-5xl font-extrabold gh-gradient-text sm:text-6xl"
                  aria-live="polite"
                >
                  {remaining}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  seconds · +{formatCredits(site.creditsEarnedIfComplete)} Hits when complete
                </p>
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--bg-cosmic)]">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{ width: `${progress}%`, background: "var(--prism)" }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`gh-badge min-h-9 transition ${reaction === r ? "border-[var(--theme-accent)] bg-[var(--theme-wash)] text-[var(--text)]" : ""}`}
                  onClick={() => setReaction(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="gh-btn gh-btn-ghost min-h-11 px-3 py-2 text-sm"
                disabled={busy}
                onClick={() => void togglePause()}
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                className="gh-btn gh-btn-primary min-h-11 px-3 py-2 text-sm"
                disabled={busy}
                onClick={() => void skipSite()}
              >
                Next Hit
              </button>
              <button
                type="button"
                className="gh-btn gh-btn-ghost min-h-11 px-3 py-2 text-sm"
                disabled={busy}
                onClick={() => openExternal()}
              >
                Open full site
              </button>
              <button
                type="button"
                className="gh-btn gh-btn-ghost min-h-11 px-3 py-2 text-sm"
                disabled={busy}
                onClick={() => void reportSite()}
              >
                Report
              </button>
            </div>
            {iframeBroken && viewMode === "iframe" ? (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Preview may be blocked by the site.{" "}
                <button
                  type="button"
                  className="text-[var(--neon-cyan)] underline"
                  onClick={() => openExternal()}
                >
                  Open full site
                </button>{" "}
                — the timer still counts here.
              </p>
            ) : null}
          </div>

          {viewMode === "external" ? (
            <div className="gh-glass p-8 text-center">
              <p className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                Full-site discovery mode
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
                The site opened in a new tab. Stay on this page so the countdown can credit your
                visit — many sites refuse iframes.
              </p>
              <a
                href={site.website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="gh-btn gh-btn-primary mt-5 inline-flex min-h-11"
              >
                Re-open site
              </a>
              <button
                type="button"
                className="gh-btn gh-btn-ghost mt-3 ml-2 inline-flex min-h-11 text-sm"
                onClick={() => setViewMode("iframe")}
              >
                Try preview again
              </button>
            </div>
          ) : (
            <div key={channelKey} className="gh-surf-stage animate-channel p-1.5 sm:p-2">
              <div className="mb-2 flex items-center justify-between px-2 pt-1 text-xs text-[var(--text-muted)]">
                <span>Live preview</span>
                <span className="gh-badge">Honest exchange traffic</span>
              </div>
              <iframe
                title={site.website.title}
                src={site.website.url}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                className="h-[52vh] w-full rounded-[1.15rem] bg-[var(--bg-cosmic)] sm:h-[64vh]"
                onLoad={() => {
                  setIframeBroken(false);
                  if (iframeTimerRef.current) window.clearTimeout(iframeTimerRef.current);
                }}
              />
            </div>
          )}
        </>
      ) : session ? (
        <div className="gh-glass p-8 text-center">
          <p className="text-[var(--text-muted)]">
            {busy ? "Tuning the next channel…" : message || "Waiting for the next discovery."}
          </p>
          <button
            type="button"
            className="gh-btn gh-btn-primary mt-4 min-h-11"
            disabled={busy}
            onClick={() => void loadNext(session.id)}
          >
            Find next Hit
          </button>
        </div>
      ) : (
        <div className="gh-glass relative overflow-hidden p-8 text-center sm:p-12">
          <div className="gh-glitter-burst opacity-40" aria-hidden />
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold sm:text-3xl">
            Ready to discover?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-muted)]">
            Every site is a new channel. Watch the countdown, collect Hits, then get your own
            pages seen — the exchange that feels like exploration.
          </p>
        </div>
      )}
    </div>
  );
}
