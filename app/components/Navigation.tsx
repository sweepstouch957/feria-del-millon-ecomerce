"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Menu,
  X,
  Palette,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@components/ui/button";
import useCart from "@store/useCart";
import { useAuth } from "@provider/authProvider";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Auth
  const { user, isAuthLoading, isAuthenticated, logout } = useAuth();

  // Cart desde Zustand (sumamos cantidades por si tienes quantity > 1)
  const items = useCart((s) => s.items);
  const cartCount = useMemo(
    () => items.reduce((acc, i) => acc + (i.quantity ?? 1), 0),
    [items]
  );

  // Scroll states (progress bar + navbar blur)
  useEffect(() => {
    const handler = () => {
      const top = window.scrollY || 0;
      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      setIsScrolled(top > 20);
      setScrollProgress(Math.min(100, Math.max(0, (top / max) * 100)));
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  const navItems = [
    { path: "/", label: "Inicio" },
    { path: "/catalogo", label: "Catálogo" },
    { path: "/tickets", label: "Tickets" },
    { path: "/artistas", label: "Artistas" },
    { path: "/sobre-nosotros", label: "Sobre Nosotros" },
  ];

  const isActive = (path: string) => pathname === path;

  // ── User helpers
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.firstName ||
    user?.email?.split("@")[0] ||
    "Usuario";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";
  const isArtist = Boolean((user as any)?.roles?.artista);

  // ── Dropdown (desktop)
  const [userOpen, setUserOpen] = useState(false);
  const userBtnRef = useRef<HTMLButtonElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        userOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(target)
      ) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [userOpen]);

  // Tamaños fijos para evitar salto: ancho reservado del bloque de auth en desktop
  const AUTH_DESKTOP_WIDTH = "w-[268px]"; // cabe avatar+nombre+chevron ó 2 botones

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/60"
          : "bg-white shadow-md"
      }`}
      role="navigation"
      aria-label="Principal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-black">
                Semana del Arte
              </div>
              <div className="text-xs text-gray-500 font-medium">
                2025 • Feria del Millón
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActive(item.path)
                    ? "text-black bg-gray-100"
                    : "text-gray-800 hover:text-black hover:bg-gray-50"
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
                )}
                <div className="absolute inset-0 rounded-xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </div>

          {/* Right side: Auth / Cart / Mobile toggle */}
          <div className="flex items-center space-x-3">
            {/* ===== Desktop Auth area con ancho fijo para cero layout shift ===== */}
            <div className={`hidden md:flex justify-end ${AUTH_DESKTOP_WIDTH}`}>
              {/* Loading: skeleton con medidas idénticas a los estados finales */}
              {isAuthLoading && (
                <div className="flex items-center gap-2">
                  {/* Si no autenticado, habría dos botones sm → reservamos 2 skeletons */}
                  <Skeleton className="h-9 w-28 rounded-xl" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              )}

              {/* NO autenticado */}
              {!isAuthLoading && !isAuthenticated && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login?role=buyer"
                    aria-label="Iniciar sesión como comprador"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-900 hover:border-black hover:bg-gray-50 transition-all duration-300"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>Comprador</span>
                    </Button>
                  </Link>
                  <Link
                    href="/login?role=artist"
                    aria-label="Iniciar sesión como artista"
                    className="block"
                  >
                    <Button
                      size="sm"
                      className="bg-black text-white shadow-sm hover:bg-gray-900 transition-all duration-300"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      <span>Artista</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Autenticado */}
              {!isAuthLoading && isAuthenticated && (
                <div className="relative">
                  <button
                    ref={userBtnRef}
                    onClick={() => setUserOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-sm hover:border-black"
                    aria-haspopup="menu"
                    aria-expanded={userOpen}
                    aria-label="Menú de usuario"
                  >
                    <div className="h-7 w-7 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                    <span className="max-w-[8.5rem] truncate text-gray-900">
                      {fullName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>

                  {userOpen && (
                    <div
                      ref={userMenuRef}
                      role="menu"
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/admin/account"
                          role="menuitem"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                          onClick={() => setUserOpen(false)}
                        >
                          <BadgeCheck className="h-4 w-4" />
                          Mi cuenta
                        </Link>

                      </div>

                      <button
                        role="menuitem"
                        onClick={async () => {
                          setUserOpen(false);
                          await logout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 border-t border-gray-200"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link
              href="/carrito"
              className="relative group"
              aria-label="Ir al carrito"
            >
              <Button
                variant="outline"
                size="sm"
                className="relative border-gray-300 hover:border-black hover:bg-gray-50 transition-all duration-300 group-hover:scale-105"
              >
                <ShoppingCart className="h-4 w-4 group-hover:text-black transition-colors" />
                {cartCount > 0 && (
                  <>
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-700 rounded-full animate-ping" />
                  </>
                )}
              </Button>
            </Link>

            {/* Mobile toggle */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen((v) => !v)}
                className="hover:bg-gray-100 transition-colors duration-300"
                aria-label="Abrir menú"
                aria-expanded={isMenuOpen}
              >
                <div className="relative w-5 h-5">
                  <Menu
                    className={`h-5 w-5 absolute transition-all duration-300 ${
                      isMenuOpen
                        ? "rotate-90 opacity-0"
                        : "rotate-0 opacity-100"
                    }`}
                  />
                  <X
                    className={`h-5 w-5 absolute transition-all duration-300 ${
                      isMenuOpen
                        ? "rotate-0 opacity-100"
                        : "-rotate-90 opacity-0"
                    }`}
                  />
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMenuOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gradient-to-b from-gray-50 to-white rounded-b-2xl border-t border-gray-100">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? "text-black bg-gray-100 border-l-4 border-black"
                    : "text-gray-800 hover:text-black hover:bg-gray-100"
                }`}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  animationDelay: `${
                    index * 0.1
                  }s` as React.CSSProperties["animationDelay"],
                }}
              >
                <div className="flex items-center space-x-3">
                  {isActive(item.path) && (
                    <Sparkles className="h-4 w-4 text-black" />
                  )}
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}

            {/* Auth area (mobile) */}
            <div className="pt-3 border-t border-gray-100">
              {/* Loading → skeletons del mismo tamaño que los botones/cards */}
              {isAuthLoading && (
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-10 rounded-xl" />
                </div>
              )}

              {!isAuthLoading && !isAuthenticated ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login?role=buyer"
                    aria-label="Iniciar sesión como comprador"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-10 border-gray-300 text-gray-900 hover:border-black hover:bg-gray-50"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span className="truncate">Comprador</span>
                    </Button>
                  </Link>
                  <Link
                    href="/login?role=artist"
                    aria-label="Iniciar sesión como artista"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full h-10 bg-black text-white hover:bg-gray-900">
                      <Palette className="h-4 w-4 mr-2" />
                      <span className="truncate">Artista</span>
                    </Button>
                  </Link>
                </div>
              ) : null}

              {/* Usuario logueado (mobile): tarjetica + acciones */}
              {!isAuthLoading && isAuthenticated && (
                <div className="rounded-xl border border-gray-200 p-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Link
                      href="/admin/account"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-800 hover:bg-gray-100"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      Mi cuenta
                    </Link>
                    {isArtist && (
                      <Link
                        href="/admin/artist"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-800 hover:bg-gray-100"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Panel de artista
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-800 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-black transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
    </nav>
  );
}
