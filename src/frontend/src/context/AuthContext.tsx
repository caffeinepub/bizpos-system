import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const SESSION_KEY = "bizpos_session";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  const login = useCallback((email: string, password: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem("bizpos_users") || "[]");
      const roles = JSON.parse(localStorage.getItem("bizpos_roles") || "[]");

      const user = users.find(
        (u: { email: string; password: string; status: string }) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password &&
          u.status === "Active",
      );

      if (!user) return false;

      const role = roles.find((r: { id: string }) => r.id === user.roleId);
      if (!role) return false;

      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        roleName: role.name,
        permissions: role.permissions,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      setCurrentUser(authUser);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }, []);

  const hasPermission = useCallback(
    (module: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.permissions.includes("all")) return true;
      return currentUser.permissions.includes(module);
    },
    [currentUser],
  );

  // Sync session changes from other tabs
  useEffect(() => {
    const handler = () => {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) setCurrentUser(null);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
