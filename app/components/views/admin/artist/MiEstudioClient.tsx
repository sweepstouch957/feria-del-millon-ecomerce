"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SmartImage from "@components/ui/SmartImage";
import type { FormikProps } from "formik";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTechniques } from "@hooks/queries/useTechniques";
import { usePavilionsByUser } from "@hooks/queries/usePavilionsByUser";
import { useArtworksCursor, type ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { useArtistOrders } from "@hooks/queries/useArtistOrders";
import { getMyApplications } from "@services/applications.service";
import { useMyProject } from "@hooks/artist/useMyProject";
import { useDebouncedValue } from "@hooks/artist/useDebouncedValue";
import { useInventoryWindow } from "@hooks/artist/useInventoryWindow";
import { formatCOP } from "@lib/money";
import { useNavHeight } from "@components/views/catalog/shared";

import ArtworksTable from "./ArtworksTable";
import ArtworkDetailModal from "./ArtworkDetailModal";
import ArtworkEditor from "./ArtworkEditor";
import ArtistOrders, { formatOrderDate, orderStats } from "./ArtistOrders";
import StudioAccount from "./StudioAccount";
import { useAuth } from "@provider/authProvider";
import { useEdition } from "@provider/editionProvider";

import QRModal from "./QrModal";
import QrHub from "./QrHub";
import { ARTIST_DOWNLOADS_ENABLED, NO_PRINT_CSS } from "./lock";
import ApplicationStatusCard from "@components/views/admin/artist/ApplicationStatusCard";
import StudioSheet from "./StudioSheet";
import ProjectFields from "./ProjectFields";
import ReviewPanel from "./ReviewPanel";
import { Bone, Dot, Ico, StudioButton, type IcoName } from "./ui";
import type { FormState } from "./ui/fields";
import type { ProjectFormValues } from "@validators/project";
import { STUDIO_CSS, STUDIO_VARS } from "./studioTheme";

/* ──────────────────────────────────────────────────────────────
   Mi estudio — port de "Mi estudio — Artistas" (Claude Design).
   Cuatro pestañas bajo el navbar del sitio: Inicio (qué sigue y
   cifras), Obras (inventario, editor, proyecto, envío y QR),
   Entregas y Cuenta. La lógica no cambió: la ventana de carga la
   decide la feria, el envío se confirma y el servidor valida todo.
   ────────────────────────────────────────────────────────────── */

type Tab = "inicio" | "obras" | "entregas" | "cuenta";
/** Pantallas dentro de Obras. */
type Sub = "lista" | "editor" | "qr" | "proyecto" | "enviar";

const TABS: { key: Tab; label: string; icon: IcoName }[] = [
  { key: "inicio", label: "Inicio", icon: "home" },
  { key: "obras", label: "Obras", icon: "grid" },
  { key: "entregas", label: "Entregas", icon: "box" },
  { key: "cuenta", label: "Cuenta", icon: "user" },
];

/** "3 nov, 2:06 p. m." en hora de Colombia: el artista tiene que ver que su envío quedó. */
const sentText = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Shell({ children, tabs }: { children: React.ReactNode; tabs?: React.ReactNode }) {
  const navH = useNavHeight();
  return (
    <div className="fdm-studio" style={{ ...STUDIO_VARS, "--nav-h": `${navH}px`, background: "var(--bg)", minHeight: "100vh" } as React.CSSProperties}>
      <style>{STUDIO_CSS}</style>
      {!ARTIST_DOWNLOADS_ENABLED && <style>{NO_PRINT_CSS}</style>}
      {tabs}
      <main className="fdm-st-wrap fdm-st-main">{children}</main>
    </div>
  );
}

export default function MiEstudioClient() {
  const { eventId: DEFAULT_EVENT_ID, eventName } = useEdition();
  const { user, isAuthLoading, isAuthenticated } = useAuth();
  const artistId = user?.id || user?._id;
  const artistName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Artista";

  const { data: apps = [], isLoading: appsLoading } = useQuery({
    queryKey: ["my-applications", artistId],
    queryFn: getMyApplications,
    enabled: !!artistId && isAuthenticated,
  });

  const { data: pavsByUser, isLoading: pavsLoading } = usePavilionsByUser(DEFAULT_EVENT_ID, artistId as string, true);

  /* Invitado por la feria: entra sin convocatoria y sin pagar. Vale por las
     dos vías, porque llegan en distinto orden: la marca de su postulación o
     tener ya un pabellón asignado. */
  const isInvited = apps.some((a) => a.invited) || (pavsByUser?.rows?.length ?? 0) > 0;

  /* ── El proyecto y el envío ──────────────────────────────────────────── */
  const { loading: projectLoading, initialValues, save, send, sentAt, locked, savedTitle, savedReview } = useMyProject(!!artistId && isAuthenticated);

  // El formulario del proyecto tiene su botón en la barra fija: la barra lo
  // envía por la ref y lee su estado del puente.
  const projectForm = useRef<FormikProps<ProjectFormValues>>(null);
  const [projectState, setProjectState] = useState<FormState>({ dirty: false, valid: true, submitting: false });
  const onProjectState = useCallback((s: FormState) => setProjectState(s), []);
  const saveProject = useCallback((v: ProjectFormValues) => save.mutateAsync(v), [save]);

  const [confirming, setConfirming] = useState(false);

  // La feria decide entre qué fechas se puede cargar. Acá sólo se dice antes.
  const inventory = useInventoryWindow();

  /* ── Obras ───────────────────────────────────────────────────────────── */
  const [q, setQ] = useState("");
  const [tech, setTech] = useState<string | "all">("all");
  const [pavilion, setPavilion] = useState<string | "all">("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [qrForId, setQrForId] = useState<string | null>(null);

  const { data: techniques = [] } = useTechniques();
  const debouncedQ = useDebouncedValue(q, 350);

  const filters = useMemo(
    () => ({
      q: debouncedQ || undefined,
      event: DEFAULT_EVENT_ID,
      pavilion: pavilion === "all" ? undefined : pavilion,
      technique: tech === "all" ? undefined : tech,
      limit: 24,
      artist: artistId,
      // Sus obras esperan a que la feria publique el catálogo; en su propio
      // estudio el artista tiene que verlas igual.
      includeHidden: 1,
    }),
    [debouncedQ, pavilion, tech, artistId, DEFAULT_EVENT_ID]
  );

  const artworksQuery = useArtworksCursor(filters as any);
  const rows = (artworksQuery.rows ?? []) as ArtworkRow[];

  const { data: detailData, isFetching: loadingDetail } = useArtworkDetail(detailId ?? undefined);
  const { data: orders = [] } = useArtistOrders(!!artistId && isAuthenticated);
  const stats = useMemo(() => orderStats(orders), [orders]);

  const pavilionOptions = useMemo(
    () => (pavsByUser?.rows ?? []).map((p) => ({ value: String(p.pavilionId), label: p.name || p.slug || "Pabellón" })),
    [pavsByUser]
  );
  // Un artista puede estar en más de un pabellón: se nombran todos.
  const pavilionNames = pavilionOptions.map((p) => p.label).join(" / ");

  const techniqueOptions = useMemo(() => (techniques ?? []).map((t: any) => ({ value: t.id || t._id, label: t.name })), [techniques]);

  const doSend = useCallback(() => {
    send
      .mutateAsync({ artworkCount: rows.length, pavilionName: pavilionNames || undefined })
      .catch(() => {})
      .finally(() => setConfirming(false));
  }, [send, rows.length, pavilionNames]);

  /* ── Navegación ──────────────────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("inicio");
  const [sub, setSub] = useState<Sub>("lista");

  // ?v=obras al recargar o compartir: se lee una vez al montar.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (v === "qr") {
      setTab("obras");
      setSub("qr");
    } else if (TABS.some((t) => t.key === v)) setTab(v as Tab);
  }, []);

  const go = useCallback((t: Tab, s: Sub = "lista") => {
    setTab(t);
    setSub(s);
    try {
      const url = new URL(window.location.href);
      if (t === "inicio") url.searchParams.delete("v");
      else url.searchParams.set("v", t === "obras" && s === "qr" ? "qr" : t);
      window.history.replaceState(window.history.state, "", url);
      window.scrollTo(0, 0);
    } catch {}
  }, []);

  // Haber enviado no cierra nada: mientras la carga esté abierta puede
  // agregar obras y volver a enviar. Lo que manda es la ventana de la feria.
  const openNew = useCallback(() => {
    if (!inventory.canUpload) {
      toast.error(inventory.reason as string);
      return;
    }
    setEditingId(null);
    go("obras", "editor");
  }, [inventory.canUpload, inventory.reason, go]);

  const openEdit = useCallback(
    (id: string) => {
      setDetailId(null);
      setEditingId(id);
      go("obras", "editor");
    },
    [go]
  );

  const openDetail = useCallback((id: string) => setDetailId(id), []);
  const openQr = useCallback((id: string) => setQrForId(id), []);
  const notify = useCallback((msg: string) => toast.success(msg), []);
  const loadMore = useCallback(() => artworksQuery.loadMore(), [artworksQuery]);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const closeQr = useCallback(() => setQrForId(null), []);
  const closeConfirm = useCallback(() => setConfirming(false), []);
  const backToList = useCallback(() => go("obras", "lista"), [go]);
  const clearFilters = useCallback(() => {
    setQ("");
    setTech("all");
    setPavilion("all");
  }, []);

  const saveAndGo = useCallback(async () => {
    const form = projectForm.current;
    if (!form) return;
    // `validateForm` devuelve los errores en la mano.
    const errors = await form.validateForm();
    if (Object.keys(errors).length > 0) {
      form.setTouched({ title: true, review: true });
      toast.error("Revisa tu proyecto antes de seguir.");
      return;
    }
    if (projectState.dirty) {
      try {
        await form.submitForm();
      } catch {
        return; // el error ya se avisó; no se avanza con algo sin guardar
      }
    }
    go("obras", "enviar");
  }, [projectState.dirty, go]);

  const trySend = useCallback(() => {
    if (!rows.length) {
      toast.error("Carga al menos una obra antes de enviar.");
      go("obras", "lista");
      return;
    }
    if (!savedTitle?.trim()) {
      toast.error("Ponle título a tu proyecto antes de enviarlo.");
      go("obras", "proyecto");
      return;
    }
    if (projectState.dirty) {
      toast.error("Guarda el proyecto antes de enviarlo.");
      go("obras", "proyecto");
      return;
    }
    setConfirming(true);
  }, [rows.length, savedTitle, projectState.dirty, go]);

  /* ── Pantallas previas ───────────────────────────────────────────────── */
  if (isAuthLoading || appsLoading || pavsLoading) {
    return (
      <Shell>
        <div className="fdm-st-col" aria-busy="true">
          <Bone w={220} h={12} />
          <Bone w="min(360px,70%)" h={40} />
          <Bone h={120} style={{ borderRadius: 16 }} />
          <Bone h={84} style={{ borderRadius: 16 }} />
          <Bone h={160} style={{ borderRadius: 16 }} />
        </div>
      </Shell>
    );
  }

  if (!isAuthenticated || !artistId) {
    return (
      <Shell>
        <div className="fdm-st-empty" style={{ padding: "56px 24px", marginTop: 24 }}>
          <b>Entra para ver tu estudio</b>
          Necesitas iniciar sesión con tu cuenta de artista.
          <Link href="/login?role=artist&redirect=%2Fadmin%2Fartist" className="fdm-st-btn is-green" style={{ marginTop: 8 }}>
            Entrar a mi estudio
          </Link>
        </div>
      </Shell>
    );
  }

  // Si ya tiene obras cargadas en la feria, está dentro aunque su postulación
  // haya quedado en borrador o la consulta de pabellones haya fallado.
  const isApproved = isInvited || rows.length > 0 || apps.some((app) => app.status === "accepted");
  if (!isApproved && artworksQuery.isLoading) return <Shell><span /></Shell>;
  if (!isApproved && !appsLoading) {
    return (
      <Shell>
        <div className="fdm-st-col" style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="fdm-st-eyebrow">Convocatoria</span>
            <h1 className="fdm-st-h1">Tu estudio te espera</h1>
            <p className="fdm-st-lead">
              Vas a poder cargar las obras finales que salen al catálogo en cuanto tu postulación quede aceptada. Este es el punto en el que va.
            </p>
          </div>
          <ApplicationStatusCard />
        </div>
      </Shell>
    );
  }

  const filtering = !!(q || pavilion !== "all" || tech !== "all");
  const total = artworksQuery.totalLabel;
  const obrasLabel = plural(rows.length, "obra cargada", "obras cargadas");
  const nextOrder = orders.find((o) => o.items.some((i) => i.deliveryStatus === "pending"));

  /* Qué sigue: un solo paso a la vez, en el orden en que la feria lo necesita. */
  const next = !rows.length
    ? { title: "Carga tu primera obra", sub: "Empieza por la foto, el título y el precio. Puedes editarla después.", btn: "Nueva obra", go: openNew }
    : !savedTitle
    ? { title: "Cuéntanos tu proyecto", sub: "Ponle título y explica en pocas líneas de qué va lo que expones.", btn: "Escribir mi proyecto", go: () => go("obras", "proyecto") }
    : !locked
    ? { title: "Envía tu inventario a la feria", sub: `Tienes ${obrasLabel}. Revísalas y envíalas para que la feria las reciba.`, btn: "Revisar y enviar", go: () => go("obras", "enviar") }
    : stats.pending > 0
    ? { title: `Tienes ${plural(stats.pending, "entrega pendiente", "entregas pendientes")}`, sub: "Coordina con cada comprador y márcalas como entregadas cuando las reciban.", btn: "Ver entregas", go: () => go("entregas") }
    : inventory.canUpload
    ? { title: "Todo al día", sub: "Tu inventario está enviado y no tienes entregas pendientes.", btn: "Agregar otra obra", go: openNew }
    : { title: "Todo al día", sub: "Tu inventario está enviado y no tienes entregas pendientes.", btn: "Ver mis obras", go: () => go("obras") };

  const inv = locked
    ? {
        cls: "",
        title: "La feria ya recibió tu inventario",
        text: `${sentAt ? `Último envío: ${sentText(sentAt)}. ` : ""}${
          inventory.canUpload
            ? "No tienes que volver a enviarlo. Solo si agregas o corriges obras, avísale a la feria."
            : "La carga cerró. Si necesitas cambiar una obra, escríbele a la feria."
        }`,
        btn: inventory.canUpload ? "Enviar de nuevo" : "",
        fill: false,
        step: sentAt ? `Enviado el ${new Date(sentAt).toLocaleDateString("es-CO")}` : "Enviado",
      }
    : {
        cls: inventory.canUpload ? " is-warn" : " is-mute",
        title: inventory.canUpload ? "Tu inventario está sin enviar" : "La carga de obras está cerrada",
        text: inventory.canUpload
          ? "Cuando tengas tus obras y tu proyecto listos, envíalos para que la feria los reciba."
          : (inventory.reason as string) || "La feria cerró la carga de obras.",
        btn: inventory.canUpload ? "Revisar y enviar" : "",
        fill: true,
        step: "Pendiente de enviar",
      };

  const tabsBar = (
    <div className="fdm-st-tabs">
      <nav className="fdm-st-wrap" aria-label="Secciones del estudio">
        {TABS.map((t) => (
          <button key={t.key} type="button" className="fdm-st-tab fdm-studio-plain" aria-pressed={tab === t.key} onClick={() => go(t.key)}>
            <Ico name={t.icon} />
            <span>{t.label}</span>
            {t.key === "entregas" && stats.pending > 0 && <span className="n">{stats.pending}</span>}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <Shell tabs={tabsBar}>
      {/* ══ INICIO ══════════════════════════════════════════════ */}
      {tab === "inicio" && (
        <div className="fdm-st-col">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="fdm-st-eyebrow">Mi estudio · {eventName}</span>
            <h1 className="fdm-st-h1">Hola, {user?.firstName || artistName}</h1>
          </div>

          <section className="fdm-st-next" aria-label="Qué sigue">
            <div className="txt">
              <span className="k">Qué sigue</span>
              <span className="t">{next.title}</span>
              <span className="s">{next.sub}</span>
            </div>
            <button type="button" className="fdm-studio-plain" onClick={next.go}>
              {next.btn}
              <Ico name="arrow" />
            </button>
          </section>

          <div className="fdm-st-stats">
            <div><span className="fdm-st-label">Obras cargadas</span><b>{artworksQuery.isLoading ? "—" : total}</b></div>
            <div><span className="fdm-st-label">Por entregar</span><b>{stats.pending}</b></div>
            <div><span className="fdm-st-label">Entregadas</span><b>{stats.delivered}</b></div>
            <div><span className="fdm-st-label">Tu parte total</span><b>{formatCOP(stats.total)}</b></div>
          </div>

          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 className="fdm-st-label" style={{ margin: 0, color: "var(--fg)" }}>Accesos rápidos</h2>
            <div className="fdm-st-quick">
              <button type="button" className="fdm-studio-plain" onClick={openNew}><Ico name="plus" /><span>Nueva obra</span></button>
              <button type="button" className="fdm-studio-plain" onClick={() => go("obras", "qr")}><Ico name="qr" /><span>Códigos QR</span></button>
              <button type="button" className="fdm-studio-plain" onClick={() => go("entregas")}><Ico name="box" /><span>Entregas</span></button>
              <a href={`/artista/${artistId}`} target="_blank" rel="noopener noreferrer"><Ico name="ext" size={16} sw={1.8} /><span>Ver mi página</span></a>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
              <h2 className="fdm-st-h2">Próxima entrega</h2>
              <button type="button" className="fdm-st-link fdm-studio-plain" onClick={() => go("entregas")}>Ver todas</button>
            </div>
            {nextOrder ? (
              (() => {
                const it = nextOrder.items.find((i) => i.deliveryStatus === "pending")!;
                return (
                  <button type="button" className="fdm-st-rowcard fdm-studio-plain" style={{ cursor: "pointer", textAlign: "left", color: "var(--fg)" }} onClick={() => go("entregas")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                      <span className="fdm-st-thumb" style={{ width: 56, height: 56 }}>
                        {it.image && <SmartImage src={it.image} alt="" fit="cover" sizes="56px" />}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 18, overflowWrap: "anywhere" }}>{it.title || "Obra"}</span>
                        <span style={{ fontSize: 14, color: "var(--fg2)" }}>#{nextOrder.code} · {formatOrderDate(nextOrder.createdAt)}</span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 18, fontWeight: 500 }}>{formatCOP(it.unitPrice, { currency: it.currency })}</span>
                      <span className="fdm-st-pill is-warn">Por entregar</span>
                    </span>
                  </button>
                );
              })()
            ) : (
              <div className="fdm-st-empty">Estás al día: no tienes entregas pendientes.</div>
            )}
          </section>
        </div>
      )}

      {/* ══ OBRAS · lista ═══════════════════════════════════════ */}
      {tab === "obras" && sub === "lista" && (
        <div className="fdm-st-col">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="fdm-st-eyebrow">{pavilionNames ? `${obrasLabel} · ${pavilionNames}` : obrasLabel}</span>
              <h1 className="fdm-st-h1">Tus obras</h1>
            </div>
            <div style={{ flex: "1 1 280px", maxWidth: 420, display: "flex", gap: 10 }}>
              <button type="button" className="fdm-st-btn is-solid fdm-studio-plain" style={{ flex: "1 1 0", padding: "0 16px" }} onClick={openNew} disabled={!inventory.canUpload}>
                <Ico name="plus" />Nueva obra
              </button>
              <button type="button" className="fdm-st-btn fdm-studio-plain" style={{ flex: "1 1 0", padding: "0 16px" }} onClick={() => go("obras", "qr")}>
                <Ico name="qr" />Códigos QR
              </button>
            </div>
          </div>

          <section className={`fdm-st-inv${inv.cls}`} aria-label="Estado de tu inventario">
            <div className="fdm-st-inv-top">
              <div className="txt">
                <span className="t">{inv.title}</span>
                <span className="s">{inv.text}</span>
              </div>
              {inv.btn && (
                <button type="button" className={`fdm-st-btn fdm-studio-plain${inv.fill ? " is-fill" : ""}`} style={{ padding: "0 22px" }} onClick={() => go("obras", "enviar")}>
                  {inv.btn}
                </button>
              )}
            </div>
            <div className="fdm-st-steps" aria-label="Pasos para entregar tu inventario">
              <div className="fdm-st-step" style={{ cursor: "default" }}>
                <Dot on={rows.length > 0} />
                <span className="txt"><span className="fdm-st-label">1 · Tus obras</span><span>{rows.length ? obrasLabel : "Carga la primera"}</span></span>
              </div>
              <button type="button" className="fdm-st-step fdm-studio-plain" onClick={() => go("obras", "proyecto")}>
                <Dot on={!!savedTitle} />
                <span className="txt"><span className="fdm-st-label">2 · Tu proyecto</span><span>{savedTitle || "Sin título todavía"}</span><u>{savedTitle ? "Editar proyecto" : "Escribir proyecto"}</u></span>
              </button>
              <button type="button" className="fdm-st-step fdm-studio-plain" onClick={() => go("obras", "enviar")}>
                <Dot on={locked} />
                <span className="txt"><span className="fdm-st-label">3 · Revisar y enviar</span><span>{inv.step}</span></span>
              </button>
            </div>
          </section>

          {/* Aviso de cierre próximo: se dice antes de que el guardado conteste que no. */}
          {inventory.canUpload && inventory.closingSoon && (
            <p className="fdm-st-card fdm-st-note" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Ico name="clock" style={{ color: "var(--warn)", marginTop: 2 }} />
              {inventory.closingSoon}
            </p>
          )}

          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="fdm-st-note" style={{ maxWidth: 640 }}>
              Cada obra lleva su imagen, sus dimensiones, su técnica, su precio y cuántas copias hay. Puedes agregar y editar obras mientras la carga esté abierta.
            </p>

            {/* Filtros: solo estorban cuando hay poco que filtrar */}
            {(rows.length > 4 || filtering) && (
              <div className="fdm-st-filters">
                <label className="fdm-st-search">
                  <Ico name="search" />
                  <input type="search" aria-label="Buscar por título" placeholder="Buscar por título" value={q} onChange={(e) => setQ(e.target.value)} />
                </label>
                {pavilionOptions.length > 1 && (
                  <select aria-label="Pabellón" className="fdm-st-select" value={pavilion} onChange={(e) => setPavilion(e.target.value)}>
                    <option value="all">Todos los pabellones</option>
                    {pavilionOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                )}
                <select aria-label="Técnica" className="fdm-st-select" value={tech} onChange={(e) => setTech(e.target.value)}>
                  <option value="all">Todas las técnicas</option>
                  {techniqueOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {filtering && <button type="button" className="fdm-st-link fdm-studio-plain" onClick={clearFilters}>Limpiar</button>}
              </div>
            )}

            <ArtworksTable
              rows={rows}
              loading={artworksQuery.isLoading}
              // Con la ventana abierta se agregan y corrigen obras aunque ya
              // haya enviado (fuera de ella el servidor rechaza).
              locked={!inventory.canUpload}
              canEdit={inventory.canUpload}
              filtering={filtering}
              onView={openDetail}
              onEdit={openEdit}
              onCreate={openNew}
              onOpenQr={openQr}
              onShare={notify}
              onLoadMore={loadMore}
              hasMore={!!artworksQuery.hasNextPage}
              loadingMore={!!artworksQuery.isFetchingNextPage}
            />
          </section>
        </div>
      )}

      {/* ══ OBRAS · editor ══════════════════════════════════════ */}
      {tab === "obras" && sub === "editor" && (
        <ArtworkEditor
          eventId={DEFAULT_EVENT_ID}
          artistId={artistId as string}
          artistName={artistName}
          editingId={editingId}
          currentRows={rows}
          techniqueOptions={techniqueOptions}
          pavilionOptions={pavilionOptions}
          onDone={backToList}
          onCancel={backToList}
        />
      )}

      {/* ══ OBRAS · códigos QR ══════════════════════════════════ */}
      {tab === "obras" && sub === "qr" && (
        <QrHub
          artistId={String(artistId)}
          artistName={artistName}
          rows={rows}
          loading={artworksQuery.isLoading}
          hasMore={!!artworksQuery.hasNextPage}
          onLoadMore={loadMore}
          filtering={filtering}
          onClearFilters={clearFilters}
          onBack={backToList}
        />
      )}

      {/* ══ OBRAS · proyecto ════════════════════════════════════ */}
      {tab === "obras" && sub === "proyecto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <button type="button" className="fdm-st-back fdm-studio-plain" onClick={backToList}><Ico name="back" />Volver a mis obras</button>
          <ProjectFields
            initial={initialValues}
            loading={projectLoading}
            readOnly={!inventory.canUpload}
            formRef={projectForm}
            onStateChange={onProjectState}
            onSave={saveProject}
          />
          <p className="fdm-st-note">
            Tu foto y tu presentación como artista se editan en{" "}
            <button type="button" className="fdm-st-link fdm-studio-plain" style={{ height: "auto", display: "inline" }} onClick={() => go("cuenta")}>Cuenta</button>.
          </p>
          <div className="fdm-st-bar">
            <span className="st">
              <b>{projectState.dirty ? "Cambios sin guardar" : savedTitle ? "Proyecto guardado" : "Ponle título a tu proyecto"}</b>
            </span>
            <div className="acts">
              <button type="button" className="fdm-st-btn fdm-studio-plain" onClick={backToList}>Atrás</button>
              <button type="button" className="fdm-st-btn is-green is-main fdm-studio-plain" onClick={saveAndGo} disabled={save.isPending || projectState.submitting || !inventory.canUpload}>
                {save.isPending ? "Guardando…" : projectState.dirty ? "Guardar y seguir" : "Seguir a revisar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ OBRAS · revisar y enviar ════════════════════════════ */}
      {tab === "obras" && sub === "enviar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <button type="button" className="fdm-st-back fdm-studio-plain" onClick={backToList}><Ico name="back" />Volver a mis obras</button>
          <ReviewPanel
            rows={rows}
            projectTitle={savedTitle || ""}
            projectReview={savedReview || ""}
            pavilionName={pavilionNames || undefined}
            artistId={String(artistId)}
            sentAt={sentAt}
            onGoQr={() => go("obras", "qr")}
            onFix={openEdit}
          />
          {(!locked || inventory.canUpload) && (
            <div className="fdm-st-bar">
              <span className="st">
                <b>{locked && sentAt ? `Enviado · ${sentText(sentAt)}` : "Todo listo para enviar"}</b>
              </span>
              <div className="acts">
                <button type="button" className="fdm-st-btn fdm-studio-plain" onClick={() => go("obras", "proyecto")}>Proyecto</button>
                <button type="button" className="fdm-st-btn is-green is-main fdm-studio-plain" onClick={trySend} disabled={send.isPending}>
                  {send.isPending ? "Enviando…" : locked ? "Enviar de nuevo" : "Enviar mi inventario"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ENTREGAS ════════════════════════════════════════════ */}
      {tab === "entregas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 className="fdm-st-h1">Entregas</h1>
            <p className="fdm-st-lead">Quién compró una obra tuya, a dónde va y qué falta por entregar.</p>
          </div>
          <ArtistOrders inFair />
        </div>
      )}

      {/* ══ CUENTA ══════════════════════════════════════════════ */}
      {tab === "cuenta" && <StudioAccount />}

      {/* ── Confirmar el envío: se dice con números ─────────────── */}
      <StudioSheet
        open={confirming}
        onClose={closeConfirm}
        eyebrow={locked ? "Actualizar el envío" : "Avisarle a la feria"}
        title={locked ? "¿Enviamos tu inventario actualizado?" : "¿Enviamos tu inventario?"}
        maxWidth={520}
        footer={
          <>
            <StudioButton onClick={closeConfirm} disabled={send.isPending}>Todavía no</StudioButton>
            <StudioButton variant="green" onClick={doSend} disabled={send.isPending} style={{ flex: "1 1 160px" }}>
              {send.isPending ? "Enviando…" : "Sí, enviar"}
            </StudioButton>
          </>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
            Vas a enviarle a la feria <b style={{ fontWeight: 500 }}>{plural(rows.length, "obra", "obras")}</b>
            {savedTitle ? <> del proyecto <b style={{ fontWeight: 500 }}>{savedTitle}</b></> : null}.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              "Mientras la carga siga abierta puedes agregar más obras y volver a enviar.",
              "La feria recibe el aviso y revisa tu inventario.",
              "Te quedan tus códigos QR para imprimir y poner en el stand.",
            ].map((t) => (
              <span key={t} style={{ display: "flex", gap: 10, fontSize: 15, lineHeight: 1.45, color: "var(--fg2)" }}>
                <Ico name="check" sw={1.8} style={{ color: "var(--green)", marginTop: 2 }} />
                {t}
              </span>
            ))}
          </div>
          <p className="fdm-st-note" style={{ fontSize: 14 }}>Si falta una obra, cierra esto y cárgala primero.</p>
        </div>
      </StudioSheet>

      <ArtworkDetailModal
        id={detailId}
        data={detailData}
        open={!!detailId}
        loading={loadingDetail}
        locked={!inventory.canUpload}
        onClose={closeDetail}
        onEdit={openEdit}
        onOpenQr={openQr}
      />

      <QRModal artworkId={qrForId} open={!!qrForId} onClose={closeQr} />
    </Shell>
  );
}
