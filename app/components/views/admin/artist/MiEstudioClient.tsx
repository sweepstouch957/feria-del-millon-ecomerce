"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { Input } from "@components/ui/input";
import { Loader2, Plus, Brush, Receipt, Filter } from "lucide-react";
import { toast } from "sonner";

import { useTechniques } from "@hooks/queries/useTechniques";
import { usePavilionsByUser } from "@hooks/queries/usePavilionsByUser";
import {
  useArtworksCursor,
  type ArtworkRow,
} from "@hooks/queries/useArtworksCursor";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { getMyApplications } from "@services/applications.service";

import ArtworksTable from "./ArtworksTable";
import ArtworkDetailModal from "./ArtworkDetailModal";
import OrdersPlaceholder from "./OrdersPlaceholder";
import { useAuth } from "@provider/authProvider";
import { useEventId } from "@provider/editionProvider";

// Modales extra
import CreateEditArtworkModal from "./CreateEditArtworkModal";
import QRModal from "./QrModal";
import ApplicationStatusCard from "@components/views/admin/artist/ApplicationStatusCard";

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

  useEffect(() => {
    if (!isAuthLoading && !appsLoading && isAuthenticated) {
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
  }, [isAuthLoading, appsLoading, isAuthenticated, apps, router]);

  const [q, setQ] = useState("");
  const [tech, setTech] = useState<string | "all">("all");
  const [pavilion, setPavilion] = useState<string | "all">("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);

  // Modal de QR
  const [qrForId, setQrForId] = useState<string | null>(null);

  const { data: techniques = [] } = useTechniques();
  const { data: pavsByUser } = usePavilionsByUser(
    DEFAULT_EVENT_ID,
    artistId as string,
    true
  );

  const filters = useMemo(
    () => ({
      q: q || undefined,
      event: DEFAULT_EVENT_ID,
      pavilion: pavilion === "all" ? undefined : pavilion,
      technique: tech === "all" ? undefined : tech,
      limit: 24,
      artist: artistId 
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

  if (isAuthLoading || appsLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-600">
        <Loader2 className="w-6 h-6 mb-2 animate-spin" />
        <p>Cargando información del artista…</p>
      </div>
    );
  }
  if (!isAuthenticated || !artistId) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-gray-600">
        Debes iniciar sesión para acceder a tu estudio.
      </div>
    );
  }

  // Sin resolución aceptada no hay catálogo que cargar. En vez de un
  // "redirigiendo" que no explica nada, se muestra en qué punto va y qué le
  // toca hacer — el mismo panel que usa /admin/account.
  const isApproved = apps.some((app) => app.status === "accepted");
  if (!isApproved && !appsLoading) {
    return (
      <div
        style={{
          "--bg": "var(--fdm-bg,#F7F6F2)",
          "--fg": "var(--fdm-fg,#0B0B0A)",
          "--acc": "var(--fdm-green,#3FA46E)",
          background: "var(--bg)",
          color: "var(--fg)",
          fontFamily: "Jost, system-ui, sans-serif",
          fontWeight: 400,
          minHeight: "60vh",
        } as React.CSSProperties}
      >
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1
              style={{
                margin: 0,
                fontWeight: 300,
                fontSize: "clamp(28px,3.4vw,44px)",
                lineHeight: 1.05,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Tu estudio te espera
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: "56ch",
                fontSize: 15,
                lineHeight: 1.6,
                color: "color-mix(in srgb, var(--fg) 72%, transparent)",
              }}
            >
              Vas a poder cargar las obras finales que salen al catálogo en cuanto
              tu postulación quede aceptada. Este es el punto en el que va.
            </p>
          </div>

          <ApplicationStatusCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Mi estudio de artista
            </h1>
            <p className="text-gray-600">
              Crea, edita, comparte y administra tus obras
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null); // modo crear
              setModalOpen(true);
            }}
            className="h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva obra
          </Button>
        </div>

        <Tabs defaultValue="artworks" className="space-y-6">
          {/* TABS con íconos y estilos */}
          <TabsList
            className="
              inline-flex w-full md:w-auto items-center justify-start 
              rounded-xl border border-gray-200 bg-white p-1 gap-2
              shadow-sm
            "
          >
            <TabsTrigger
              value="artworks"
              className="
                data-[state=active]:bg-gray-900 data-[state=active]:text-white
                data-[state=inactive]:text-gray-700
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors flex items-center gap-2
                hover:bg-gray-100 data-[state=active]:hover:bg-gray-800
              "
            >
              <Brush className="w-4 h-4" />
              Obras
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="
                data-[state=active]:bg-gray-900 data-[state=active]:text-white
                data-[state=inactive]:text-gray-700
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors flex items-center gap-2
                hover:bg-gray-100 data-[state=active]:hover:bg-gray-800
              "
            >
              <Receipt className="w-4 h-4" />
              Órdenes
            </TabsTrigger>
          </TabsList>

          {/* TAB OBRAS */}
          <TabsContent value="artworks" className="space-y-6">
            {/* Filtros (sticky) */}
            <div className="sticky top-3 z-10">
              <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar por título o descripción…"
                      className="h-10 pl-10"
                    />
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={pavilion}
                    onChange={(e) => setPavilion(e.target.value as any)}
                    className="h-10 px-3 py-2 rounded-md border bg-white"
                  >
                    <option value="all">Todos los pabellones</option>
                    {pavilionOptions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={tech}
                    onChange={(e) => setTech(e.target.value as any)}
                    className="h-10 px-3 py-2 rounded-md border bg-white"
                  >
                    <option value="all">Todas las técnicas</option>
                    {techniqueOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 text-sm text-gray-600 justify-between sm:justify-start">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">
                      {artworksQuery.totalLabel} obras
                    </span>
                    {artworksQuery.isFetching && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <ArtworksTable
              rows={rows}
              loading={artworksQuery.isLoading}
              onView={(id) => setDetailId(id)}
              onEdit={(id) => {
                setEditingId(id);
                setModalOpen(true);
              }}
              onOpenQr={(id) => setQrForId(id)} // integra QR aquí
              onShare={(msg) => toast.success(msg)}
              onLoadMore={() => artworksQuery.loadMore()}
              hasMore={!!artworksQuery.hasNextPage}
              loadingMore={!!artworksQuery.isFetchingNextPage}
            />
          </TabsContent>

          {/* TAB ÓRDENES */}
          <TabsContent value="orders" className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <OrdersPlaceholder />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de detalle (ver) */}
      <ArtworkDetailModal
        id={detailId}
        data={detailData}
        open={!!detailId}
        loading={loadingDetail}
        onClose={() => setDetailId(null)}
        onOpenQr={(id) => setQrForId(id)} // también desde el detalle
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
      <QRModal
        artworkId={qrForId}
        open={!!qrForId}
        onClose={() => setQrForId(null)}
      />
    </div>
  );
}
