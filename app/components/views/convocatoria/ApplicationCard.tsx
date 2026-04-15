"use client";
import Link from "next/link";
import { STATUS_MAP } from "./ApplicationStatus";
import { type ArtistApplication } from "@services/applications.service";
import { CheckCircle2, Clock, Hourglass, CreditCard, Edit3, Image as ImageIcon, Info, AlertTriangle, Check } from "lucide-react";

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
    <div className="bg-black/40 backdrop-blur-xl rounded-[24px] border border-white/10 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_40px_rgba(34,197,94,0.05)]">
      {/* Status banner */}
      <div 
        className="flex items-center gap-4 px-8 py-6 border-b border-white/5 relative overflow-hidden"
        style={{ backgroundColor: `${s.color}15`, borderColor: `${s.color}30` }}
      >
        <span className="text-3xl relative z-10 drop-shadow-md">{s.icon}</span>
        <div className="relative z-10">
          <div className="text-lg font-extrabold tracking-tight uppercase mb-1" style={{ color: s.color }}>
            {s.label}
          </div>
          <div className="text-sm font-medium text-white/90">
            {s.desc}
          </div>
        </div>
      </div>

      {/* Main info */}
      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-white mb-6 tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
            {conv?.name || "Convocatoria"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                Estado del pago
              </span>
              <span className={`text-base font-bold flex items-center gap-1.5 ${app.isPaid ? "text-green-400 shadow-green-400/20" : "text-amber-400 shadow-amber-400/20"}`} style={{ textShadow: app.isPaid ? "0 0 10px rgba(74,222,128,0.3)" : "0 0 10px rgba(251,191,36,0.3)" }}>
                {app.isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {app.isPaid ? "Confirmado" : "Pendiente"}
              </span>
            </div>
            
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Postulación enviada
              </span>
              <span className="text-base font-bold text-white">
                {app.submittedAt 
                  ? new Date(app.submittedAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) 
                  : "—"}
              </span>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Obras cargadas
              </span>
              <span className="text-base font-bold text-white">
                {app.artworkImages?.length || 0} <span className="text-zinc-500">/ 15</span>
              </span>
            </div>

            {conv && (
              <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Cierre de convocatoria
                </span>
                <span className="text-base font-bold text-white">
                  {conv.endDate 
                    ? new Date(conv.endDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) 
                    : "—"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress timeline */}
        <div className="relative flex items-center justify-between py-8 mb-8 before:content-[''] before:absolute before:left-0 before:right-0 before:h-[2px] before:bg-white/5 before:top-1/2 before:-translate-y-1/2 before:z-0">
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
              <div key={i} className={`relative z-10 flex flex-col items-center justify-center w-[60px] gap-3`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold transition-all duration-500
                  ${isDone && !isActive 
                    ? "bg-green-500 text-black border-green-400 shadow-[0_0_0_4px_rgba(0,0,0,0.8),0_0_20px_rgba(34,197,94,0.4)]" 
                    : isActive 
                      ? "bg-white text-black border-white shadow-[0_0_0_4px_rgba(0,0,0,0.8),0_0_20px_rgba(255,255,255,0.4)] scale-110" 
                      : "bg-[#0a0a0a] text-zinc-600 border border-white/10 shadow-[0_0_0_4px_rgba(0,0,0,0.8)]"}
                `}>
                  {isDone && !isActive ? <Check className="w-4 h-4 stroke-[3]" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold text-center absolute top-12 whitespace-nowrap w-[100px]
                  ${isActive ? "text-white drop-shadow-md" : isDone ? "text-zinc-400" : "text-zinc-600"}
                `}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Admin notes / rejection reason */}
        {app.adminNotes && (
          <div className="flex items-start gap-3 bg-sky-500/5 border border-sky-500/20 text-sky-300 p-5 rounded-2xl mb-6 text-sm leading-relaxed">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[15px] mb-1 font-bold">Nota del curador:</strong>
              {app.adminNotes}
            </div>
          </div>
        )}
        {app.rejectionReason && (
          <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 text-red-300 p-5 rounded-2xl mb-6 text-sm leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[15px] mb-1 font-bold">Observaciones:</strong>
              {app.rejectionReason}
            </div>
          </div>
        )}

        {/* Artwork thumbnails */}
        {app.artworkImages && app.artworkImages.length > 0 && (
          <div className="mb-8 pt-4">
            <h4 className="text-base font-extrabold text-white mb-4 tracking-tight">Obras cargadas ({app.artworkImages.length})</h4>
            <div className="flex gap-3.5 flex-wrap">
              {app.artworkImages.slice(0, 6).map((img, i) => (
                <div key={i} className="w-[90px] shrink-0 cursor-pointer group">
                  <div className="w-[90px] h-[90px] rounded-[14px] overflow-hidden border border-white/10 shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                    {img.url ? (
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-400 block mt-2 text-center truncate px-1">
                    {img.title || `Obra ${i + 1}`}
                  </span>
                </div>
              ))}
              {app.artworkImages.length > 6 && (
                <div className="w-[90px] shrink-0">
                  <div className="w-[90px] h-[90px] bg-white/5 backdrop-blur-sm rounded-[14px] flex items-center justify-center text-white font-black text-lg border border-white/10">
                    +{app.artworkImages.length - 6}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {app.status === "pending_payment" && (
            <Link 
              href={`/convocatoria/pagar?appId=${app._id}`} 
              className="inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-xl text-[15px] font-extrabold transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]"
            >
              <CreditCard className="w-5 h-5" />
              Completar pago
            </Link>
          )}
          {app.status === "draft" && (
            <Link 
              href={`/convocatoria/aplicar?appId=${app._id}`} 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-black px-7 py-3.5 rounded-xl text-[15px] font-extrabold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(34,197,94,0.3)]"
            >
              <Edit3 className="w-5 h-5" />
              Completar formulario
            </Link>
          )}
          {["submitted", "under_review"].includes(app.status) && (
            <span className="inline-flex items-center gap-2 bg-white/5 text-zinc-300 border border-white/10 px-6 py-3 rounded-full text-sm font-semibold backdrop-blur-md">
              <Hourglass className="w-4 h-4 animate-pulse" />
              Esperando resolución del curador
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
