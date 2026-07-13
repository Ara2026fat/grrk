import type { User } from "@/types/entities";

/**
 * AuthContext stub (Section 12: "define the User and Role types and an
 * AuthContext interface now ... so wiring in real auth later doesn't
 * require touching every module").
 *
 * Every repository write goes through `currentUser()` to attribute the
 * change. Today it returns a single hardcoded system user; when real
 * authentication (Roadmap Phase 1 "Future" / Phase 8) is implemented, this
 * function is the ONLY place that changes — it starts reading from a real
 * session instead of the stub below.
 */
let activeUser: User | undefined = {
  id: "system-user",
  displayName: "System",
  email: "system@grrk.local",
  roleId: "system",
  preferredLanguage: "ar",
};

export function currentUser(): User | undefined {
  return activeUser;
}

export function setCurrentUser(user: User | undefined): void {
  activeUser = user;
}

/**
 * Resolves a stored `createdBy`/attribution user id to a display name, or
 * `undefined` if it can't be resolved (the caller decides the fallback
 * copy — this service has no i18n opinions). Stage 0/1/2 only ever have
 * ONE stubbed user, so this can only recognize that user or return the
 * raw id — a full user directory is Roadmap Phase 8 (System
 * Administration). Centralized here so every "who did this" label
 * resolves the same way, and wiring in a real user directory later is a
 * one-function change.
 */
export function resolveUserDisplayName(userId: string | undefined): string | undefined {
  if (!userId) return undefined;
  if (userId === activeUser?.id) return activeUser.displayName;
  return userId;
}
