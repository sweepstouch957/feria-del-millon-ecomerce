"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import { ApplicationCard } from "@components/views/convocatoria/ApplicationCard";
import { Plus, Loader2, AlertCircle, CreditCard, Hourglass } from "lucide-react";

export default function MiSolicitudPage() {
  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // If 401, redirect to login
  useEffect(() => {
    if (error && (error as any)?.response?.status === 401) {
      window.location.href = `/login?redirect=${encodeURIComponent("/convocatoria/mi-solicitud")}`;
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-zinc-400">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
        <p className="font-medium">Cargando tu solicitud…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white relative overflow-hidden pt-12 pb-24">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-green-600/10 blur-[100px] rounded-full pointer-events-none" />

      <main className="max-w-4xl mx-auto px-6 relative z-10 font-sans">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              Mi Postulación
            </h1>
            <p className="text-zinc-400 text-base md:text-lg">
              Centro de control para tus obras de la <span className="font-semibold text-white">Feria del Millón 2026</span>
            </p>
          </div>
          <Link 
            href="/convocatoria/aplicar" 
            className="flex items-center gap-2 bg-gradient-to-br from-green-500 to-green-600 text-black px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:text-white border border-white/20"
          >
            <div className="bg-black/20 rounded-full p-1">
              <Plus className="w-4 h-4" />
            </div>
            Nueva postulación
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{(error as any)?.message || "Error al cargar las postulaciones. Intenta nuevamente."}</p>
          </div>
        )}

        {apps.length === 0 && !error && (
          <div className="ac-root">
            {/* ── Status banner ── */}
            <div className="ac-banner" style={{ "--sc": "#fbbf24" } as React.CSSProperties}>
              <div className="ac-banner__ico"><CreditCard size={26} /></div>
              <div>
                <div className="ac-banner__label">Pago pendiente</div>
                <div className="ac-banner__desc">Inicia tu proceso de postulación completando el pago de inscripción para continuar.</div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="ac-body">
              <h3 className="ac-title">Feria del Millón 2026</h3>

              {/* Stat cards */}
              <div className="ac-stats">
                <div className="ac-stat">
                  <span className="ac-stat__label">Pago</span>
                  <span className="ac-stat__val ac-stat__val--warn">
                    <Hourglass size={14} style={{ verticalAlign: "-2px" }} /> Pendiente
                  </span>
                </div>
                <div className="ac-stat">
                  <span className="ac-stat__label">Enviada</span>
                  <span className="ac-stat__val">—</span>
                </div>
                <div className="ac-stat">
                  <span className="ac-stat__label">Obras</span>
                  <span className="ac-stat__val">
                    0<span className="ac-stat__dim"> / 15</span>
                  </span>
                </div>
                <div className="ac-stat">
                  <span className="ac-stat__label">Cierre</span>
                  <span className="ac-stat__val">31 de octubre de 2026</span>
                </div>
              </div>

              {/* ── Progress bar ── */}
              <div className="ac-progress">
                <div className="ac-progress__track">
                  <div
                    className="ac-progress__fill"
                    style={{ width: "25%" }}
                  />
                </div>
                <div className="ac-steps">
                  <div className="ac-step ac-step--done">
                    <div className="ac-step__dot">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="ac-step__label">Crear cuenta</span>
                  </div>
                  <div className="ac-step ac-step--active">
                    <div className="ac-step__dot">2</div>
                    <span className="ac-step__label">Pagar inscripción</span>
                  </div>
                  <div className="ac-step">
                    <div className="ac-step__dot">3</div>
                    <span className="ac-step__label">Subir obras</span>
                  </div>
                  <div className="ac-step">
                    <div className="ac-step__dot">4</div>
                    <span className="ac-step__label">En revisión</span>
                  </div>
                  <div className="ac-step">
                    <div className="ac-step__dot">5</div>
                    <span className="ac-step__label">Resolución</span>
                  </div>
                </div>
              </div>

              {/* ── CTAs ── */}
              <div className="ac-actions">
                <Link href="/convocatoria/aplicar" className="ac-btn ac-btn--green">
                  <CreditCard size={16} /> Iniciar postulación y pagar
                </Link>
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

              /* Actions */
              .ac-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 8px; }
              .ac-btn {
                display: inline-flex; align-items: center; gap: 8px;
                padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700;
                text-decoration: none; transition: all .2s;
                font-family: inherit;
              }
              .ac-btn--green { background: var(--g); color: #000; box-shadow: 0 4px 16px rgba(34,197,94,.2); }
              .ac-btn--green:hover { background: #4ade80; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,197,94,.35); }
            `}</style>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {apps.map((app) => (
            <ApplicationCard key={app._id} app={app as ArtistApplication} />
          ))}
        </div>
      </main>
    </div>
  );
}
