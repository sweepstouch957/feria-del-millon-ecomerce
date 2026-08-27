"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import useCart from "@store/useCart";
import SmartImage from "@components/ui/SmartImage";
import SiteFooter from "@components/SiteFooter";
import { formatCOP } from "@lib/money";

/* ──────────────────────────────────────────────────────────────
   Carrito — mismo sistema editorial v2 que catálogo / obra.
   ────────────────────────────────────────────────────────────── */

type ImgLike = string | string[] | undefined | null;

type CartViewItem = {
  id: string;
  title: string;
  price: number;
  image?: ImgLike;
  quantity: number;
  artist?: string;
};

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const ROOT_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#0B0B0A)",
  "--acc": "var(--fdm-green,#3FA46E)",
  "--panel": "var(--fdm-panel,#0B0B0A)",
  background: "var(--bg)",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  letterSpacing: "0.005em",
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

const PAGE_CSS = `
  .fdm-cart a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-cart-link:hover { color: var(--acc); }
  .fdm-cart-shell { display:flex; flex-wrap:wrap; align-items:flex-start; gap:clamp(24px,3vw,52px); padding:clamp(18px,2vw,28px) 0 clamp(40px,4vw,64px); }
  .fdm-cart-list { flex:999 1 58%; min-width:min(100%,300px); }
  .fdm-cart-aside { flex:1 1 280px; max-width:360px; min-width:min(100%,280px); position:sticky; top:88px; align-self:flex-start; }
  .fdm-cart-row { display:flex; align-items:center; gap:clamp(14px,2vw,26px); padding:clamp(14px,1.6vw,20px) 0; border-bottom:1px solid color-mix(in srgb, var(--fg) 12%, transparent); }
  @media (max-width: 719px) { .fdm-cart-row { flex-wrap:wrap; } }
`;

const getFirstImage = (img: ImgLike): string => {
  if (Array.isArray(img)) return img[0] ?? "/placeholder.png";
  if (typeof img === "string" && img.trim() !== "") return img;
  return "/placeholder.png";
};

function QtyButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: 32,
        height: 32,
        display: "grid",
        placeItems: "center",
        background: "transparent",
        color: "inherit",
        border: `1px solid ${mix(24)}`,
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontSize: 15,
        lineHeight: 1,
        transition: "border-color .3s ease, color .3s ease",
      }}
    >
      {children}
    </button>
  );
}

