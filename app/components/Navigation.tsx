"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User as UserIcon, LogOut, ChevronDown, LayoutDashboard, BadgeCheck } from "lucide-react";
import useCart from "@store/useCart";
import { useAuth } from "@provider/authProvider";
import { useSiteContent, useSiteNav } from "@provider/siteConfigProvider";
import ThemeToggle from "@components/views/home/v2/ThemeToggle";

const GREEN = "var(--fdm-green,#3FA46E)";
const FG = "var(--fdm-fg,#0B0B0A)";
const BG = "var(--fdm-bg,#F7F6F2)";
const LOGO = "/assets/fdm/logo-fdm.jpg";

const JOST = "Jost, system-ui, sans-serif";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [progress, setProgress] = useState(0);

  const { user, isAuthLoading, isAuthenticated, logout } = useAuth();
  const { brand } = useSiteContent();
  const nav = useSiteNav();
  const items = nav.items.filter((i) => i.visible);

  const cart = useCart((s) => s.items);
  const cartCount = useMemo(() => cart.reduce((a, i) => a + (i.quantity ?? 1), 0), [cart]);

  useEffect(() => {
    const handler = () => {
      const top = window.scrollY || 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      setCompact(top > 40);
      setProgress(Math.min(100, Math.max(0, (top / max) * 100)));
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  const isActive = (p: string) => pathname === p;

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.firstName ||
    user?.email?.split("@")[0] ||
    "Usuario";
  const initials =
    fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
  const isArtist = Boolean((user as any)?.roles?.artista);

  const [userOpen, setUserOpen] = useState(false);
  const userBtnRef = useRef<HTMLButtonElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (userOpen && userMenuRef.current && !userMenuRef.current.contains(t) && userBtnRef.current && !userBtnRef.current.contains(t)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [userOpen]);

  const linkStyle: React.CSSProperties = {
    padding: "6px 0",
    fontFamily: JOST,
    fontWeight: 300,
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };

  const ticketPill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 42,
    padding: "0 24px",
    background: FG,
    color: BG,
    fontFamily: JOST,
    fontWeight: 300,
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 999,
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "color-mix(in srgb, var(--fdm-bg,#F7F6F2) 90%, transparent)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid color-mix(in srgb, var(--fdm-fg,#0B0B0A) 14%, transparent)",
        color: FG,
        fontFamily: JOST,
      }}
    >
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: `${compact ? 8 : 14}px clamp(16px,4vw,56px)`,
          minHeight: compact ? 62 : 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(14px,1.8vw,32px)",
          transition: "padding .35s ease, min-height .35s ease",
        }}
      >
        {/* Marca */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 14, flex: "0 0 auto", whiteSpace: "nowrap" }} aria-label={`Ir al inicio - ${brand.name}`}>
          <span
            style={{
              display: "block",
              width: 58,
              aspectRatio: "2.46",
              backgroundImage: `url('${brand.logo || LOGO}')`,
              backgroundSize: "cover",
              backgroundPosition: "49% center",
              filter: "var(--logoF,none) contrast(1.25)",
              mixBlendMode: "multiply" as any,
            }}
          />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
            <span style={{ fontWeight: 500, fontSize: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>{brand.name}</span>
            <span style={{ fontWeight: 300, fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 50%, transparent)`, marginTop: 4 }}>
              {brand.tagline}
            </span>
          </span>
        </Link>

        {/* Nav desktop (desde config) */}
        <nav
          className="fdm-desk-nav"
          style={{
            alignItems: "center",
            justifyContent: "center",
            flex: "1 1 auto",
            gap: "clamp(14px,1.7vw,30px)",
          }}
        >
          {items.map((it) =>
            it.enabled ? (
              <Link
                key={it.href}
                href={it.href}
                className="fdm-link"
                style={{ ...linkStyle, color: isActive(it.href) ? GREEN : "inherit", borderBottom: `1px solid ${isActive(it.href) ? GREEN : "transparent"}` }}
              >
                {it.label}
              </Link>
            ) : (
              <span key={it.href} title="Próximamente" style={{ ...linkStyle, color: `color-mix(in srgb, ${FG} 32%, transparent)`, cursor: "not-allowed" }}>
                {it.label}
              </span>
            )
          )}
        </nav>

        {/* Acciones derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto", whiteSpace: "nowrap" }}>
          <ThemeToggle className="fdm-desk-only" />

          {/* Auth (desktop) */}
          <div className="fdm-desk-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isAuthLoading && !isAuthenticated && (
              <>
                <Link href="/login?role=buyer" className="fdm-link" style={{ ...linkStyle, color: `color-mix(in srgb, ${FG} 58%, transparent)` }}>Acceder</Link>
                <Link href="/login?role=artist" className="fdm-link" style={{ ...linkStyle, color: `color-mix(in srgb, ${FG} 58%, transparent)` }}>Artistas</Link>
              </>
            )}
            {!isAuthLoading && isAuthenticated && (
              <div style={{ position: "relative" }}>
                <button
                  ref={userBtnRef}
                  onClick={() => setUserOpen((v) => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 999, border: `1px solid color-mix(in srgb, ${FG} 26%, transparent)`, background: "transparent", color: "inherit", padding: "5px 10px", cursor: "pointer", fontFamily: JOST, fontSize: 13 }}
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                >
                  <span style={{ height: 26, width: 26, borderRadius: 999, background: FG, color: BG, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11 }}>{initials}</span>
                  <span style={{ maxWidth: "8.5rem", overflow: "hidden", textOverflow: "ellipsis" }}>{fullName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userOpen && (
                  <div ref={userMenuRef} role="menu" style={{ position: "absolute", right: 0, marginTop: 8, width: 256, borderRadius: 12, border: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`, background: BG, boxShadow: "0 10px 40px rgba(0,0,0,0.18)", overflow: "hidden", zIndex: 70 }}>
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid color-mix(in srgb, ${FG} 12%, transparent)` }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{fullName}</p>
                      <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>{user?.email}</p>
                    </div>
                    <Link href="/admin/account" role="menuitem" onClick={() => setUserOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13 }}>
                      <BadgeCheck className="h-4 w-4" /> Mi cuenta
                    </Link>
                    {isArtist && (
                      <Link href="/admin/artist" role="menuitem" onClick={() => setUserOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13 }}>
                        <LayoutDashboard className="h-4 w-4" /> Panel de artista
                      </Link>
                    )}
                    <button onClick={async () => { setUserOpen(false); await logout(); }} style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13, borderTop: `1px solid color-mix(in srgb, ${FG} 12%, transparent)`, background: "transparent", cursor: "pointer", color: "inherit" }}>
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Carrito */}
          <Link href="/carrito" aria-label="Ir al carrito" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", height: 42, width: 42, borderRadius: 999, border: `1px solid color-mix(in srgb, ${FG} 26%, transparent)` }}>
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span style={{ position: "absolute", top: -6, right: -6, background: GREEN, color: "#0B0B0A", fontSize: 11, borderRadius: 999, height: 20, minWidth: 20, padding: "0 5px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>
            )}
          </Link>

          {/* Tickets */}
          <Link href="/tickets" className="fdm-desk-only" style={ticketPill}>Tickets</Link>

          {/* Menú mobile */}
          <button onClick={() => setIsMenuOpen((v) => !v)} className="fdm-mobile-only" aria-label="Abrir menú" aria-expanded={isMenuOpen} style={{ display: "none", alignItems: "center", height: 42, padding: "0 20px", cursor: "pointer", background: "transparent", color: "inherit", border: `1px solid color-mix(in srgb, ${FG} 26%, transparent)`, borderRadius: 999, fontFamily: JOST, fontWeight: 300, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {isMenuOpen ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      {/* Progreso de scroll */}
      <div style={{ position: "absolute", left: 0, bottom: -1, height: 2, width: `${progress}%`, background: GREEN, pointerEvents: "none", transition: "width .15s linear" }} aria-hidden="true" />

      {/* Panel mobile */}
      {isMenuOpen && (
        <div style={{ borderTop: `1px solid color-mix(in srgb, ${FG} 12%, transparent)`, padding: "12px clamp(16px,4vw,56px) 22px", background: "color-mix(in srgb, var(--fdm-bg,#F7F6F2) 96%, transparent)", backdropFilter: "blur(14px)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((it, idx) =>
              it.enabled ? (
                <Link key={it.href} href={it.href} onClick={() => setIsMenuOpen(false)} style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "12px 0", borderBottom: `1px solid color-mix(in srgb, ${FG} 10%, transparent)`, fontFamily: JOST, fontWeight: 300, fontSize: 20, textTransform: "uppercase", color: isActive(it.href) ? GREEN : "inherit" }}>
                  <span className="fdm-mono" style={{ fontSize: 11, letterSpacing: "0.24em", opacity: 0.5 }}>{String(idx + 1).padStart(2, "0")}</span>
                  {it.label}
                </Link>
              ) : (
                <span key={it.href} style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "12px 0", borderBottom: `1px solid color-mix(in srgb, ${FG} 10%, transparent)`, fontFamily: JOST, fontWeight: 300, fontSize: 20, textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 32%, transparent)` }}>
                  <span className="fdm-mono" style={{ fontSize: 11, letterSpacing: "0.24em", opacity: 0.5 }}>{String(idx + 1).padStart(2, "0")}</span>
                  {it.label}
                  <span className="fdm-mono" style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>Próximamente</span>
                </span>
              )
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18 }}>
            <Link href="/tickets" onClick={() => setIsMenuOpen(false)} style={{ ...ticketPill, background: GREEN, color: "#0B0B0A", height: 48 }}>Comprar tickets</Link>
            <ThemeToggle />
          </div>
          {!isAuthLoading && !isAuthenticated && (
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Link href="/login?role=buyer" onClick={() => setIsMenuOpen(false)} className="fdm-link" style={{ fontFamily: JOST, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Acceder</Link>
              <Link href="/login?role=artist" onClick={() => setIsMenuOpen(false)} className="fdm-link" style={{ fontFamily: JOST, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Artistas</Link>
            </div>
          )}
          {!isAuthLoading && isAuthenticated && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
              <Link href="/admin/account" onClick={() => setIsMenuOpen(false)} className="fdm-link" style={{ fontFamily: JOST, fontSize: 13 }}>Mi cuenta</Link>
              {isArtist && <Link href="/admin/artist" onClick={() => setIsMenuOpen(false)} className="fdm-link" style={{ fontFamily: JOST, fontSize: 13 }}>Panel de artista</Link>}
              <button onClick={async () => { setIsMenuOpen(false); await logout(); }} style={{ textAlign: "left", background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontFamily: JOST, fontSize: 13, padding: 0 }}>Cerrar sesión</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
