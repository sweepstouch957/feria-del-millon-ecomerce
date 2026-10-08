"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Brush,
  Check,
  Lock,
  Plus,
  QrCode,
  Receipt,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { useTechniques } from "@hooks/queries/useTechniques";
import { usePavilionsByUser } from "@hooks/queries/usePavilionsByUser";
import { useArtworksCursor, type ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import {
  getMyApplications,
  getMyProject,
  sendMyInventory,
  updateMyProject,
} from "@services/applications.service";

import ArtworksTable from "./ArtworksTable";
import ArtworkDetailModal from "./ArtworkDetailModal";
import ArtistOrders from "./ArtistOrders";
import { useAuth } from "@provider/authProvider";
import { useEventId } from "@provider/editionProvider";

import CreateEditArtworkModal from "./CreateEditArtworkModal";
import QRModal from "./QrModal";
import ArtistQrModal from "./ArtistQrModal";
import ApplicationStatusCard from "@components/views/admin/artist/ApplicationStatusCard";
import StudioSheet from "./StudioSheet";
import StudioStepper, { type Step, type StepKey } from "./StudioStepper";
import ProjectFields, { MAX_PROJECT_WORDS, countWords } from "./ProjectFields";
import ReviewPanel from "./ReviewPanel";
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

   Era una página larga donde todo estaba al mismo nivel y no se sabía qué
   tocaba primero. Ahora es un camino de tres pasos —cargar las obras, contar
   el proyecto, revisar y enviar— con la acción del paso siempre en la barra de
   abajo. Se puede ir y volver: lo único que no se deshace es el envío. */

export default function MiEstudioClient() {
  const router = useRouter();
  const DEFAULT_EVENT_ID = useEventId();
  const { user, isAuthLoading, isAuthenticated } = useAuth();
  const artistId = user?.id || user?._id;
  const qc = useQueryClient();

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

  useEffect(() => {
    if (!isAuthLoading && !appsLoading && !pavsLoading && isAuthenticated) {
      if (isInvited) return;
      if (apps.length === 0) {
        toast.error("Debes iniciar una postulación primero.");
        router.push("/convocatoria/pagar");
        return;
      }
      if (!apps.some((app) => app.status === "accepted")) {
        toast.error("Tu postulación aún no ha sido aprobada.");
        router.push("/convocatoria/mi-solicitud");
      }
    }
  }, [isAuthLoading, appsLoading, pavsLoading, isInvited, isAuthenticated, apps, router]);

  /* ── El proyecto y el envío ──────────────────────────────────────────── */
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["my-project"],
    queryFn: getMyProject,
    staleTime: 60_000,
    enabled: !!artistId && isAuthenticated,
  });

  const sentAt = project?.inventorySentAt;
  const locked = !!sentAt;

  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [touched, setTouched] = useState(false);

  // Lo guardado manda: al llegar (o al refrescar) se reescriben los campos.
  useEffect(() => {
    if (!project) return;
    setTitle(project.projectTitle || "");
    setReview(project.projectReview || "");
    setTouched(false);
  }, [project]);

  const words = countWords(review);
  const tooLong = words > MAX_PROJECT_WORDS;

  const save = useMutation({
    mutationFn: () => updateMyProject({ projectTitle: title, projectReview: review }),
    onSuccess: (p) => {
      qc.setQueryData(["my-project"], { ...(project ?? {}), ...p });
      setTouched(false);
    },
    onError: () => toast.error("No se pudo guardar el proyecto"),
  });

  const [confirming, setConfirming] = useState(false);

  /* ── Obras ───────────────────────────────────────────────────────────── */
  const [q, setQ] = useState("");
  const [tech, setTech] = useState<string | "all">("all");
  const [pavilion, setPavilion] = useState<string | "all">("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  const { data: detailData, isFetching: loadingDetail } = useArtworkDetail(detailId ?? undefined);

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
      (techniques ?? []).map((t: any) => ({ value: t.id || t._id, label: t.name })),
    [techniques]
  );

  const send = useMutation({
    mutationFn: () => sendMyInventory({ artworkCount: rows.length, pavilionName: pavilionOptions[0]?.label }),
    onSuccess: (r) => {
      qc.setQueryData(["my-project"], { ...(project ?? {}), inventorySentAt: r.inventorySentAt });
      setConfirming(false);
      toast.success("Inventario enviado. Ya tienes tus QR.");
    },
    onError: (e: any) => {
      // Enviar es de una sola vez: si ya estaba enviado, el servidor lo dice.
      const already = e?.response?.data?.inventorySentAt;
      setConfirming(false);
      if (already) {
        qc.setQueryData(["my-project"], { ...(project ?? {}), inventorySentAt: already });
        toast.error("Ya habías enviado tu inventario");
        return;
      }
      toast.error("No se pudo avisar a la feria");
    },
  });

  /* ── Pasos ───────────────────────────────────────────────────────────── */
  const [tab, setTab] = useState("inventario");
  const [step, setStep] = useState<StepKey>("obras");

  // Al entrar se abre en el paso donde quedó, no siempre en el primero.
  const [placed, setPlaced] = useState(false);
  useEffect(() => {
    if (placed || projectLoading || artworksQuery.isLoading) return;
    setStep(locked ? "enviar" : !rows.length ? "obras" : !project?.projectTitle ? "proyecto" : "enviar");
    setPlaced(true);
  }, [placed, projectLoading, artworksQuery.isLoading, locked, rows.length, project?.projectTitle]);

  const steps: Step[] = [
    {
      key: "obras",
      label: "Tus obras",
      hint: rows.length
        ? `${rows.length} ${rows.length === 1 ? "obra cargada" : "obras cargadas"}`
        : "Carga la primera con su imagen y su precio",
      done: rows.length > 0,
    },
    {
      key: "proyecto",
      label: "Tu proyecto",
      hint: project?.projectTitle
        ? project.projectTitle
        : "Ponle título y cuenta de qué va",
      done: !!project?.projectTitle,
    },
    {
      key: "enviar",
      label: "Revisar y enviar",
      hint: locked
        ? `Enviado el ${new Date(sentAt as string).toLocaleDateString("es-CO")}`
        : "Lo revisas y se lo mandas a la feria",
      done: locked,
    },
  ];

  const openNew = () => {
    if (locked) {
      toast.error("Ya enviaste tu inventario: escríbele a la feria para cambiar algo.");
      return;
    }
    setEditingId(null);
    setModalOpen(true);
  };

  const saveAndGo = async () => {
    if (tooLong) {
      toast.error("La descripción se pasó de 250 palabras.");
      return;
    }
    if (touched) {
      try {
        await save.mutateAsync();
        toast.success("Proyecto guardado");
      } catch {
        return; // el error ya se avisó; no se avanza con algo sin guardar
      }
    }
    setStep("enviar");
  };

  const trySend = () => {
    if (!rows.length) {
      toast.error("Carga al menos una obra antes de enviar.");
      setStep("obras");
      return;
    }
    if (!title.trim()) {
      toast.error("Ponle título a tu proyecto antes de enviarlo.");
      setStep("proyecto");
      return;
    }
    if (touched) {
      toast.error("Guarda el proyecto antes de enviarlo.");
      setStep("proyecto");
      return;
    }
    setConfirming(true);
  };

  /* ── Pantallas previas ───────────────────────────────────────────────── */
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

  const isApproved = isInvited || apps.some((app) => app.status === "accepted");
  if (!isApproved && !appsLoading) {
    return (
      <div className="fdm-studio" style={{ ...STUDIO_VARS, background: "var(--bg)", minHeight: "60vh" }}>
        <style>{STUDIO_CSS}</style>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(30px,5vw,70px) clamp(20px,4vw,56px)", display: "flex", flexDirection: "column", gap: 22 }}>
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

  const filtering = !!(q || pavilion !== "all" || tech !== "all");
  const total = artworksQuery.totalLabel;
  const showBar = tab === "inventario" && !locked;

  return (
    <div className="fdm-studio" style={{ ...STUDIO_VARS, background: "var(--bg)", minHeight: "100vh" }}>
      <style>{STUDIO_CSS}</style>

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: `clamp(26px,4vw,54px) clamp(20px,4vw,48px) ${showBar ? "150px" : "clamp(56px,7vw,96px)"}`,
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
            paddingBottom: "clamp(16px,2.2vw,24px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: "min(100%,300px)" }}>
            <span style={{ ...EYEBROW, color: "var(--acc)" }}>
              Mi estudio{pavilionOptions[0] ? ` · ${pavilionOptions[0].label}` : ""}
            </span>
            <h1 style={DISPLAY}>Mi estudio</h1>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" style={btnGhost} onClick={() => setArtistQrOpen(true)}>
              <QrCode size={14} strokeWidth={1.6} />
              Mi QR
            </button>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="">
          <TabsList className="fdm-studio-tablist">
            <TabsTrigger value="inventario" className="fdm-studio-tab">
              <Brush size={14} strokeWidth={1.6} />
              Mi inventario
            </TabsTrigger>
            <TabsTrigger value="orders" className="fdm-studio-tab">
              <Receipt size={14} strokeWidth={1.6} />
              Entregas
            </TabsTrigger>
          </TabsList>

          {/* ── INVENTARIO: los tres pasos ──────────────────────────────── */}
          <TabsContent value="inventario" className="" style={{ marginTop: "clamp(22px,2.6vw,32px)" }}>
            {locked && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "14px 16px",
                  marginBottom: "clamp(20px,2.4vw,28px)",
                  border: `1px solid ${mix(20)}`,
                  background: mix(4),
                }}
              >
                <Lock size={15} strokeWidth={1.6} style={{ marginTop: 2, color: "var(--acc)", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: mix(72) }}>
                  Tu inventario ya está entregado, así que esto queda de consulta. Si necesitas
                  cambiar una obra, escríbele a la feria.
                </p>
              </div>
            )}

            <StudioStepper steps={steps} current={step} onSelect={setStep} />

            <div style={{ marginTop: "clamp(28px,3.4vw,44px)" }}>
              {/* PASO 1 ─ Obras */}
              {step === "obras" && (
                <section>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: "clamp(20px,2.4vw,30px)" }}>
                    <span style={{ ...EYEBROW, color: "var(--acc)" }}>Paso 1 de 3</span>
                    <h2
                      style={{
                        margin: 0,
                        fontWeight: 300,
                        fontSize: "clamp(23px,2.8vw,34px)",
                        lineHeight: 1.05,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      Tus obras
                    </h2>
                    <p style={{ ...BODY, maxWidth: "54ch" }}>
                      Cada obra lleva su imagen, sus dimensiones, su técnica, su precio y cuántas
                      copias hay. Puedes editarlas hasta que envíes el inventario.
                    </p>
                  </div>

                  {/* Filtros: solo estorban cuando hay poco que filtrar */}
                  {(rows.length > 4 || filtering) && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                        gap: "clamp(14px,2.2vw,26px)",
                        paddingBottom: 16,
                        borderBottom: hair(16),
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ flex: "1 1 240px", minWidth: "min(100%,220px)", position: "relative" }}>
                        <label htmlFor="studio-q" style={{ ...EYEBROW, fontSize: 9.5, letterSpacing: "0.22em", color: mix(58), display: "block", marginBottom: 2 }}>
                          Buscar
                        </label>
                        <Search size={14} strokeWidth={1.5} style={{ position: "absolute", left: 0, bottom: 13, color: mix(40), pointerEvents: "none" }} />
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

                      <span aria-live="polite" style={{ ...EYEBROW, fontSize: 9.5, color: mix(52), paddingBottom: 12, whiteSpace: "nowrap" }}>
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
                          style={{ ...EYEBROW, fontSize: 9.5, letterSpacing: "0.14em", background: "transparent", border: 0, padding: "0 0 12px", cursor: "pointer", color: "var(--acc)" }}
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  )}

                  <ArtworksTable
                    rows={rows}
                    loading={artworksQuery.isLoading}
                    locked={locked}
                    filtering={filtering}
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
                </section>
              )}

              {/* PASO 2 ─ Proyecto */}
              {step === "proyecto" && (
                <ProjectFields
                  title={title}
                  review={review}
                  loading={projectLoading}
                  readOnly={locked}
                  onTitle={(v) => {
                    setTitle(v);
                    setTouched(true);
                  }}
                  onReview={(v) => {
                    setReview(v);
                    setTouched(true);
                  }}
                />
              )}

              {/* PASO 3 ─ Revisar y enviar */}
              {step === "enviar" && (
                <ReviewPanel
                  rows={rows}
                  projectTitle={title}
                  projectReview={review}
                  pavilionName={pavilionOptions[0]?.label}
                  artistId={String(artistId)}
                  sentAt={sentAt}
                  onFix={(id) => {
                    setEditingId(id);
                    setModalOpen(true);
                  }}
                />
              )}
            </div>
          </TabsContent>

          {/* ── ENTREGAS ────────────────────────────────────────────────── */}
          <TabsContent value="orders" className="" style={{ marginTop: "clamp(24px,3vw,38px)" }}>
            <ArtistOrders />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Barra del paso: la acción siempre al alcance del pulgar ─────── */}
      {showBar && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            background: "color-mix(in srgb, var(--bg) 94%, transparent)",
            backdropFilter: "blur(8px)",
            borderTop: `1px solid ${mix(16)}`,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "14px clamp(20px,4vw,48px)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: "min(100%,180px)" }}>
              <span style={{ ...EYEBROW, fontSize: 9, color: mix(46) }}>
                Paso {step === "obras" ? 1 : step === "proyecto" ? 2 : 3} de 3
              </span>
              <span style={{ fontSize: 14.5, lineHeight: 1.3 }}>
                {step === "obras"
                  ? rows.length
                    ? `${rows.length} ${rows.length === 1 ? "obra cargada" : "obras cargadas"}`
                    : "Todavía sin obras"
                  : step === "proyecto"
                    ? touched
                      ? "Sin guardar"
                      : title
                        ? "Proyecto guardado"
                        : "Ponle título"
                    : "Todo listo para enviar"}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginLeft: "auto" }}>
              {step !== "obras" && (
                <button
                  type="button"
                  style={btnGhost}
                  onClick={() => setStep(step === "enviar" ? "proyecto" : "obras")}
                >
                  <ArrowLeft size={14} strokeWidth={1.6} />
                  Atrás
                </button>
              )}

              {step === "obras" && (
                <>
                  <button type="button" style={rows.length ? btnGhost : btnSolid} onClick={openNew}>
                    <Plus size={15} strokeWidth={1.8} />
                    Nueva obra
                  </button>
                  {rows.length > 0 && (
                    <button type="button" style={btnSolid} onClick={() => setStep("proyecto")}>
                      Seguir con el proyecto
                      <ArrowRight size={14} strokeWidth={1.8} />
                    </button>
                  )}
                </>
              )}

              {step === "proyecto" && (
                <button
                  type="button"
                  style={{ ...btnSolid, opacity: tooLong ? 0.45 : 1 }}
                  onClick={saveAndGo}
                  disabled={save.isPending || tooLong}
                >
                  {save.isPending ? (
                    "Guardando…"
                  ) : (
                    <>
                      <Check size={14} strokeWidth={1.8} />
                      {touched ? "Guardar y seguir" : "Seguir a revisar"}
                    </>
                  )}
                </button>
              )}

              {step === "enviar" && (
                <button type="button" style={btnSolid} onClick={trySend} disabled={send.isPending}>
                  <Send size={14} strokeWidth={1.8} />
                  {send.isPending ? "Enviando…" : "Enviar mi inventario"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar el envío: es irreversible, se dice con números ────── */}
      <StudioSheet
        open={confirming}
        onClose={() => !send.isPending && setConfirming(false)}
        eyebrow="Se envía una sola vez"
        title="¿Enviamos tu inventario?"
        maxWidth={520}
        footer={
          <>
            <button type="button" style={btnGhost} onClick={() => setConfirming(false)} disabled={send.isPending}>
              Todavía no
            </button>
            <button type="button" style={btnSolid} onClick={() => send.mutate()} disabled={send.isPending}>
              <Send size={14} strokeWidth={1.8} />
              {send.isPending ? "Enviando…" : "Sí, enviar"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ ...BODY, color: mix(80) }}>
            Vas a enviarle a la feria{" "}
            <strong style={{ fontWeight: 500, color: "var(--fg)" }}>
              {rows.length} {rows.length === 1 ? "obra" : "obras"}
            </strong>
            {title ? (
              <>
                {" "}del proyecto <strong style={{ fontWeight: 500, color: "var(--fg)" }}>{title}</strong>
              </>
            ) : null}
            .
          </p>
          <div style={{ display: "grid", gap: 10, padding: "16px 0", borderTop: hair(14), borderBottom: hair(14) }}>
            {[
              "Después de enviar no vas a poder editar tus obras por tu cuenta.",
              "La feria recibe el aviso y revisa tu inventario.",
              "Te quedan tus dos códigos QR para imprimir y poner en el stand.",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ width: 4, height: 4, borderRadius: 4, background: "var(--acc)", marginTop: 8, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, lineHeight: 1.6, color: mix(70) }}>{t}</span>
              </div>
            ))}
          </div>
          <p style={{ ...EYEBROW, fontSize: 9.5, color: mix(48), margin: 0 }}>
            Si falta una obra, cierra esto y cárgala primero.
          </p>
        </div>
      </StudioSheet>

      {/* Modales de obra */}
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

      <QRModal artworkId={qrForId} open={!!qrForId} onClose={() => setQrForId(null)} />

      <ArtistQrModal artistId={String(artistId)} open={artistQrOpen} onClose={() => setArtistQrOpen(false)} />
    </div>
  );
}
