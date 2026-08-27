"use client";

import SmartImage from "@components/ui/SmartImage";
import { formatCOP } from "@lib/money";
import { EYEBROW } from "@components/views/checkout/checkoutTheme";

type ImgLike = string | string[] | undefined | null;

export type CartViewItem = {
  id: string;
  title: string;
  price: number;
  image?: ImgLike;
  quantity: number;
  artist?: string;
};

const getFirstImage = (img: ImgLike): string => {
  if (Array.isArray(img)) return img[0] ?? "/placeholder.png";
  if (typeof img === "string" && img.trim() !== "") return img;
  return "/placeholder.png";
};

const DIM = "rgba(245,244,239,0.66)";
const RULE = "1px solid rgba(245,244,239,0.18)";

type Props = {
  items: CartViewItem[];
  subtotal: number;
  total: number;
};

export function CheckoutOrderSummary({ items, subtotal, total }: Props) {
  const count = items.reduce((a, i) => a + Number(i.quantity ?? 1), 0);

  return (
    <aside style={{ position: "sticky", top: 88, alignSelf: "flex-start" }}>
      <div
        style={{
          background: "var(--panel)",
          color: "#F5F4EF",
          padding: "clamp(20px,2.2vw,28px)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span style={{ ...EYEBROW, fontSize: 10, color: "var(--acc)" }}>Tu pedido</span>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((item) => {
            const qty = Number(item.quantity ?? 1);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: RULE,
                }}
              >
                <span
                  style={{
                    position: "relative",
                    flex: "0 0 auto",
                    display: "block",
                    width: 54,
                    aspectRatio: "1",
                    padding: 5,
                    background: "rgba(245,244,239,0.06)",
                  }}
                >
                  <span style={{ position: "absolute", inset: 5, display: "block" }}>
                    <SmartImage src={getFirstImage(item.image)} alt={item.title} sizes="60px" />
                  </span>
                </span>

                <span
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: 14.5,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </span>
                  {item.artist && (
                    <span
                      style={{
                        fontSize: 12.5,
                        color: DIM,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.artist}
                    </span>
                  )}
                </span>

                <span style={{ flex: "0 0 auto", fontSize: 13.5, color: DIM, whiteSpace: "nowrap" }}>
                  {qty} × {formatCOP(item.price ?? 0)}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 14.5,
            color: DIM,
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
            paddingTop: 14,
            borderTop: RULE,
          }}
        >
          <span style={{ ...EYEBROW, fontSize: 10, color: "rgba(245,244,239,0.6)" }}>Total</span>
          <span style={{ fontWeight: 500, fontSize: "clamp(24px,2.4vw,32px)", lineHeight: 1 }}>
            {formatCOP(total)}
          </span>
        </div>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 7,
            paddingTop: 12,
            borderTop: RULE,
            fontSize: 12.5,
            color: DIM,
          }}
        >
          {["Pago seguro", "Envío asegurado", "Garantía de autenticidad"].map((t) => (
            <li key={t} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span
                style={{
                  display: "block",
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: "var(--acc)",
                  flex: "0 0 auto",
                }}
              />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
