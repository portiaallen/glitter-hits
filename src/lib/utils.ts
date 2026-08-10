import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCredits(amount: number): string {
  return new Intl.NumberFormat("en-US").format(Math.trunc(amount));
}

export function assertIntegerCredits(amount: number): number {
  if (!Number.isInteger(amount)) {
    throw new Error("Glitter Hits credits must be integers — no floating-point balances.");
  }
  return amount;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function generateReferralCode(name?: string | null): string {
  const base = slugify(name || "glitter").slice(0, 8) || "glitter";
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${base}-${rand}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject<T extends Record<string, unknown>>(
  value: string,
  fallback: T,
): T {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}
