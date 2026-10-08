"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@provider/authProvider";
import { useEdition } from "@provider/editionProvider";
import { usePavilionsByUser } from "@hooks/queries/usePavilionsByUser";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";

/* Aviso para el artista ya seleccionado: aquí no tiene que volver a postular,
   tiene que cargar su inventario en el pabellón que le asignaron. Es donde cae
   el botón del correo de resolución, que abre la página con su sesión puesta. */

const GREEN = "var(--fdm-green,#3FA46E)";

export default function ArtistInventoryBanner() {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const { eventId } = useEdition();
  const userId = (user as any)?.id || (user as any)?._id;

  // El hook devuelve el resultado de useQuery: los pabellones están en data.rows.
  const { data: pavilionData } = usePavilionsByUser(
    eventId,
    isAuthenticated ? userId : undefined,
  );
  const { data: apps = [] } = useQuery<ArtistApplication[]>({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 60_000,
  });

  if (!isAuthenticated) return null;
  // El invitado también está dentro, aunque no haya pasado por curaduría.
  const accepted = apps.some((a) => a.status === "accepted" || a.invited);
  const pavilion = (pavilionData?.rows ?? [])[0] as any;
  if (!accepted && !pavilion) return null;

  return (
    <section style={{ background: "#0B0B0A", color: "#F5F4EF", padding: "clamp(18px,2.4vw,28px) clamp(20px,4vw,56px)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ flex: "1 1 320px" }}>
          <div style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.26em", textTransform: "uppercase", color: GREEN }}>
            Artista seleccionado
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "clamp(15px,1.3vw,19px)", lineHeight: 1.6 }}>
            {user?.firstName ? `${user.firstName}, ` : ""}
            {pavilion ? (
              <>
                ya estás en el <strong style={{ fontWeight: 500 }}>{pavilion.name}</strong>. Carga ahí tu
                inventario final: obras, precios, dimensiones y número de reproducciones.
              </>
            ) : (
              <>
                tu postulación fue seleccionada. Todavía no tienes una convocatoria asignada: estamos
                organizando los pabellones y te escribiremos en cuanto quede la tuya. Ahí mismo podrás
                cargar tu inventario final.
              </>
            )}
          </p>
        </div>
        {pavilion ? (
          <Link
            href="/admin/artist"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10, background: GREEN, color: "#0B0B0A",
              padding: "14px 26px", borderRadius: 999, textDecoration: "none", fontWeight: 500, fontSize: 14,
            }}
          >
            Cargar mi inventario →
          </Link>
        ) : (
          <Link
            href="/convocatoria/mi-solicitud"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10, border: `1px solid ${GREEN}`, color: GREEN,
              padding: "13px 24px", borderRadius: 999, textDecoration: "none", fontWeight: 500, fontSize: 14,
            }}
          >
            Ver mi postulación
          </Link>
        )}
      </div>
    </section>
  );
}
