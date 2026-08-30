import Link from "next/link";
import { prisma } from "@/lib/db";

export async function AnnouncementBanner() {
  const now = new Date();
  const items = await prisma.announcement.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  if (items.length === 0) return null;

  return (
    <div className="border-b border-[var(--border-glass)] bg-[var(--theme-wash)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6">
        {items.map((a) => {
          const isGift = a.title.toLowerCase().startsWith("surprise gift");
          return (
            <div
              key={a.id}
              className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
            >
              <p>
                {isGift ? (
                  <span className="gh-badge mr-2 align-middle">Surprise</span>
                ) : null}
                <span className="font-semibold text-[var(--text)]">{a.title}</span>
                <span className="text-[var(--text-muted)]"> — {a.body}</span>
              </p>
              <Link
                href={isGift ? "/surf" : "/dashboard"}
                className="text-xs text-[var(--neon-cyan)]"
              >
                {isGift ? "Explore the Hits →" : "Open app →"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
