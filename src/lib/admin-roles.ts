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

// Role assignment (founder-only action "set_user_role").
// The founder may move a non-founder account between member, moderator and
// admin. Founder accounts and the founder role itself are outside this
// action's reach; self-demotion is refused.
export const ASSIGNABLE_ROLES = ["member", "moderator", "admin"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function canAssignUserRole(
  actorRole: string | undefined | null,
  targetRole: string | undefined | null,
  nextRole: string,
): { ok: boolean; reason?: string } {
  if (actorRole !== "founder") return { ok: false, reason: "only the founder can change roles" };
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(nextRole)) {
    return { ok: false, reason: "target role is not assignable here" };
  }
  if (targetRole === "founder") return { ok: false, reason: "founder accounts are outside this action" };
  if (targetRole === nextRole) return { ok: false, reason: "role is already " + nextRole };
  return { ok: true };
}
