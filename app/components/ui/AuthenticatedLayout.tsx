// components/layouts/AuthenticatedLayout.tsx
"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import MergedLayout from "./MergedLayout";
import { useAuth } from "@/provider/authProvider";
import LoadingScreen from "@/components/common/LoadingScreen";
import { useTranslation } from "react-i18next";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { t } = useTranslation();

  // 1) Cargando estado de autenticación
  if (isAuthLoading) {
    return <LoadingScreen label={t("loading.session")} />;
  }

  // 2) Página de login: no envolver en layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // 3) Sin sesión → enviar a login
  if (!isAuthenticated) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  // 4) Sesión válida → render normal con layout
  return <MergedLayout>{children}</MergedLayout>;
};

export default AuthenticatedLayout;