export default function CartPage() {
  const items = useCart((s) => s.items) as CartViewItem[];
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);
  const reduce = useReducedMotion();

  const subtotal = useMemo(
    () => items.reduce((a, i) => a + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((a, i) => a + Number(i.quantity ?? 1), 0),
    [items]
  );

  return (
    <div style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>

      <div
        className="fdm-cart"
        style={{ maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}
      >
        <nav
          aria-label="Migas de pan"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 9,
            padding: "12px 0",
            borderBottom: `1px solid ${mix(12)}`,
            ...EYEBROW,
            fontSize: 10.5,
            letterSpacing: "0.14em",
            color: mix(55),
          }}
        >
          <Link href="/catalogo" className="fdm-cart-link">
            Catálogo
          </Link>
          <span aria-hidden>/</span>
          <span aria-current="page" style={{ color: mix(85) }}>
            Carrito
          </span>
        </nav>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            padding: "clamp(20px,2.4vw,32px) 0 clamp(12px,1.4vw,18px)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: "clamp(34px,4.4vw,68px)",
              lineHeight: 0.95,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            Carrito
          </h1>
          <span style={{ ...EYEBROW, fontSize: 10.5, color: mix(55) }}>
            {count} {count === 1 ? "pieza" : "piezas"}
          </span>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              borderTop: `1px solid ${mix(22)}`,
              borderBottom: `1px solid ${mix(22)}`,
              padding: "clamp(46px,6vw,96px) clamp(20px,3vw,40px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              textAlign: "center",
              marginBottom: "clamp(40px,4vw,64px)",
            }}
          >
            <span
              style={{
                fontWeight: 400,
                fontSize: "clamp(21px,2.4vw,30px)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              Tu carrito está vacío
            </span>
            <p style={{ margin: 0, maxWidth: "40ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
              Todas las obras del catálogo son piezas únicas de artistas emergentes.
            </p>
            <Link
              href="/catalogo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 48,
                padding: "0 30px",
                background: "var(--fg)",
                color: "var(--bg)",
                borderRadius: 999,
                ...EYEBROW,
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="fdm-cart-shell">
            <div className="fdm-cart-list">
              <div style={{ borderTop: `1px solid ${mix(22)}` }}>
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const href = `/obra/${encodeURIComponent(String(item.id))}`;
                    const qty = Number(item.quantity ?? 1);
                    return (
                      <motion.article
                        key={item.id}
                        layout={!reduce}
                        initial={reduce ? undefined : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fdm-cart-row"
                      >
                        <Link href={href} style={{ flex: "0 0 auto" }}>
                          <span
                            style={{
                              position: "relative",
                              display: "block",
                              width: "clamp(72px,7vw,104px)",
                              aspectRatio: "1",
                              padding: 8,
                              background: mix(4),
                              border: `1px solid ${mix(10)}`,
                            }}
                          >
                            <span style={{ position: "absolute", inset: 8, display: "block" }}>
                              <SmartImage
                                src={getFirstImage(item.image)}
                                alt={item.title}
                                sizes="110px"
                              />
                            </span>
                          </span>
                        </Link>

                        <span
                          style={{
                            flex: "1 1 200px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            minWidth: 0,
                          }}
                        >
                          <Link
                            href={href}
                            className="fdm-cart-link"
                            style={{
                              fontWeight: 500,
                              fontSize: "clamp(16px,1.3vw,19px)",
                              lineHeight: 1.25,
                            }}
                          >
                            {item.title}
                          </Link>
                          {item.artist && (
                            <span style={{ fontSize: 13.5, color: mix(65) }}>{item.artist}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            className="fdm-cart-link"
                            style={{
                              alignSelf: "flex-start",
                              marginTop: 2,
                              background: "transparent",
                              border: 0,
                              padding: 0,
                              cursor: "pointer",
                              color: mix(50),
                              ...EYEBROW,
                              fontSize: 10,
                              letterSpacing: "0.12em",
                            }}
                          >
                            Quitar
                          </button>
                        </span>

                        <span
                          style={{
                            flex: "0 0 auto",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <QtyButton
                            label="Quitar una"
                            disabled={qty <= 1}
                            onClick={() => updateQty(item.id, qty - 1)}
                          >
                            −
                          </QtyButton>
                          <span
                            style={{
                              minWidth: 22,
                              textAlign: "center",
                              fontWeight: 500,
                              fontSize: 15,
                            }}
                          >
                            {qty}
                          </span>
                          <QtyButton label="Agregar una" onClick={() => updateQty(item.id, qty + 1)}>
                            +
                          </QtyButton>
                        </span>

                        <span
                          style={{
                            flex: "0 0 auto",
                            minWidth: 118,
                            textAlign: "right",
                            fontWeight: 500,
                            fontSize: 16,
                          }}
                        >
                          {formatCOP(Number(item.price ?? 0) * qty)}
                        </span>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div style={{ paddingTop: 18 }}>
                <Link href="/catalogo" className="fdm-cart-link" style={{ ...EYEBROW, fontSize: 10.5, color: mix(60) }}>
                  ← Seguir viendo obras
                </Link>
              </div>
            </div>

            {/* Resumen */}
            <aside className="fdm-cart-aside">
              <div
                style={{
                  background: "var(--panel)",
                  color: "#F5F4EF",
                  padding: "clamp(22px,2.4vw,32px) clamp(20px,2.2vw,28px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <span style={{ ...EYEBROW, fontSize: 10, color: "var(--acc)" }}>Resumen</span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    paddingBottom: 14,
                    borderBottom: "1px solid rgba(245,244,239,0.2)",
                    fontSize: 14.5,
                    color: "rgba(245,244,239,0.75)",
                  }}
                >
                  <span>
                    Subtotal · {count} {count === 1 ? "pieza" : "piezas"}
                  </span>
                  <span>{formatCOP(subtotal)}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span style={{ ...EYEBROW, fontSize: 10, color: "rgba(245,244,239,0.6)" }}>
                    Total
                  </span>
                  <span style={{ fontWeight: 500, fontSize: "clamp(24px,2.4vw,32px)", lineHeight: 1 }}>
                    {formatCOP(subtotal)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 52,
                    marginTop: 4,
                    background: "var(--acc)",
                    color: "#0B0B0A",
                    borderRadius: 999,
                    ...EYEBROW,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                  }}
                >
                  Finalizar compra
                </Link>

                <p
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: "rgba(245,244,239,0.6)",
                  }}
                >
                  Cada pieza es única: si alguien la compra antes, se libera del carrito.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
