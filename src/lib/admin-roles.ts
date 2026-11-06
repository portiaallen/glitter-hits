// Role tiers for the admin console.
//
// moderator: moderation queue, site/campaign inventory, diagnostics and
// reports, member support. No economy, credits, monetization, brand or
// platform-config writes.
// admin/founder: full admin surface.
export const STAFF_ROLES = ["moderator", "admin", "founder"] as const;
export const ADMIN_ROLES = ["admin", "founder"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isStaffRole(role: string | undefined | null): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

// GET /api/admin views a moderator may read.
export const MODERATOR_API_VIEWS = new Set(["overview", "moderation", "users"]);
// POST /api/admin actions a moderator may perform.
export const MODERATOR_API_ACTIONS = new Set(["moderate_website", "set_user_suspended"]);
