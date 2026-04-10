"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import { STATUS_MAP } from "@components/views/convocatoria/ApplicationStatus";
import { ApplicationCard } from "@components/views/convocatoria/ApplicationCard";



export default function MiSolicitudPage() {
  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  if (isLoading) return (
    <div className="ms-loading">
      <div className="ms-spinner" />
      <p>Cargando tu solicitud…</p>
    </div>
  );

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white pt-6 pb-20">
      <main className="ms-page">
        <div className="ms-header">
        <div>
          <h1 className="ms-header__title">Mi postulación</h1>
          <p className="ms-header__sub">Seguimiento de tu postulación a la Feria del Millón 2026</p>
        </div>
        <Link href="/convocatoria/aplicar" className="ms-btn-new">+ Nueva postulación</Link>
      </div>

      {error && <div className="ms-error">⚠️ {(error as any)?.message || "Error al cargar"}</div>}

      {apps.length === 0 && !error && (
        <div className="ms-empty">
          <div className="ms-empty__icon">🎨</div>
          <h2>Aún no tienes postulaciones</h2>
          <p>Crea tu primera postulación a la Feria del Millón 2026.</p>
          <Link href="/convocatoria" className="ms-btn-primary">Ver convocatorias</Link>
        </div>
      )}

      <div className="ms-cards">
        {apps.map((app) => (
          <ApplicationCard key={app._id} app={app as ArtistApplication} />
        ))}
      </div>

      <style jsx>{`
        .ms-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #888; }
        .ms-spinner { width: 44px; height: 44px; border: 4px solid #222; border-top-color: #22c55e; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ms-page { max-width: 860px; margin: auto; padding: 48px 20px 80px; font-family: 'Inter', sans-serif;}

        .ms-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 40px; }
        .ms-header__title { font-size: 32px; font-weight: 900; color: #fff; margin: 0 0 4px; letter-spacing: -1px; }
        .ms-header__sub { color: #888; font-size: 15px; margin: 0; }
        .ms-btn-new { background: #fff; color: #000; padding: 10px 22px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; white-space: nowrap; transition: all 0.2s; border: 1px solid transparent; }
        .ms-btn-new:hover { background: #eee; transform: translateY(-1px); }

        .ms-error { background: rgba(220,38,38,0.1); border: 1px solid #ef4444; color: #ef4444; padding: 14px; border-radius: 12px; margin-bottom: 24px; }

        .ms-empty { text-align: center; padding: 80px 24px; }
        .ms-empty__icon { font-size: 64px; margin-bottom: 16px; filter: grayscale(100%); opacity: 0.8;}
        .ms-empty h2 { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 8px; }
        .ms-empty p { color: #888; margin: 0 0 24px; }

        .ms-btn-primary { background: #fff; color: #000; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block; transition: all 0.2s;}
        .ms-btn-primary:hover { background: #eee; transform: translateY(-1px); }

        .ms-cards { display: flex; flex-direction: column; gap: 28px; }

        .ms-card { background: #0a0a0a; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(255,255,255,0.02); border: 1px solid #222; }
        .ms-card__banner { display: flex; align-items: flex-start; gap: 14px; padding: 20px 24px; border-bottom: 1px solid; }
        .ms-card__banner-icon { font-size: 32px; flex-shrink: 0; }
        .ms-card__banner-title { font-size: 16px; font-weight: 800; margin-bottom: 2px; }
        .ms-card__banner-desc { font-size: 13px; opacity: 0.8; }

        .ms-card__body { padding: 28px 24px; color: #fff; }
        .ms-card__section { margin-bottom: 24px; }
        .ms-card__conv-name { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 16px; letter-spacing: -0.5px;}

        .ms-card__meta-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 12px; }
        .ms-card__meta { background: #111; border-radius: 10px; padding: 12px 14px; border: 1px solid #333;}
        .ms-card__meta-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #888; margin-bottom: 4px; }
        .ms-card__meta-val { font-size: 14px; font-weight: 700; color: #fff; }
        .ms-card__meta-val.green { color: #4ade80; }
        .ms-card__meta-val.orange { color: #fbbf24; }

        /* Timeline */
        .ms-timeline { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 20px 0; border-top: 1px solid #222; border-bottom: 1px solid #222; margin-bottom: 20px; }
        .ms-tl-item { display: flex; align-items: center; }
        .ms-tl-dot { width: 26px; height: 26px; border-radius: 50%; background: #111; border: 1px solid #333; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #555; flex-shrink: 0; }
        .ms-tl-item.done .ms-tl-dot { background: #222; border-color: #555; color: #fff; }
        .ms-tl-item.active .ms-tl-dot { background: #fff; border-color: #fff; color: #000; }
        .ms-tl-label { font-size: 11px; color: #666; margin: 0 4px; white-space: nowrap; }
        .ms-tl-item.done .ms-tl-label { color: #ccc; }
        .ms-tl-item.active .ms-tl-label { color: #fff; font-weight: 700; }
        .ms-tl-line { width: 24px; height: 1px; background: #333; }
        .ms-tl-line.done { background: #666; }

        .ms-notes { padding: 14px; border-radius: 12px; font-size: 13px; margin-bottom: 16px; line-height: 1.6; }
        .ms-notes--info { background: rgba(56,189,248,0.1); border: 1px solid #0284c7; color: #38bdf8; }
        .ms-notes--warn { background: rgba(239,68,68,0.1); border: 1px solid #dc2626; color: #f87171; }

        /* Thumbnails */
        .ms-thumbs { margin-bottom: 20px; }
        .ms-thumbs__title { font-size: 14px; font-weight: 700; color: #ccc; margin: 0 0 12px; }
        .ms-thumbs__grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .ms-thumb { width: 80px; flex-shrink: 0; }
        .ms-thumb__img { width: 80px; height: 80px; object-fit: cover; border-radius: 10px; display: block; border: 1px solid #333; }
        .ms-thumb__placeholder { width: 80px; height: 80px; background: #111; border: 1px solid #333; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .ms-thumb__title { font-size: 11px; color: #888; display: block; margin-top: 4px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 80px; }
        .ms-thumb--more { width: 80px; height: 80px; background: #222; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; border: 1px solid #444;}

        .ms-card__actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .ms-badge-waiting { background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid #444; padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; }
      `}</style>
      </main>
    </div>
  );
}
