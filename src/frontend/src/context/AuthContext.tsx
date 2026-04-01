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
  isSuperUser: boolean;
  activeCompanyId: string | null;
  assignedCompanyId: string | null;
  activeWarehouseId: string | null;
  assignedWarehouseIds: string[];
  assignedShopIds: string[];
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (module: string) => boolean;
  setActiveWarehouse: (id: string | null) => void;
  setActiveCompany: (id: string | null) => void;
  getAccessibleShopIds: () => string[];
  getAccessibleWarehouseIds: () => string[];
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

      const isSuperUser = user.isSuperUser === true;
      const assignedCompanyId = user.assignedCompanyId ?? null;

      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        roleName: role.name,
        permissions: role.permissions,
        isSuperUser,
        activeCompanyId: isSuperUser ? null : assignedCompanyId,
        assignedCompanyId,
        activeWarehouseId: null,
        assignedWarehouseIds: user.assignedWarehouseIds ?? [],
        assignedShopIds: user.assignedShopIds ?? [],
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

  const setActiveWarehouse = useCallback((id: string | null) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, activeWarehouseId: id };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setActiveCompany = useCallback((id: string | null) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, activeCompanyId: id };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getAccessibleShopIds = useCallback((): string[] => {
    if (!currentUser) return [];
    if (currentUser.assignedShopIds.length > 0)
      return currentUser.assignedShopIds;
    // if has specific warehouses, get all shops in those
    if (currentUser.assignedWarehouseIds.length > 0) {
      try {
        const shops = JSON.parse(localStorage.getItem("bizpos_shops") || "[]");
        return shops
          .filter((s: { warehouseId: string }) =>
            currentUser.assignedWarehouseIds.includes(s.warehouseId),
          )
          .map((s: { id: string }) => s.id);
      } catch {
        return [];
      }
    }
    return []; // no restriction
  }, [currentUser]);

  const getAccessibleWarehouseIds = useCallback((): string[] => {
    if (!currentUser) return [];
    return currentUser.assignedWarehouseIds;
  }, [currentUser]);

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
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        hasPermission,
        setActiveWarehouse,
        setActiveCompany,
        getAccessibleShopIds,
        getAccessibleWarehouseIds,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
