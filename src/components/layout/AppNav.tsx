"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/surf", label: "Explore" },
  { href: "/luck", label: "Luck" },
  { href: "/websites", label: "Sites" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/promote", label: "Promote" },
  { href: "/mail", label: "Mail" },
  { href: "/store", label: "Store" },
  { href: "/notifications", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

const mobileLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/surf", label: "Explore" },
  { href: "/luck", label: "Luck" },
  { href: "/campaigns", label: "Promote" },
  { href: "/feedback", label: "Ideas" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="App" className="gh-glass mb-6 hidden overflow-x-auto p-2 md:block">
        <ul className="flex min-w-max gap-1">
          {primaryLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-xl px-3 py-2 text-sm transition",
                    active
                      ? "bg-[var(--theme-wash)] font-semibold text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text)]",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-glass)] bg-white/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
          {mobileLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-medium transition",
                    active
                      ? "bg-[var(--theme-wash)] text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
