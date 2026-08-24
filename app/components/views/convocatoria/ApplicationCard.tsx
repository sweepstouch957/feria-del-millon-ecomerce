"use client";
import Link from "next/link";
import { type ArtistApplication } from "@services/applications.service";
import { CreditCard, Pencil, Mail, Search, PartyPopper, ClipboardList, HelpCircle, CheckCircle2, Hourglass, MessageCircle, FileText, Palette, Camera, type LucideIcon } from "lucide-react";

/* ── Status config ─────────────────────────────────────────────── */
const S: Record<string, { label: string; color: string; icon: LucideIcon; desc: string }> = {
  pending_payment: { label: "Pago pendiente",      color: "#fbbf24", icon: CreditCard, desc: "Completa el pago de inscripción para continuar."   },
  draft:           { label: "En progreso",          color: "#60a5fa", icon: Pencil, desc: "Completa tu perfil y sube tus obras."              },
  submitted:       { label: "Enviada",              color: "#22c55e", icon: Mail, desc: "Tu postulación fue enviada. Está en espera de revisión." },
  under_review:    { label: "En revisión",          color: "#a78bfa", icon: Search, desc: "Un curador está evaluando tu postulación."         },
  accepted:        { label: "¡Aceptada!",           color: "#22c55e", icon: PartyPopper, desc: "¡Felicitaciones! Tu proyecto fue seleccionado."    },
  rejected:        { label: "No seleccionada",      color: "#ef4444", icon: ClipboardList, desc: "Tu proyecto no fue seleccionado en esta edición."  },
};

/* ── Steps ── */
const STEPS = [
  { key: "account",  label: "Crear cuenta" },
  { key: "payment",  label: "Pagar inscripción" },
  { key: "artwork",  label: "Subir obras" },
  { key: "review",   label: "En revisión" },
  { key: "result",   label: "Resolución" },
];

function getCompletedStepIndex(app: ArtistApplication): number {
  // Returns the index of the last COMPLETED step (0-based)
  if (["accepted", "rejected"].includes(app.status)) return 4;
  if (app.status === "under_review") return 3;
  if (app.status === "submitted") return 3;
  if (app.status === "draft" && app.isPaid) return 2;
  if (app.isPaid) return 1;
  return 0;
}

function getActiveStepIndex(app: ArtistApplication): number {
  // The step user is currently ON
  if (["accepted", "rejected"].includes(app.status)) return 4;
  if (app.status === "under_review") return 3;
  if (app.status === "submitted") return 3;
  if (app.status === "draft" && app.isPaid) return 2;
  if (app.isPaid) return 1;
  return 0;
}

