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

export function isAuthenticated(): boolean {
  return activeUser !== undefined;
}

export function resolveUserDisplayName(userId: string | undefined): string | undefined {
  if (!userId) return undefined;
  if (userId === activeUser?.id) return activeUser.displayName;
  return userId;
}
