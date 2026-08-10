"use client";

import { useState } from "react";
import { formatCredits } from "@/lib/utils";

type ReferralPanelProps = {
  referralCode: string;
  referralUrl: string;
  signupBonus?: number;
  qualifiedBonus?: number;
};

export function ReferralPanel({
  referralCode,
  referralUrl,
  signupBonus = 5,
  qualifiedBonus = 25,
}: ReferralPanelProps) {
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  async function copy(value: string, kind: "code" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="gh-glass space-y-5 p-6">
      <div>
        <p className="gh-badge mb-3">Invite friends</p>
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
          Share your Glitter Hits code
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Earn {formatCredits(signupBonus)} Hits when someone joins with your code,
          plus {formatCredits(qualifiedBonus)} more when they complete meaningful surfing.
        </p>
      </div>

      <div>
        <label className="gh-label" htmlFor="referral-code">
          Referral code
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="referral-code"
            className="gh-input font-mono"
            readOnly
            value={referralCode}
          />
          <button
            type="button"
            className="gh-btn gh-btn-ghost shrink-0"
            onClick={() => copy(referralCode, "code")}
          >
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
        </div>
      </div>

      <div>
        <label className="gh-label" htmlFor="referral-url">
          Invite link
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="referral-url"
            className="gh-input font-mono text-sm"
            readOnly
            value={referralUrl}
          />
          <button
            type="button"
            className="gh-btn gh-btn-primary shrink-0"
            onClick={() => copy(referralUrl, "url")}
          >
            {copied === "url" ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
