import { createContext, ReactNode, useContext, useState } from "react";
import type { User } from "@/types/entities";
import { currentUser, setCurrentUser } from "@/services/auth/authContext";

/**
 * AuthContext stub — React-side (Section 12). Deliberately minimal: a
 * single always-authenticated system user. Real authentication (Roadmap
 * Phase 1 "Future" / Phase 8) replaces `login`/`logout` internals only;
 * every consumer of `useAuth()` stays unchanged.
 */
interface AuthContextValue {
  user: User | undefined;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>(currentUser());

  function login(nextUser: User) {
    setCurrentUser(nextUser);
    setUser(nextUser);
  }

  function logout() {
    setCurrentUser(undefined);
    setUser(undefined);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
