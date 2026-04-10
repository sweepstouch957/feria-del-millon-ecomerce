"use client";
import Link from "next/link";
import { STATUS_MAP } from "./ApplicationStatus";
import { type ArtistApplication } from "@services/applications.service";

interface ApplicationCardProps {
  app: ArtistApplication;
}

export function ApplicationCard({ app }: ApplicationCardProps) {
  const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;
  const s = STATUS_MAP[app.status] || { 
    label: app.status, 
    color: "#374151", 
    bg: "#f3f4f6", 
    icon: "❓", 
    desc: "" 
  };

  return (
    <div className="ms-card">
      {/* Status banner */}
      <div className="ms-card__banner" style={{ background: s.bg, borderColor: `${s.color}33` }}>
        <span className="ms-card__banner-icon">{s.icon}</span>
        <div>
          <div className="ms-card__banner-title" style={{ color: s.color }}>{s.label}</div>
          <div className="ms-card__banner-desc">{s.desc}</div>
        </div>
      </div>

      {/* Main info */}
      <div className="ms-card__body">
        <div className="ms-card__section">
          <h3 className="ms-card__conv-name">{conv?.name || "Convocatoria"}</h3>
          <div className="ms-card__meta-row">
            <div className="ms-card__meta">
              <span className="ms-card__meta-label">Estado del pago</span>
              <span className={`ms-card__meta-val ${app.isPaid ? "green" : "orange"}`}>
                {app.isPaid ? "✅ Confirmado" : "⏳ Pendiente"}
              </span>
            </div>
            <div className="ms-card__meta">
              <span className="ms-card__meta-label">Postulación enviada</span>
              <span className="ms-card__meta-val">
                {app.submittedAt 
                  ? new Date(app.submittedAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) 
                  : "—"}
              </span>
            </div>
            <div className="ms-card__meta">
              <span className="ms-card__meta-label">Obras cargadas</span>
              <span className="ms-card__meta-val">{app.artworkImages?.length || 0} / 15</span>
            </div>
            {conv && (
              <div className="ms-card__meta">
                <span className="ms-card__meta-label">Cierre de convocatoria</span>
                <span className="ms-card__meta-val">
                  {conv.endDate 
                    ? new Date(conv.endDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) 
                    : "—"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress timeline */}
        <div className="ms-timeline">
          {[
            { key: "pending_payment", label: "Crear cuenta" },
            { key: "draft", label: "Pagar inscripción" },
            { key: "submitted", label: "Subir obras" },
            { key: "under_review", label: "En revisión" },
            { key: ["accepted", "rejected"], label: "Resolución" },
          ].map((item, i) => {
            const keys = Array.isArray(item.key) ? item.key : [item.key];
            const statuses = ["pending_payment", "draft", "submitted", "under_review", "accepted", "rejected"];
            const currentIdx = statuses.indexOf(app.status);
            const firstItemKey = keys[0];
            const itemIdx = statuses.indexOf(firstItemKey);
            
            const isDone = currentIdx > itemIdx || keys.includes(app.status);
            const isActive = keys.includes(app.status);
            
            return (
              <div key={i} className={`ms-tl-item ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                <div className="ms-tl-dot">{isDone && !isActive ? "✓" : i + 1}</div>
                <span className="ms-tl-label">{item.label}</span>
                {i < 4 && <div className={`ms-tl-line ${isDone ? "done" : ""}`} />}
              </div>
            );
          })}
        </div>

        {/* Admin notes / rejection reason */}
        {app.adminNotes && (
          <div className="ms-notes ms-notes--info">
            <strong>Nota del curador:</strong> {app.adminNotes}
          </div>
        )}
        {app.rejectionReason && (
          <div className="ms-notes ms-notes--warn">
            <strong>Observaciones:</strong> {app.rejectionReason}
          </div>
        )}

        {/* Artwork thumbnails */}
        {app.artworkImages && app.artworkImages.length > 0 && (
          <div className="ms-thumbs">
            <h4 className="ms-thumbs__title">Obras cargadas ({app.artworkImages.length})</h4>
            <div className="ms-thumbs__grid">
              {app.artworkImages.slice(0, 6).map((img, i) => (
                <div key={i} className="ms-thumb">
                  {img.url ? (
                    <img src={img.url} alt={img.title} className="ms-thumb__img" />
                  ) : (
                    <div className="ms-thumb__placeholder">🖼️</div>
                  )}
                  <span className="ms-thumb__title">{img.title || `Obra ${i + 1}`}</span>
                </div>
              ))}
              {app.artworkImages.length > 6 && (
                <div className="ms-thumb ms-thumb--more">+{app.artworkImages.length - 6}</div>
              )}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="ms-card__actions">
          {app.status === "pending_payment" && (
            <Link href={`/convocatoria/pagar?appId=${app._id}`} className="ms-btn-primary">
              💳 Completar pago
            </Link>
          )}
          {app.status === "draft" && (
            <Link href={`/convocatoria/aplicar?appId=${app._id}`} className="ms-btn-primary">
              ✏️ Completar formulario
            </Link>
          )}
          {["submitted", "under_review"].includes(app.status) && (
            <span className="ms-badge-waiting">⏳ Esperando resolución del curador</span>
          )}
        </div>
      </div>
    </div>
  );
}
