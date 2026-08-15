import { prisma } from "@/lib/db";

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[::1\]$/,
  /^metadata\.google\.internal$/i,
];

const SUSPICIOUS_PATH_HINTS = [
  "phishing",
  "malware",
  "steal-password",
  "free-crypto-giveaway-scam",
];

export type SiteCheckResult = {
  ok: boolean;
  httpsOk: boolean;
  status: "approved" | "pending" | "rejected";
  notes: string[];
};

function hostBlocked(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((re) => re.test(hostname));
}

/**
 * Hardened URL validation for launch.
 * Rejects clearly unsafe URLs; queues ambiguous ones for admin review.
 */
export async function validateWebsiteUrl(url: string): Promise<SiteCheckResult> {
  const notes: string[] = [];

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, httpsOk: false, status: "rejected", notes: ["Invalid URL."] };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      ok: false,
      httpsOk: false,
      status: "rejected",
      notes: ["Only http/https URLs are allowed."],
    };
  }

  const httpsOk = parsed.protocol === "https:";
  if (!httpsOk) notes.push("URL is not HTTPS.");

  if (hostBlocked(parsed.hostname)) {
    return {
      ok: false,
      httpsOk,
      status: "rejected",
      notes: ["Private / local network hosts are not allowed."],
    };
  }

  const lower = url.toLowerCase();
  for (const hint of SUSPICIOUS_PATH_HINTS) {
    if (lower.includes(hint)) {
      notes.push(`Suspicious content signal: ${hint}`);
      return { ok: false, httpsOk, status: "pending", notes };
    }
  }

  // Excessive subdomain depth or IP-literal hosts → review
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
    notes.push("Raw IP host — requires review.");
  }
  if (parsed.hostname.split(".").length > 5) {
    notes.push("Unusual hostname depth — requires review.");
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "GlitterHits-SiteChecker/1.0 (+https://glitterhits.online)" },
      });
    } catch {
      res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "GlitterHits-SiteChecker/1.0 (+https://glitterhits.online)",
          Accept: "text/html",
        },
      });
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      notes.push(`Redirect detected (${res.status}).`);
      const loc = res.headers.get("location");
      if (loc) {
        try {
          const target = new URL(loc, url);
          if (target.protocol !== "https:") {
            notes.push("Redirect target is not HTTPS.");
          }
          if (hostBlocked(target.hostname)) {
            return {
              ok: false,
              httpsOk: false,
              status: "rejected",
              notes: [...notes, "Redirects to private/local host."],
            };
          }
          if (target.hostname !== parsed.hostname) {
            notes.push(`Cross-domain redirect to ${target.hostname}.`);
          }
        } catch {
          notes.push("Malformed redirect location.");
        }
      }
    }

    if (res.status >= 400) {
      notes.push(`URL returned HTTP ${res.status}.`);
      return { ok: false, httpsOk, status: "pending", notes };
    }

    const ctype = res.headers.get("content-type") || "";
    if (ctype && !/(text\/html|application\/xhtml)/i.test(ctype) && res.status < 300) {
      notes.push(`Unexpected content-type: ${ctype.split(";")[0]}`);
    }
  } catch {
    notes.push("Could not reach URL — queued for admin review.");
    return { ok: false, httpsOk, status: "pending", notes };
  }

  // Public launch default: queue for human moderation unless explicitly opted in.
  // Set MODERATION_AUTO_APPROVE=true only for trusted internal environments.
  const autoApprove = process.env.MODERATION_AUTO_APPROVE === "true";
  if (autoApprove && httpsOk && notes.length === 0) {
    return { ok: true, httpsOk, status: "approved", notes };
  }

  if (httpsOk && notes.length === 0) {
    notes.push("Queued for human moderation (public launch policy).");
  }

  // Soft-reject non-HTTPS with other issues
  if (!httpsOk && notes.length > 1) {
    return { ok: false, httpsOk, status: "pending", notes };
  }

  return { ok: true, httpsOk, status: "pending", notes };
}

export async function bumpRiskScore(userId: string, delta: number, reason: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { riskScore: { increment: Math.trunc(delta) } },
  });

  if (user.riskScore >= 100 && !user.isSuspended) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedReason: `Auto-flagged for review: ${reason}`,
      },
    });
  }

  return user;
}
