import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listNotifications,
  markNotificationsRead,
  unreadNotificationCount,
} from "@/lib/notifications/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listNotifications(session.user.id),
    unreadNotificationCount(session.user.id),
  ]);

  return NextResponse.json({ items, unread });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : undefined;

  await markNotificationsRead(session.user.id, ids);
  return NextResponse.json({ ok: true });
}
