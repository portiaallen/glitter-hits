"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FeedbackFab() {
  const pathname = usePathname();
  if (pathname?.startsWith("/feedback") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <Link href="/feedback" className="gh-feedback-fab" aria-label="Got an idea? Tell Glitter Hits">
      Got an idea?
    </Link>
  );
}
