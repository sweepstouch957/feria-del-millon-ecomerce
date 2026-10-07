"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { Plus, Brush, Receipt, Search, QrCode, Lock } from "lucide-react";
import { toast } from "sonner";

import { useTechniques } from "@hooks/queries/useTechniques";
import { usePavilionsByUser } from "@hooks/queries/usePavilionsByUser";
import {
  useArtworksCursor,
  type ArtworkRow,
} from "@hooks/queries/useArtworksCursor";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { getMyApplications, getMyProject } from "@services/applications.service";

import ArtworksTable from "./ArtworksTable";
import ArtworkDetailModal from "./ArtworkDetailModal";
import ArtistOrders from "./ArtistOrders";
import { useAuth } from "@provider/authProvider";
import { useEventId } from "@provider/editionProvider";

// Modales extra
import CreateEditArtworkModal from "./CreateEditArtworkModal";
import QRModal from "./QrModal";
import ArtistQrModal from "./ArtistQrModal";
import ApplicationStatusCard from "@components/views/admin/artist/ApplicationStatusCard";
import ProjectCard from "./ProjectCard";
import {
  BODY,
  DISPLAY,
  EYEBROW,
  STUDIO_CSS,
  STUDIO_VARS,
  btnGhost,
  btnSolid,
  fieldInput,
  hair,
  mix,
} from "./studioTheme";

/* El estudio del artista.
   El orden de la página es el orden del trabajo: primero las obras —que es lo
   que lleva tiempo—, después el proyecto que las agrupa y el envío a la feria,
   que es el final del camino y de una sola vez. */