export function ApplicationCard({ app }: { app: ArtistApplication }) {
  const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;
  const st = S[app.status] || { label: app.status, color: "#555", icon: HelpCircle, desc: "" };
  const completedIdx = getCompletedStepIndex(app);
  const activeIdx = getActiveStepIndex(app);
  const isFinished = ["accepted", "rejected"].includes(app.status);

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="ac-root">
      {/* ── Status banner ── */}
      <div className="ac-banner" style={{ "--sc": st.color } as React.CSSProperties}>
        <div className="ac-banner__ico"><st.icon size={28} color={st.color} /></div>
        <div>
          <div className="ac-banner__label">{st.label}</div>
          <div className="ac-banner__desc">{st.desc}</div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ac-body">
        <h3 className="ac-title">{conv?.name || "Convocatoria"}</h3>

        {/* Stat cards */}
        <div className="ac-stats">
          <div className="ac-stat">
            <span className="ac-stat__label">Pago</span>
            <span className={`ac-stat__val ${app.isPaid ? "ac-stat__val--ok" : "ac-stat__val--warn"}`}>
              {app.isPaid ? <><CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> Confirmado</> : <><Hourglass size={14} style={{ verticalAlign: "-2px" }} /> Pendiente</>}
            </span>
          </div>
          <div className="ac-stat">
            <span className="ac-stat__label">Enviada</span>
            <span className="ac-stat__val">{fmtDate(app.submittedAt)}</span>
          </div>
          <div className="ac-stat">
            <span className="ac-stat__label">Obras</span>
            <span className="ac-stat__val">
              {app.artworkImages?.length || 0}
              <span className="ac-stat__dim"> / 15</span>
            </span>
          </div>
          {conv && (
            <div className="ac-stat">
              <span className="ac-stat__label">Cierre</span>
              <span className="ac-stat__val">{fmtDate(conv.endDate)}</span>
            </div>
          )}
        </div>

        {/* ── Progress bar ── */}
        <div className="ac-progress">
          <div className="ac-progress__track">
            <div
              className="ac-progress__fill"
              style={{ width: `${Math.min(100, (completedIdx / (STEPS.length - 1)) * 100)}%` }}
            />
          </div>
          <div className="ac-steps">
            {STEPS.map((s, i) => {
              const done = i < completedIdx;
              const active = i === activeIdx;
              return (
                <div key={s.key} className={`ac-step ${done ? "ac-step--done" : ""} ${active ? "ac-step--active" : ""}`}>
                  <div className="ac-step__dot">
                    {done ? <CheckSvg /> : i + 1}
                  </div>
                  <span className="ac-step__label">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Admin notes ── */}
        {app.adminNotes && (
          <div className="ac-note ac-note--info">
            <div className="ac-note__head"><MessageCircle size={13} style={{ verticalAlign: "-2px" }} /> Nota del curador</div>
            <p className="ac-note__body">{app.adminNotes}</p>
          </div>
        )}
        {app.rejectionReason && (
          <div className="ac-note ac-note--error">
            <div className="ac-note__head"><FileText size={13} style={{ verticalAlign: "-2px" }} /> Observaciones</div>
            <p className="ac-note__body">{app.rejectionReason}</p>
          </div>
        )}

        {/* ── Artist profile preview ── */}
        {(app.profilePhotoUrl || app.bio) && (
          <div className="ac-profile">
            {app.profilePhotoUrl && (
              <img src={app.profilePhotoUrl} alt="Foto de perfil" className="ac-profile__photo" />
            )}
            <div className="ac-profile__info">
              {app.bio && <p className="ac-profile__bio">{app.bio.length > 120 ? app.bio.slice(0, 120) + "…" : app.bio}</p>}
              {app.projectReview && (
                <p className="ac-profile__project">
                  <span>Reseña:</span> {app.projectReview.length > 100 ? app.projectReview.slice(0, 100) + "…" : app.projectReview}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Artwork gallery ── */}
        {app.artworkImages && app.artworkImages.length > 0 && (
          <div className="ac-gallery">
            <div className="ac-gallery__head">
              <Palette size={14} /> Obras cargadas
              <span className="ac-gallery__count">{app.artworkImages.length}</span>
            </div>
            <div className="ac-gallery__grid">
              {app.artworkImages.slice(0, 8).map((img, i) => (
                <div key={i} className="ac-thumb">
                  {img.url ? (
                    <img src={img.url} alt={img.title || `Obra ${i + 1}`} />
                  ) : (
                    <div className="ac-thumb__empty"><Camera size={20} /></div>
                  )}
                  <span className="ac-thumb__title">{img.title || `Obra ${i + 1}`}</span>
                </div>
              ))}
              {app.artworkImages.length > 8 && (
                <div className="ac-thumb ac-thumb--more">
                  +{app.artworkImages.length - 8}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Extra images ── */}
        {(app.detailImageUrl || app.montageImageUrl) && (
          <div className="ac-extras">
            {app.detailImageUrl && (
              <div className="ac-extra">
                <img src={app.detailImageUrl} alt="Detalle" />
                <span>Detalle de obra</span>
              </div>
            )}
            {app.montageImageUrl && (
              <div className="ac-extra">
                <img src={app.montageImageUrl} alt="Montaje" />
                <span>Foto de montaje</span>
              </div>
            )}
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="ac-actions">
          {app.status === "pending_payment" && (
            <Link href={`/convocatoria/pagar?appId=${app._id}`} className="ac-btn ac-btn--primary">
              <CreditCard size={16} /> Completar pago
            </Link>
          )}
          {app.status === "draft" && (
            <Link href={`/convocatoria/aplicar?appId=${app._id}`} className="ac-btn ac-btn--green">
              <Pencil size={16} /> Completar formulario
            </Link>
          )}
          {["submitted", "under_review"].includes(app.status) && (
            <div className="ac-waiting">
              <div className="ac-waiting__dot" />
              Esperando resolución del curador
            </div>
          )}
          {isFinished && app.status === "accepted" && (
            <div className="ac-accepted"><PartyPopper size={16} style={{ verticalAlign: "-2px" }} /> ¡Prepárate para la feria!</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ac-root {
          --g: #22c55e; --g-dim: rgba(34,197,94,.08); --g-ring: rgba(34,197,94,.2);
          --s1: #0a0a0a; --s2: #111; --bd: rgba(255,255,255,.08); --bd2: rgba(255,255,255,.12);
          --tx: rgba(255,255,255,.93); --tx2: rgba(255,255,255,.55); --tx3: rgba(255,255,255,.28);
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--s1); border-radius: 20px;
          border: 1px solid var(--bd2); overflow: hidden;
          transition: all .25s ease;
        }
        .ac-root:hover { border-color: rgba(255,255,255,.18); box-shadow: 0 24px 60px rgba(0,0,0,.7); }

        /* Banner */
        .ac-banner {
          display: flex; align-items: center; gap: 14px;
          padding: 20px 28px; border-bottom: 1px solid var(--bd);
          background: color-mix(in srgb, var(--sc) 8%, transparent);
          position: relative;
        }
        .ac-banner::after {
          content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 120px;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--sc) 6%, transparent));
        }
        .ac-banner__ico { font-size: 28px; z-index: 1; }
        .ac-banner__label { font-size: 16px; font-weight: 800; color: var(--sc); text-transform: uppercase; letter-spacing: .3px; }
        .ac-banner__desc { font-size: 13px; color: var(--tx2); margin-top: 2px; }

        /* Body */
        .ac-body { padding: 28px; }
        .ac-title { font-size: 22px; font-weight: 900; color: var(--tx); margin: 0 0 20px; letter-spacing: -.5px; }

        /* Stats */
        .ac-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .ac-stat {
          background: #080808; border: 1px solid var(--bd); border-radius: 14px;
          padding: 14px 16px; display: flex; flex-direction: column; gap: 6px;
        }
        .ac-stat__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--tx3); }
        .ac-stat__val { font-size: 14px; font-weight: 700; color: var(--tx); }
        .ac-stat__val--ok { color: #4ade80; }
        .ac-stat__val--warn { color: #fbbf24; }
        .ac-stat__dim { color: var(--tx3); font-weight: 500; }

        /* Progress */
        .ac-progress { margin-bottom: 24px; }
        .ac-progress__track {
          height: 4px; background: var(--bd); border-radius: 4px;
          overflow: hidden; margin-bottom: 16px;
        }
        .ac-progress__fill {
          height: 100%; background: var(--g);
          border-radius: 4px;
          transition: width .6s ease;
          box-shadow: 0 0 12px rgba(34,197,94,.4);
        }
        .ac-steps { display: flex; justify-content: space-between; }
        .ac-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
        .ac-step__dot {
          width: 28px; height: 28px; border-radius: 50%;
          border: 1.5px solid var(--bd2); background: var(--s2);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: var(--tx3);
          transition: all .3s ease;
        }
        .ac-step--done .ac-step__dot { background: var(--g); border-color: var(--g); color: #000; }
        .ac-step--active .ac-step__dot {
          background: #fff; border-color: #fff; color: #000;
          box-shadow: 0 0 0 4px rgba(255,255,255,.15), 0 0 16px rgba(255,255,255,.2);
          transform: scale(1.1);
        }
        .ac-step__label { font-size: 10px; font-weight: 600; color: var(--tx3); text-align: center; max-width: 72px; line-height: 1.3; }
        .ac-step--done .ac-step__label { color: var(--tx2); }
        .ac-step--active .ac-step__label { color: var(--tx); font-weight: 700; }

        /* Notes */
        .ac-note { border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; }
        .ac-note--info { background: rgba(56,189,248,.05); border: 1px solid rgba(56,189,248,.15); }
        .ac-note--error { background: rgba(239,68,68,.05); border: 1px solid rgba(239,68,68,.15); }
        .ac-note__head { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .ac-note--info .ac-note__head { color: #38bdf8; }
        .ac-note--error .ac-note__head { color: #f87171; }
        .ac-note__body { font-size: 13px; color: var(--tx2); margin: 0; line-height: 1.6; }

        /* Profile preview */
        .ac-profile {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 16px 18px; background: #080808; border: 1px solid var(--bd);
          border-radius: 14px; margin-bottom: 16px;
        }
        .ac-profile__photo { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; border: 1px solid var(--bd2); flex-shrink: 0; }
        .ac-profile__info { flex: 1; min-width: 0; }
        .ac-profile__bio { font-size: 12.5px; color: var(--tx2); margin: 0 0 4px; line-height: 1.5; }
        .ac-profile__project { font-size: 11.5px; color: var(--tx3); margin: 0; line-height: 1.5; }
        .ac-profile__project span { color: var(--tx2); font-weight: 600; }

        /* Gallery */
        .ac-gallery { margin-bottom: 16px; }
        .ac-gallery__head {
          font-size: 13px; font-weight: 700; color: var(--tx2); margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .ac-gallery__count {
          font-size: 11px; font-weight: 700; color: var(--g);
          background: var(--g-dim); border: 1px solid var(--g-ring);
          padding: 2px 8px; border-radius: 100px;
        }
        .ac-gallery__grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .ac-thumb { width: 80px; }
        .ac-thumb img {
          width: 80px; height: 80px; object-fit: cover; border-radius: 12px;
          border: 1px solid var(--bd2); transition: all .2s;
        }
        .ac-thumb:hover img { transform: translateY(-2px) scale(1.05); border-color: rgba(255,255,255,.2); }
        .ac-thumb__empty {
          width: 80px; height: 80px; border-radius: 12px; border: 1px dashed var(--bd2);
          background: #080808; display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .ac-thumb__title { font-size: 10px; color: var(--tx3); text-align: center; margin-top: 4px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ac-thumb--more {
          width: 80px; height: 80px; border-radius: 12px;
          background: rgba(255,255,255,.04); border: 1px solid var(--bd);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: var(--tx3);
        }

        /* Extras */
        .ac-extras { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .ac-extra { display: flex; flex-direction: column; gap: 4px; }
        .ac-extra img {
          width: 120px; height: 80px; object-fit: cover; border-radius: 12px;
          border: 1px solid var(--bd2); transition: transform .2s;
        }
        .ac-extra:hover img { transform: scale(1.03); }
        .ac-extra span { font-size: 10px; color: var(--tx3); text-align: center; }

        /* Actions */
        .ac-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 8px; }
        .ac-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700;
          text-decoration: none; transition: all .2s;
          font-family: inherit;
        }
        .ac-btn--primary { background: #fff; color: #000; box-shadow: 0 4px 16px rgba(255,255,255,.1); }
        .ac-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,255,255,.15); }
        .ac-btn--green { background: var(--g); color: #000; box-shadow: 0 4px 16px rgba(34,197,94,.2); }
        .ac-btn--green:hover { background: #4ade80; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,197,94,.35); }

        .ac-waiting {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.04); border: 1px solid var(--bd);
          padding: 12px 20px; border-radius: 100px; font-size: 13px; font-weight: 600; color: var(--tx2);
        }
        .ac-waiting__dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--g);
          animation: ac-pulse 1.5s ease-in-out infinite;
        }
        @keyframes ac-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.7); } }

        .ac-accepted {
          background: var(--g-dim); border: 1px solid var(--g-ring);
          padding: 12px 20px; border-radius: 100px; font-size: 14px; font-weight: 700; color: var(--g);
        }
      `}</style>
    </div>
  );
}

function CheckSvg() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
