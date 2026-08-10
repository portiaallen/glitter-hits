import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = new Set(["admin", "founder", "moderator"]);

export async function requireAdminSession() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !role || !ADMIN_ROLES.has(role)) {
    redirect("/login");
  }
  return session;
}
