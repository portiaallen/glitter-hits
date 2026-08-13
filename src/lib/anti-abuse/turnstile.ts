/**
 * Cloudflare Turnstile verification.
 * When keys are unset, verification is skipped (dev only).
 * In production, keys SHOULD be set — see launch checklist.
 */
export async function verifyTurnstileToken(token: string | null | undefined, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const allowInsecure = process.env.ALLOW_INSECURE_AUTH === "true";
  const required =
    (isProd && !allowInsecure) ||
    process.env.REQUIRE_TURNSTILE === "true" ||
    Boolean(secret);

  if (!secret) {
    if (required) {
      return { ok: false as const, error: "Bot protection is misconfigured." };
    }
    return { ok: true as const, skipped: true as const };
  }

  if (!token) {
    return { ok: false as const, error: "Please complete the security check." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip) body.set("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
  if (!data.success) {
    return { ok: false as const, error: "Security check failed. Try again." };
  }
  return { ok: true as const, skipped: false as const };
}

export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
}