export default function MiEstudioClient() {
  const router = useRouter();
  const DEFAULT_EVENT_ID = useEventId(); // edición vigente (dinámica)
  const { user, isAuthLoading, isAuthenticated } = useAuth();
  const artistId = user?.id || user?._id;

  const { data: apps = [], isLoading: appsLoading } = useQuery({
    queryKey: ["my-applications", artistId],
    queryFn: getMyApplications,
    enabled: !!artistId && isAuthenticated,
  });

  // Invitado = asignado a un pabellón por el admin, aunque no se haya postulado.
  const { data: pavsByUser, isLoading: pavsLoading } = usePavilionsByUser(
    DEFAULT_EVENT_ID,
    artistId as string,
    true
  );
  const isInvited = (pavsByUser?.rows?.length ?? 0) > 0;

  // El envío cierra la edición: mientras no se haya enviado, todo se puede
  // cambiar. Misma clave que ProjectCard, así que no son dos peticiones.
  const { data: project } = useQuery({
    queryKey: ["my-project"],
    queryFn: getMyProject,
    staleTime: 60_000,
    enabled: !!artistId && isAuthenticated,
  });
  const sentAt = project?.inventorySentAt;
  const locked = !!sentAt;

  useEffect(() => {
    if (!isAuthLoading && !appsLoading && !pavsLoading && isAuthenticated) {
      if (isInvited) return;
      if (apps.length === 0) {
        toast.error("Debes iniciar una postulación primero.");
        router.push("/convocatoria/pagar");
        return;
      }
      const isApproved = apps.some((app) => app.status === "accepted");
      if (!isApproved) {
        toast.error("Tu postulación aún no ha sido aprobada.");
        router.push("/convocatoria/mi-solicitud");
      }
    }
  }, [isAuthLoading, appsLoading, pavsLoading, isInvited, isAuthenticated, apps, router]);

  const [q, setQ] = useState("");
  const [tech, setTech] = useState<string | "all">("all");
  const [pavilion, setPavilion] = useState<string | "all">("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);

  // Modal de QR
  const [qrForId, setQrForId] = useState<string | null>(null);
  const [artistQrOpen, setArtistQrOpen] = useState(false);

  const { data: techniques = [] } = useTechniques();

  const filters = useMemo(
    () => ({
      q: q || undefined,
      event: DEFAULT_EVENT_ID,
      pavilion: pavilion === "all" ? undefined : pavilion,
      technique: tech === "all" ? undefined : tech,
      limit: 24,
      artist: artistId,
      // Sus obras esperan a que la feria publique el catálogo; en su propio
      // estudio el artista tiene que verlas igual.
      includeHidden: 1,
    }),
    [q, pavilion, tech, artistId]
  );

  const artworksQuery = useArtworksCursor(filters as any);
  const rows = (artworksQuery.rows ?? []) as ArtworkRow[];

  const { data: detailData, isFetching: loadingDetail } = useArtworkDetail(
    detailId ?? undefined
  );

  const pavilionOptions = useMemo(
    () =>
      (pavsByUser?.rows ?? []).map((p) => ({
        value: String(p.pavilionId),
        label: p.name || p.slug || "Pabellón",
      })),
    [pavsByUser]
  );

  const techniqueOptions = useMemo(
    () =>
      (techniques ?? []).map((t: any) => ({
        value: t.id || t._id,
        label: t.name,
      })),
    [techniques]
  );

  const openNew = () => {
    if (locked) {
      toast.error("Ya enviaste tu inventario: escríbele a la feria para cambiar algo.");
      return;
    }
    setEditingId(null);
    setModalOpen(true);
  };

  if (isAuthLoading || appsLoading || pavsLoading) {
    return (
      <div className="fdm-studio" style={{ ...STUDIO_VARS, background: "var(--bg)", minHeight: "70vh" }}>
        <style>{STUDIO_CSS}</style>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(28px,4vw,56px) clamp(20px,4vw,48px)", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="fdm-skel" style={{ width: 120, height: 10 }} />
          <div className="fdm-skel" style={{ width: "min(420px,70%)", height: 42 }} />
          <div className="fdm-skel" style={{ width: "min(640px,90%)", height: 14 }} />
          <div style={{ height: 20 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div className="fdm-skel" style={{ width: 72, height: 72, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="fdm-skel" style={{ width: `${54 - i * 8}%`, height: 15 }} />
                <div className="fdm-skel" style={{ width: `${38 - i * 6}%`, height: 11 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !artistId) {
    return (
      <div className="fdm-studio" style={{ ...STUDIO_VARS, background: "var(--bg)", minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ ...BODY, textAlign: "center" }}>Debes iniciar sesión para entrar a tu estudio.</p>
      </div>
    );
  }

  // Sin resolución aceptada no hay catálogo que cargar. En vez de un
  // "redirigiendo" que no explica nada, se muestra en qué punto va y qué le
  // toca hacer — el mismo panel que usa /admin/account.
  const isApproved = isInvited || apps.some((app) => app.status === "accepted");
  if (!isApproved && !appsLoading) {
    return (
      <div className="fdm-studio" style={{ ...STUDIO_VARS, background: "var(--bg)", minHeight: "60vh" }}>
        <style>{STUDIO_CSS}</style>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "clamp(30px,5vw,70px) clamp(20px,4vw,56px)",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ ...EYEBROW, color: "var(--acc)" }}>Convocatoria</span>
            <h1 style={DISPLAY}>Tu estudio te espera</h1>
            <p style={{ ...BODY, maxWidth: "56ch" }}>
              Vas a poder cargar las obras finales que salen al catálogo en cuanto
              tu postulación quede aceptada. Este es el punto en el que va.
            </p>
          </div>

          <ApplicationStatusCard />
        </div>
      </div>
    );
  }

  const total = artworksQuery.totalLabel;
  const filtering = q || pavilion !== "all" || tech !== "all";

  return (
    <div className="fdm-studio" style={{ ...STUDIO_VARS, background: "var(--bg)", minHeight: "100vh" }}>
      <style>{STUDIO_CSS}</style>

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(26px,4vw,54px) clamp(20px,4vw,48px) clamp(56px,7vw,96px)",
        }}
      >
        {/* ── Cabecera ──────────────────────────────────────────────────── */}
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 22,
            paddingBottom: "clamp(18px,2.4vw,28px)",
            borderBottom: hair(20),
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: "min(100%,300px)" }}>
            <span style={{ ...EYEBROW, color: "var(--acc)" }}>
              Mi estudio{pavilionOptions[0] ? ` · ${pavilionOptions[0].label}` : ""}
            </span>
            <h1 style={DISPLAY}>Mi estudio</h1>
            <p style={{ ...BODY, maxWidth: "52ch" }}>
              Carga tus obras, escribe de qué va tu proyecto y envíalo a la feria.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" style={btnGhost} onClick={() => setArtistQrOpen(true)}>
              <QrCode size={14} strokeWidth={1.6} />
              Mi QR
            </button>
            {!locked && (
              <button type="button" style={btnSolid} onClick={openNew}>
                <Plus size={15} strokeWidth={1.8} />
                Nueva obra
              </button>
            )}
          </div>
        </header>

        {/* ── Pestañas ──────────────────────────────────────────────────── */}
        <Tabs defaultValue="artworks" className="">
          <TabsList className="fdm-studio-tablist" style={{ marginTop: 26 }}>
            <TabsTrigger value="artworks" className="fdm-studio-tab">
              <Brush size={14} strokeWidth={1.6} />
              Obras
            </TabsTrigger>
            <TabsTrigger value="orders" className="fdm-studio-tab">
              <Receipt size={14} strokeWidth={1.6} />
              Entregas
            </TabsTrigger>
          </TabsList>

          {/* ── OBRAS ───────────────────────────────────────────────────── */}
          <TabsContent value="artworks" className="" style={{ marginTop: "clamp(24px,3vw,38px)" }}>
            {locked && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "14px 16px",
                  marginBottom: "clamp(22px,2.6vw,32px)",
                  border: `1px solid ${mix(20)}`,
                  background: mix(4),
                }}
              >
                <Lock size={15} strokeWidth={1.6} style={{ marginTop: 2, color: "var(--acc)", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: mix(72) }}>
                  Enviaste tu inventario el{" "}
                  <strong style={{ fontWeight: 500 }}>
                    {new Date(sentAt as string).toLocaleDateString("es-CO", { day: "2-digit", month: "long" })}
                  </strong>
                  . Ya no se puede editar desde acá: si necesitas cambiar una obra, escríbele a la feria.
                </p>
              </div>
            )}

            {/* Filtros: una fila de líneas, no una tarjeta flotante */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                gap: "clamp(14px,2.2vw,26px)",
                paddingBottom: 16,
                borderBottom: hair(16),
              }}
            >
              <div style={{ flex: "1 1 240px", minWidth: "min(100%,220px)", position: "relative" }}>
                <label htmlFor="studio-q" style={{ ...EYEBROW, fontSize: 9.5, letterSpacing: "0.22em", color: mix(58), display: "block", marginBottom: 2 }}>
                  Buscar
                </label>
                <Search
                  size={14}
                  strokeWidth={1.5}
                  style={{ position: "absolute", left: 0, bottom: 13, color: mix(40), pointerEvents: "none" }}
                />
                <input
                  id="studio-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Título o descripción"
                  style={{ ...fieldInput, paddingLeft: 22 }}
                />
              </div>

              {pavilionOptions.length > 1 && (
                <div style={{ flex: "0 1 200px", minWidth: "min(100%,170px)" }}>
                  <label htmlFor="studio-pav" style={{ ...EYEBROW, fontSize: 9.5, letterSpacing: "0.22em", color: mix(58), display: "block", marginBottom: 2 }}>
                    Pabellón
                  </label>
                  <select id="studio-pav" value={pavilion} onChange={(e) => setPavilion(e.target.value)} style={fieldInput}>
                    <option value="all">Todos</option>
                    {pavilionOptions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ flex: "0 1 200px", minWidth: "min(100%,170px)" }}>
                <label htmlFor="studio-tech" style={{ ...EYEBROW, fontSize: 9.5, letterSpacing: "0.22em", color: mix(58), display: "block", marginBottom: 2 }}>
                  Técnica
                </label>
                <select id="studio-tech" value={tech} onChange={(e) => setTech(e.target.value)} style={fieldInput}>
                  <option value="all">Todas</option>
                  {techniqueOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <span
                aria-live="polite"
                style={{ ...EYEBROW, fontSize: 9.5, color: mix(52), paddingBottom: 12, whiteSpace: "nowrap" }}
              >
                {artworksQuery.isFetching ? "Buscando…" : `${total} ${total === "1" ? "obra" : "obras"}`}
              </span>

              {filtering && (
                <button
                  type="button"
                  className="fdm-studio-plain"
                  onClick={() => {
                    setQ("");
                    setTech("all");
                    setPavilion("all");
                  }}
                  style={{
                    ...EYEBROW,
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    background: "transparent",
                    border: 0,
                    padding: "0 0 12px",
                    cursor: "pointer",
                    color: "var(--acc)",
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>

            <ArtworksTable
              rows={rows}
              loading={artworksQuery.isLoading}
              locked={locked}
              filtering={!!filtering}
              onView={(id) => setDetailId(id)}
              onEdit={(id) => {
                setEditingId(id);
                setModalOpen(true);
              }}
              onCreate={openNew}
              onOpenQr={(id) => setQrForId(id)}
              onShare={(msg) => toast.success(msg)}
              onLoadMore={() => artworksQuery.loadMore()}
              hasMore={!!artworksQuery.hasNextPage}
              loadingMore={!!artworksQuery.isFetchingNextPage}
            />

            {/* El proyecto y el envío: el final del camino, debajo de las obras */}
            <div style={{ marginTop: "clamp(44px,5vw,72px)" }}>
              <ProjectCard
                artistId={String(artistId)}
                artworkCount={rows.length}
                pavilionName={pavilionOptions[0]?.label}
              />
            </div>
          </TabsContent>

          {/* ── ENTREGAS ────────────────────────────────────────────────── */}
          <TabsContent value="orders" className="" style={{ marginTop: "clamp(24px,3vw,38px)" }}>
            <ArtistOrders />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de detalle (ver) */}
      <ArtworkDetailModal
        id={detailId}
        data={detailData}
        open={!!detailId}
        loading={loadingDetail}
        locked={locked}
        onClose={() => setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null);
          setEditingId(id);
          setModalOpen(true);
        }}
        onOpenQr={(id) => setQrForId(id)}
      />

      {/* Modal crear/editar (unificado) */}
      <CreateEditArtworkModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        eventId={DEFAULT_EVENT_ID}
        editingId={editingId}
        currentRows={rows}
        techniqueOptions={techniqueOptions}
        pavilionOptions={pavilionOptions}
        artistId={artistId as string}
        onDone={() => {
          setEditingId(null);
          setModalOpen(false);
        }}
      />

      {/* Modal de QR */}
      <QRModal artworkId={qrForId} open={!!qrForId} onClose={() => setQrForId(null)} />

      <ArtistQrModal
        artistId={String(artistId)}
        open={artistQrOpen}
        onClose={() => setArtistQrOpen(false)}
      />
    </div>
  );
}
