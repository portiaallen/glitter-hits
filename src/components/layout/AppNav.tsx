"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/surf", label: "Surf" },
  { href: "/websites", label: "Websites" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/promote", label: "Promote" },
  { href: "/mail", label: "Mail" },
  { href: "/store", label: "Store" },
  { href: "/credits", label: "Credits" },
  { href: "/achievements", label: "Achievements" },
  { href: "/invite", label: "Invite" },
  { href: "/notifications", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App"
      className="gh-glass mb-6 overflow-x-auto p-2"
    >
      <ul className="flex min-w-max gap-1">
        {links.map((link) => {
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
  );
}
