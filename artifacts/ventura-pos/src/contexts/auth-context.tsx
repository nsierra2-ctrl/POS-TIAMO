import { createContext, useContext, ReactNode } from "react";
import { useGetMe, useLogout, getGetMeQueryKey, UsuarioPublico } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

type AuthContextType = {
  usuario: UsuarioPublico | null | undefined;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: usuario, isLoading } = useGetMe({
    query: {
      retry: 1,
      refetchOnWindowFocus: true,
      queryKey: getGetMeQueryKey(),
    },
  });

  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const logout = () => {
    const cleanup = () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      try {
        sessionStorage.clear();
        localStorage.removeItem("tiamo:mode");
        localStorage.removeItem("tiamo:token");
      } catch {}
      setLocation("/login");
    };

    logoutMutation.mutate(undefined, {
      onSuccess: cleanup,
      onError: cleanup,
    });
  };

  return (
    <AuthContext.Provider value={{ usuario, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
