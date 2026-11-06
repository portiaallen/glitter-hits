import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminRole, isStaffRole } from "@/lib/admin-roles";

export { ADMIN_ROLES, STAFF_ROLES, isStaffRole, isAdminRole } from "@/lib/admin-roles";

// Full admin surface: admin and founder only. Economy, credits, monetization,
// brand directory and platform config stay restricted to these roles.
export async function requireAdminSession() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !isAdminRole(role)) {
    redirect("/login");
  }
  return session;
}

// Staff access: moderators as well as admins. Moderation, inventory,
// diagnostics, member support and reports.
export async function requireStaffSession() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !isStaffRole(role)) {
    redirect("/login");
  }
  return session;
}
