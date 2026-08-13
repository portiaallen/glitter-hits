"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/surf", label: "Surf" },
  { href: "/luck", label: "Luck" },
  { href: "/websites", label: "Websites" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/promote", label: "Promote" },
  { href: "/mail", label: "Mail" },
  { href: "/store", label: "Store" },
  { href: "/notifications", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

const mobileLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/surf", label: "Surf" },
  { href: "/luck", label: "Luck" },
  { href: "/campaigns", label: "Promote" },
  { href: "/notifications", label: "Alerts" },
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
                    "block rounded-full px-3 py-2 text-sm transition",
                    active
                      ? "bg-white/10 text-white"
                      : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white",
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(12,8,24,0.92)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
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
                    "flex flex-col items-center rounded-xl px-1 py-2 text-[11px] font-medium transition",
                    active
                      ? "bg-white/10 text-white"
                      : "text-[var(--text-muted)] hover:text-white",
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
