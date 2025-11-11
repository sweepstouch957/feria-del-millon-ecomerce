/* eslint-disable @typescript-eslint/no-explicit-any */
// providers/AuthProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  useRef,
} from "react";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter, usePathname } from "next/navigation";

import {
  login as loginApi,
  register as registerApi,
  me as meApi,
  logout as logoutApi,
  AuthUser,
  setAuthHeaderFromCookie,
  clearAuth,
} from "@services/auth.service";
import { AUTH_TOKEN_KEY } from "@core/constants";

type AuthContextType = {
  user: AuthUser | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Persistencia en cliente
const USER_STORAGE_KEY = "auth_user";
// Última ruta pública visitada (para salir del /login si ya hay sesión)
const LAST_PUBLIC_PATH_KEY = "last_public_path";

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ["/checkout", "/account", "/orders", "/me", "/artist"];

// ¿El path actual es protegido?
function isProtectedPath(pathname?: string | null) {
  if (!pathname) return false;
  return PROTECTED_ROUTES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
}

function getRedirectParam() {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get("redirect");
}

function rememberLastPublicPath(pathname?: string | null) {
  if (typeof window === "undefined" || !pathname) return;
  // Solo guardamos rutas NO protegidas y que no sean /login o /register
  if (
    !isProtectedPath(pathname) &&
    pathname !== "/login" &&
    pathname !== "/register"
  ) {
    sessionStorage.setItem(LAST_PUBLIC_PATH_KEY, pathname);
  }
}

function getLastPublicPath() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(LAST_PUBLIC_PATH_KEY);
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const loggingOutRef = useRef(false);

  const hasToken = () => Boolean(Cookies.get(AUTH_TOKEN_KEY));
  const isAuthenticated = !!user && hasToken();

  // Setea Authorization desde cookie si existe
  useEffect(() => {
    setAuthHeaderFromCookie();
  }, []);

  // Hidratar user desde localStorage
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(USER_STORAGE_KEY)
          : null;
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  // Guardar última ruta pública visitada (para sacar del /login si ya está dentro)
  useEffect(() => {
    rememberLastPublicPath(pathname);
  }, [pathname]);

  // Guard + verificación con /me
  useEffect(() => {
    const run = async () => {
      if (!hydrated || loggingOutRef.current) return;

      const onProtected = isProtectedPath(pathname);
      const onAuthPages = pathname === "/login" || pathname === "/register";

      // Sin token
      if (!hasToken()) {
        setIsAuthLoading(false);
        // Público: dejar pasar
        if (!onProtected) return;

        // Protegido: redirigir a login con redirect
        if (typeof window !== "undefined") {
          const target = encodeURIComponent(pathname || "/");
          router.replace(`/login?redirect=${target}`);
        }
        return;
      }

      // Con token → validar /me
      try {
        setIsAuthLoading(true);
        const me = await meApi();
        setUser(me);
        try {
          window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
        } catch {}

        // Si ya está logueado y visita /login o /register → sacarlo
        if (onAuthPages) {
          const fromParam = getRedirectParam();
          const lastPublic = getLastPublicPath();
          const fallback = "/";
          const destination = fromParam || lastPublic || fallback;
          router.replace(destination);
        }
      } catch {
        // Token inválido/expirado
        clearAuth();
        try {
          window.localStorage.removeItem(USER_STORAGE_KEY);
        } catch {}
        setUser(null);

        // Si está en protegida, llévalo a login con redirect
        if (onProtected && typeof window !== "undefined") {
          const target = encodeURIComponent(pathname || "/");
          router.replace(`/login?redirect=${target}`);
        }
      } finally {
        setIsAuthLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, pathname]);

  // Mutations
  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      await loginApi(email, password);
      const me = await meApi();
      setUser(me);
      try {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
      } catch {}
      return me;
    },
    onSuccess: () => {
      // Respeta ?redirect=... si existe; si no, usa última pública o "/"
      const redirect = getRedirectParam() || getLastPublicPath() || "/";
      router.replace(redirect);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await registerApi(payload);
      return res;
    },
    onSuccess: () => {
      // Después de registrarse, llévalo al login con posible redirect
      const redirect = getRedirectParam();
      if (redirect)
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      else router.replace("/login");
    },
  });

  // Logout
  const logout = async () => {
    loggingOutRef.current = true;
    try {
      await logoutApi().catch(() => {});
      clearAuth();
      try {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      } catch {}
      setUser(null);
    } finally {
      loggingOutRef.current = false;
      if (typeof window !== "undefined") {
        // Vuelve a página pública (home) siempre
        window.location.replace("/");
      }
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthLoading,
      isAuthenticated,
      login: async (email: string, password: string) => {
        await loginMutation.mutateAsync({ email, password });
      },
      register: async (payload: any) => {
        await registerMutation.mutateAsync(payload);
      },
      logout,
    }),
    [user, isAuthLoading, isAuthenticated, loginMutation, registerMutation]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ───────────────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
