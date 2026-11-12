"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useCart from "@store/useCart";
import useFavorites from "@store/useFavorites";
import { useMounted } from "@hooks/useMounted";
import { useAuth } from "@provider/authProvider";
import { useFairMode, useSiteContent, useSiteNav } from "@provider/siteConfigProvider";
import ThemeToggle from "@components/views/home/v2/ThemeToggle";
import BrandLogo from "@components/BrandLogo";

/* Navbar del rediseño de la tienda (Claude Design, nov-2026):
   barra superior negra, links de 14px con subrayado verde, avatar verde con
   menú de cuenta, corazón + carrito de 44px con contador, Tickets en negro.
   Desktop ≥1281px; entre 641 y 1280 se esconden los links y sale la
   hamburguesa; ≤640 es la cabecera de 56px del diseño móvil. */

const SVG = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true } as const;
const Ic = {
  heart: (s = 20, filled = false) => <svg {...SVG} width={s} height={s} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z" /></svg>,
  cart: (s = 20) => <svg {...SVG} width={s} height={s}><path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></svg>,
  user: <svg {...SVG} width={18} height={18}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" /></svg>,
  chevron: (open: boolean) => <svg {...SVG} width={16} height={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg>,
  arrow: <svg {...SVG} width={16} height={16} strokeWidth={1.8}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  ext: <svg {...SVG} width={16} height={16} strokeWidth={1.8}><path d="M7 17L17 7M9 7h8v8" /></svg>,
  logout: <svg {...SVG} width={18} height={18}><path d="M10 5H6v14h4M14 8l4 4-4 4M18 12H9" /></svg>,
  burger: (open: boolean) => <svg {...SVG} width={22} height={22}>{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>,
};

const CSS = `
.fdm-nav{
  --bg:var(--fdm-bg,#F7F6F2); --fg:var(--fdm-fg,#111111);
  --muted:#55534D; --muted2:#6B6963; --line:#DEDBD3; --line2:#C9C6BD; --line3:#E7E4DC;
  --card:#FFFFFF; --tile:#ECEAE3; --soft:#F2F0EA; --green:#1F7A50; --green-deep:#17603F; --green-dot:#5FD39A;
  --heart:#C2410C; --inv:#111111; --invfg:#FFFFFF; --shadow:0 24px 48px rgba(17,17,17,.16);
  font-family:Jost,system-ui,sans-serif; color:var(--fg);
}
:root[data-theme="dark"] .fdm-nav{
  --muted:#B8B7AF; --muted2:#8E8D86; --line:rgba(255,255,255,.12); --line2:rgba(255,255,255,.22); --line3:rgba(255,255,255,.08);
  --card:#171716; --tile:#262624; --soft:#202020; --green:#3FA46E; --green-deep:#7FDDAA;
  --inv:#F0EFEA; --invfg:#0C0C0B; --shadow:0 24px 48px rgba(0,0,0,.55);
}
.fdm-nav *{box-sizing:border-box}
.fdm-nav a{color:inherit;text-decoration:none}
.fdm-nav button{font:inherit;color:inherit;cursor:pointer}
.fdm-nav button:focus-visible,.fdm-nav a:focus-visible{outline:2px solid var(--green);outline-offset:2px}
.fdm-nav-top{background:#111111;color:#F7F6F2}
.fdm-nav-top>div{min-height:36px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;text-align:center}
.fdm-nav-top i{width:6px;height:6px;border-radius:999px;background:var(--green-dot);flex:none}
.fdm-nav-pad{max-width:1440px;margin:0 auto;padding-left:48px;padding-right:48px}
.fdm-nav-head{position:sticky;top:0;z-index:60;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:saturate(160%) blur(14px);-webkit-backdrop-filter:saturate(160%) blur(14px);border-bottom:1px solid var(--line)}
.fdm-nav-bar{height:72px;display:flex;align-items:center;gap:24px}
.fdm-nav-brand{flex:none;display:flex;align-items:center;gap:12px;white-space:nowrap}
.fdm-nav-brand b{display:block;font-size:16px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;line-height:1.1}
.fdm-nav-brand small{display:block;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted2);margin-top:1px}
.fdm-nav-links{flex:1;min-width:0;display:flex;justify-content:center;align-items:stretch;align-self:stretch;gap:4px;white-space:nowrap}
.fdm-nav-links a,.fdm-nav-links span{padding:0 14px;display:flex;align-items:center;font-size:14px;color:var(--muted)}
.fdm-nav-links a:hover{color:var(--fg);box-shadow:inset 0 -2px 0 var(--line2)}
.fdm-nav-links a[aria-current="page"]{color:var(--fg);font-weight:500;box-shadow:inset 0 -2px 0 var(--green)}
.fdm-nav-links span{color:color-mix(in srgb,var(--fg) 32%,transparent);cursor:not-allowed}
.fdm-nav-right{position:relative;z-index:2;flex:none;margin-left:auto;display:flex;align-items:center;gap:4px}
.fdm-nav-icon{position:relative;width:44px;height:44px;border:none;background:transparent;border-radius:999px;display:flex;align-items:center;justify-content:center}
.fdm-nav-icon:hover{background:var(--tile)}
.fdm-nav-badge{position:absolute;top:2px;right:0;min-width:18px;height:18px;padding:0 4px;border-radius:999px;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center}
.fdm-nav-ghost{height:44px;margin:0 4px;padding:0 16px;display:flex;align-items:center;gap:8px;border:1px solid var(--line2);background:transparent;border-radius:999px;font-size:14px;white-space:nowrap}
.fdm-nav-ghost:hover{border-color:var(--fg)}
.fdm-nav-slot{display:block;width:154px;height:44px;margin:0 4px}
@media (max-width:1440px){.fdm-nav-slot{width:146px}}
.fdm-nav-user{height:44px;padding:0 10px 0 4px;display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--card);border-radius:999px;font-size:14px;font-weight:500;white-space:nowrap}
.fdm-nav-user:hover{border-color:var(--fg)}
.fdm-nav-av{position:relative;flex:none;width:36px;height:36px;border-radius:999px;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;letter-spacing:.04em}
.fdm-nav-av i{position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:999px;background:var(--green-dot);border:2px solid var(--card)}
.fdm-nav-menu{position:absolute;top:56px;right:0;z-index:3;width:300px;background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);padding:8px;display:flex;flex-direction:column}
.fdm-nav-menu .who{padding:12px;display:flex;align-items:center;gap:12px}
.fdm-nav-menu .who .fdm-nav-av{width:48px;height:48px;font-size:16px}
.fdm-nav-menu .who b{display:block;font-size:16px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fdm-nav-menu .who small{display:block;font-size:13px;color:var(--muted)}
.fdm-nav-menu hr{height:1px;margin:4px 12px;border:0;background:var(--line3)}
.fdm-nav-item{min-height:48px;padding:0 12px;display:flex;align-items:center;gap:12px;border:none;background:transparent;border-radius:10px;font-size:15px;text-align:left;width:100%}
.fdm-nav-item:hover{background:var(--soft)}
.fdm-nav-item em{flex:1;font-style:normal}
.fdm-nav-item small{font-size:13px;color:var(--muted2)}
.fdm-nav-cta{height:44px;padding:0 20px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-size:14px;font-weight:500;white-space:nowrap;border:none}
.fdm-nav-cta.black{margin-left:10px;background:var(--inv);color:var(--invfg)}
.fdm-nav-cta.green{background:var(--green);color:#fff}
.fdm-nav-cta.green:hover{background:var(--green-deep)}
.fdm-nav-menu .fdm-nav-cta{margin:4px 4px 8px;height:48px}
.fdm-nav-burger{margin-left:4px;border:1px solid var(--line2);display:none}
.fdm-nav-mobile{position:absolute;left:0;right:0;top:100%;background:var(--bg);border-bottom:1px solid var(--line);box-shadow:0 24px 40px rgba(17,17,17,.10);padding-top:8px;padding-bottom:20px;display:none;flex-direction:column}
.fdm-nav-mobile>a,.fdm-nav-mobile>span{min-height:52px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line3);font-size:20px}
.fdm-nav-mobile>a[aria-current="page"]{color:var(--green)}
.fdm-nav-mobile>span{color:color-mix(in srgb,var(--fg) 32%,transparent)}
.fdm-nav-mobile>span small{font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.fdm-nav-chips{padding-top:16px;display:flex;flex-wrap:wrap;gap:10px}
.fdm-nav-chip{height:44px;padding:0 18px;display:flex;align-items:center;gap:8px;border:1px solid var(--line2);background:transparent;border-radius:999px;font-size:15px}
.fdm-nav-chip.green{background:var(--green);color:#fff;border-color:transparent;font-weight:500}
.fdm-nav-chip.black{background:var(--inv);color:var(--invfg);border-color:transparent;font-weight:500}
.fdm-nav-chip.muted{color:var(--muted)}
/* Anchos (probados de 320 a 1600 px, con y sin sesión; no deben desbordar):
   >1400 todo en línea · ≤1400 links al menú · ≤900 cuenta y tema al menú ·
   ≤640 cabecera móvil (corazón, carrito, menú) · ≤400 marca más chica ·
   ≤350 solo el logo. Revisar con scratchpad nav-check.mjs antes de tocar. */
.fdm-nav-brand{min-width:0}
.fdm-nav-brand>span{min-width:0;overflow:hidden}
.fdm-nav-brand b{overflow:hidden;text-overflow:ellipsis}
.fdm-nav-right{flex:none}
@media (max-width:1440px){.fdm-nav-name{display:none}}
@media (max-width:1400px){
  .fdm-nav-links{display:none}.fdm-nav-burger{display:flex}.fdm-nav-mobile{display:flex}
}
@media (max-width:1280px){.fdm-nav-pad{padding-left:24px;padding-right:24px}}
@media (max-width:900px){.fdm-nav-acct{display:none !important}}
@media (max-width:640px){
  .fdm-nav-top{display:none}
  .fdm-nav-bar{height:56px;gap:8px}.fdm-nav-pad{padding-left:16px;padding-right:8px}
  .fdm-nav-brand{gap:10px}.fdm-nav-brand b{font-size:15px;font-weight:500;letter-spacing:.1em}.fdm-nav-brand small{display:none}
  .fdm-nav-brand .fdm-logo{height:32px !important}
  .fdm-nav-wide{display:none !important}.fdm-nav-right{gap:0}
  .fdm-nav-icon:hover{background:transparent}.fdm-nav-burger{border:none;margin:0}
  .fdm-nav-badge{top:3px;right:2px;padding:0}
  .fdm-nav-mobile{padding-left:16px;padding-right:16px}
}
@media (max-width:400px){
  .fdm-nav-pad{padding-left:12px;padding-right:4px}
  .fdm-nav-brand{gap:8px}.fdm-nav-brand b{font-size:13px;letter-spacing:.06em}
  .fdm-nav-brand .fdm-logo{height:28px !important}
}
@media (max-width:350px){.fdm-nav-brand>span{display:none}}
`;

export default function Navigation() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const { brand } = useSiteContent();
  const nav = useSiteNav();
  const fairMode = useFairMode();
  // Modo feria: el catálogo no se muestra (la venta es desde el QR de cada obra).
  const items = nav.items.filter((i) => i.visible && !(fairMode && i.href.startsWith("/catalogo")));

  const mounted = useMounted();
  const cart = useCart((s) => s.items);
  const favs = useFavorites((s) => s.items);
  const cartCount = mounted ? cart.reduce((a, i) => a + (i.quantity ?? 1), 0) : 0;
  const favCount = mounted ? favs.length : 0;
  const shop = !fairMode;
  const onFav = pathname === "/favoritos";
  const inShop = /^\/(catalogo|favoritos|carrito|obra)/.test(pathname);

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userOpen) return;
    const out = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, [userOpen]);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.firstName || user?.email?.split("@")[0] || "Usuario";
  const firstName = fullName.split(" ")[0];
  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
  const isArtist = Boolean((user as any)?.roles?.artista);
  // Sin saltos: antes de montar se reserva el hueco; después manda el usuario
  // guardado (no se esconde mientras /me revalida la sesión).
  const ready = mounted;
  const doLogout = async () => {
    setUserOpen(false);
    setMenuOpen(false);
    await logout();
  };

  const navLink = (it: (typeof items)[number], mobile = false) =>
    it.enabled ? (
      <Link key={it.href} href={it.href} aria-current={pathname === it.href ? "page" : undefined}>
        {it.label}
      </Link>
    ) : (
      <span key={it.href} title="Próximamente">
        {it.label}
        {mobile && <small>Próximamente</small>}
      </span>
    );

  // Sin div envolvente: un sticky solo se pega dentro de su padre, y el header
  // tiene que acompañar toda la página.
  return (
    <>
      <style>{CSS}</style>

      {shop && inShop && (
        <div className="fdm-nav fdm-nav-top">
          <div className="fdm-nav-pad">
            <i aria-hidden="true" />
            <span>Todas las obras hasta $ 1.000.000 · Venta directa del artista</span>
          </div>
        </div>
      )}

      <header className="fdm-nav fdm-nav-head">
        <div className="fdm-nav-pad fdm-nav-bar">
          <Link href="/" className="fdm-nav-brand" aria-label={`Ir al inicio - ${brand.name}`}>
            <BrandLogo height={38} />
            <span>
              <b>{brand.name}</b>
              <small className="fdm-tagline">{brand.tagline}</small>
            </span>
          </Link>

          <nav className="fdm-nav-links" aria-label="Principal">
            {items.map((it) => navLink(it))}
          </nav>

          <div className="fdm-nav-right">
            <ThemeToggle className="fdm-nav-icon fdm-nav-wide fdm-nav-acct" />

            {!ready && <span className="fdm-nav-slot fdm-nav-wide fdm-nav-acct" aria-hidden="true" />}

            {ready && !isAuthenticated && (
              <Link href="/login" className="fdm-nav-ghost fdm-nav-wide fdm-nav-acct">
                {Ic.user}
                Acceso artistas
              </Link>
            )}

            {ready && isAuthenticated && (
              <div ref={userRef} className="fdm-nav-acct" style={{ position: "relative", margin: "0 4px" }}>
                <button className="fdm-nav-user" aria-label={`Cuenta de ${fullName}`} aria-expanded={userOpen} onClick={() => setUserOpen((v) => !v)}>
                  <span className="fdm-nav-av">
                    {initials}
                    <i aria-hidden="true" />
                  </span>
                  <span className="fdm-nav-name">{firstName}</span>
                  {Ic.chevron(userOpen)}
                </button>
                {userOpen && (
                  <div className="fdm-nav-menu" role="dialog" aria-label="Cuenta">
                    <div className="who">
                      <span className="fdm-nav-av">{initials}</span>
                      <span style={{ minWidth: 0 }}>
                        <b>{fullName}</b>
                        <small>{isArtist ? "Cuenta de artista" : user?.email}</small>
                      </span>
                    </div>
                    <Link href={isArtist ? "/admin/artist" : "/admin/account"} className="fdm-nav-cta green">
                      {isArtist ? "Ir a Mi estudio" : "Mi cuenta"}
                      {Ic.arrow}
                    </Link>
                    <hr />
                    {shop && (
                      <Link href="/favoritos" className="fdm-nav-item">
                        {Ic.heart(18)}
                        <em>Favoritos</em>
                        <small>{favCount}</small>
                      </Link>
                    )}
                    {shop && (
                      <Link href="/carrito" className="fdm-nav-item">
                        {Ic.cart(18)}
                        <em>Carrito</em>
                        <small>{cartCount}</small>
                      </Link>
                    )}
                    {isArtist && (
                      <Link href="/admin/account" className="fdm-nav-item">
                        {Ic.user}
                        <em>Mi perfil</em>
                      </Link>
                    )}
                    <hr />
                    <button className="fdm-nav-item" style={{ color: "var(--muted)" }} onClick={doLogout}>
                      {Ic.logout}
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            {shop && (
              <Link href="/favoritos" className="fdm-nav-icon" aria-label={favCount > 0 ? `Favoritos (${favCount})` : "Favoritos"} style={{ color: onFav ? "var(--heart)" : undefined }}>
                {Ic.heart(20, onFav)}
                {favCount > 0 && <span className="fdm-nav-badge" style={{ background: "var(--heart)" }}>{favCount}</span>}
              </Link>
            )}
            {shop && (
              <Link href="/carrito" className="fdm-nav-icon" aria-label={cartCount > 0 ? `Carrito (${cartCount})` : "Carrito"}>
                {Ic.cart(20)}
                {cartCount > 0 && <span className="fdm-nav-badge" style={{ background: "var(--green)" }}>{cartCount}</span>}
              </Link>
            )}

            <Link href="/tickets" className="fdm-nav-cta black fdm-nav-wide">
              Tickets
              {Ic.ext}
            </Link>

            <button className="fdm-nav-icon fdm-nav-burger" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              {Ic.burger(menuOpen)}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="fdm-nav-mobile fdm-nav-pad" aria-label="Menú">
            {items.map((it) => navLink(it, true))}
            <div className="fdm-nav-chips">
              <Link href="/tickets" className="fdm-nav-chip black">
                Tickets
                {Ic.ext}
              </Link>
              {shop && (
                <Link href="/favoritos" className="fdm-nav-chip">
                  {Ic.heart(18)}
                  Favoritos
                </Link>
              )}
              {ready && !isAuthenticated && (
                <Link href="/login" className="fdm-nav-chip">
                  {Ic.user}
                  Acceso artistas
                </Link>
              )}
              {ready && isAuthenticated && (
                <Link href={isArtist ? "/admin/artist" : "/admin/account"} className="fdm-nav-chip green">
                  {isArtist ? "Mi estudio" : "Mi cuenta"}
                </Link>
              )}
              {ready && isAuthenticated && (
                <button className="fdm-nav-chip muted" onClick={doLogout}>
                  Cerrar sesión
                </button>
              )}
              <ThemeToggle className="fdm-nav-chip" withLabel />
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
