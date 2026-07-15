import type { User } from "@/types/entities";

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

/** Repository write guard (Technical Audit, Section 2). Stage 0/1 always
 *  has the stubbed system user active, so this is currently always true —
 *  real authentication (Roadmap Phase 1 "Future" / Phase 8) will make this
 *  reflect an actual signed-in session without touching any caller. */
export function isAuthenticated(): boolean {
  return activeUser !== undefined;
}

/**
 * Resolves a stored `createdBy`/attribution user id to a display name, or
 * `undefined` if it can't be resolved (the caller decides the fallback
 * copy — this service has no i18n opinions). Stage 0/1/2 only ever have
 * ONE stubbed user, so thi
