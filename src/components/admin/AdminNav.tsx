"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sites", label: "Sites" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/credits", label: "Credits" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="gh-glass mb-8 overflow-x-auto p-2" aria-label="Admin sections">
      <ul className="flex min-w-max gap-1">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={
                  active
                    ? "gh-btn gh-btn-primary px-4 py-2 text-sm"
                    : "gh-btn gh-btn-ghost px-4 py-2 text-sm"
                }
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
