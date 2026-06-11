import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, useGetMe } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "offerloots_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);

  // Setup the custom fetch auth header globally
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
  }, []);

  const { data: me, isLoading: isLoadingMe } = useGetMe({
    query: {
      queryKey: ["/api/auth/me"],
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (me) {
      setUser(me);
    }
  }, [me]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: !!token && isLoadingMe,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
