/**
 * Role-tier gates for the admin console.
 * Pure helpers; no DB required.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STAFF_ROLES,
  ADMIN_ROLES,
  isStaffRole,
  isAdminRole,
  MODERATOR_API_VIEWS,
  MODERATOR_API_ACTIONS,
} from "../src/lib/admin-roles";

describe("admin role tiers", () => {
  it("treats moderator, admin and founder as staff", () => {
    assert.deepEqual([...STAFF_ROLES].sort(), ["admin", "founder", "moderator"]);
    assert.equal(isStaffRole("moderator"), true);
    assert.equal(isStaffRole("admin"), true);
    assert.equal(isStaffRole("founder"), true);
  });

  it("restricts admin-only surface to admin and founder", () => {
    assert.deepEqual([...ADMIN_ROLES].sort(), ["admin", "founder"]);
    assert.equal(isAdminRole("moderator"), false);
    assert.equal(isAdminRole("admin"), true);
    assert.equal(isAdminRole("founder"), true);
    assert.equal(isAdminRole("member"), false);
    assert.equal(isAdminRole(undefined), false);
  });

  it("denies staff surface to members and unknown roles", () => {
    assert.equal(isStaffRole("member"), false);
    assert.equal(isStaffRole("superadmin"), false);
    assert.equal(isStaffRole(undefined), false);
    assert.equal(isStaffRole(null), false);
  });

  it("keeps moderator API scope to moderation, inventory reads and member support", () => {
    for (const view of ["overview", "moderation", "users"]) {
      assert.equal(MODERATOR_API_VIEWS.has(view), true, `view ${view} should be moderator-readable`);
    }
    for (const view of ["brands", "settings"]) {
      assert.equal(MODERATOR_API_VIEWS.has(view), false, `view ${view} must stay admin-only`);
    }
    for (const action of ["moderate_website", "set_user_suspended"]) {
      assert.equal(MODERATOR_API_ACTIONS.has(action), true, `action ${action} should be moderator-writable`);
    }
    for (const action of [
      "adjust_credits",
      "update_economy",
      "toggle_monetization",
      "upsert_brand",
      "set_placement_status",
      "update_luck_engine",
      "upsert_quest",
      "update_monthly_theme",
      "surprise_gift",
    ]) {
      assert.equal(MODERATOR_API_ACTIONS.has(action), false, `action ${action} must stay admin-only`);
    }
  });
});
