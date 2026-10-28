"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFairMode } from "@provider/siteConfigProvider";
import { EYEBROW, ROOT_VARS, mix } from "@components/views/checkout/checkoutTheme";

/** Modo feria (switch del panel): en lugar del catálogo/carrito, un aviso. Fuera de la feria, la página normal.
 *  `redirectTo`: en modo feria, ir ahí en vez del aviso (p. ej. el QR de un artista → su perfil). */
export default function FairModeGate({ children, redirectTo }: { children: React.ReactNode; redirectTo?: string }) {
  const fairMode = useFairMode();
  const router = useRouter();
  useEffect(() => {
    if (fairMode && redirectTo) router.replace(redirectTo);
  }, [fairMode, redirectTo, router]);
  if (!fairMode) return <>{children}</>;
  if (redirectTo) return null;
  return (
    <div style={ROOT_VARS}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(60px,9vw,130px) clamp(20px,4vw,56px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          textAlign: "center",
        }}
      >
        <span style={{ ...EYEBROW, color: "var(--acc)" }}>Feria en curso</span>
        <span style={{ fontWeight: 400, fontSize: "clamp(24px,3vw,38px)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          El catálogo en línea abre al terminar la feria
        </span>
        <p style={{ margin: 0, maxWidth: "46ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
          ¿Estás en la feria? Escanea el código QR que está junto a cada obra para verla y comprarla desde tu celular.
        </p>
        <Link
          href="/"
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
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
