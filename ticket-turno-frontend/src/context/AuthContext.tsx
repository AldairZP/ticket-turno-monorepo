import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from "../services/authStorage";

interface AuthContextValue {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getAdminToken(),
  );

  const login = useCallback((token: string) => {
    setAdminToken(token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setAccessToken(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
    }),
    [accessToken, login, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contextValue = useContext(AuthContext);

  if (!contextValue) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return contextValue;
}
