"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import { ApplicationCard } from "@components/views/convocatoria/ApplicationCard";
import { Plus, Palette, Loader2, AlertCircle } from "lucide-react";

export default function MiSolicitudPage() {
  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

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
          <div className="flex flex-col items-center justify-center text-center p-16 md:p-24 bg-zinc-900/40 border border-white/5 rounded-3xl backdrop-blur-xl">
            <Palette className="w-20 h-20 text-zinc-700 mb-6 animate-bounce" style={{ animationDuration: '3s' }} />
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Tu lienzo está en blanco</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8 text-lg">
              Inicia tu proceso de postulación y muestra tu talento a cientos de coleccionistas.
            </p>
            <Link 
              href="/convocatoria" 
              className="inline-flex items-center justify-center bg-white text-black px-8 py-3.5 rounded-xl font-bold transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)]"
            >
              Ver parámetros de la convocatoria
            </Link>
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
