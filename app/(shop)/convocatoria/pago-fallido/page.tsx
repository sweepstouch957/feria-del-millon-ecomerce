"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PagoFallidoPage() {
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId");
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
      <main className="result-page w-full">
        <div className="result-card result-card--error mx-auto">
        <div className="result-icon">😔</div>
        <h1>Pago no completado</h1>
        <p>El pago no pudo procesarse. Puedes intentarlo nuevamente o contactarnos si el problema persiste.</p>
        <Link href={`/convocatoria/pagar${appId ? `?appId=${appId}` : ""}`} className="result-btn result-btn--primary">
          Intentar de nuevo
        </Link>
        <Link href="/convocatoria/mi-solicitud" className="result-btn result-btn--ghost">Ver mi solicitud</Link>
      </div>
      <style jsx>{`
        .result-page { display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', sans-serif;}
        .result-card { background: #0a0a0a; border: 1px solid #222; border-radius: 24px; padding: 56px 48px; max-width: 460px; width: 100%; text-align: center; box-shadow: 0 8px 40px rgba(255,255,255,0.02); }
        .result-card--error { border-top: 6px solid #ef4444; }
        .result-icon { font-size: 64px; margin-bottom: 16px; filter: grayscale(100%); opacity: 0.8;}
        .result-card h1 { font-size: 28px; font-weight: 900; color: #fff; margin: 0 0 12px; }
        .result-card p { color: #888; font-size: 15px; line-height: 1.6; margin: 0 0 32px; }
        .result-btn { display: block; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 10px; transition: all 0.2s;}
        .result-btn--primary { background: #fff; color: #000; }
        .result-btn--primary:hover { background: #eee; }
        .result-btn--ghost { background: #111; color: #ccc; border: 1px solid #333; }
        .result-btn--ghost:hover { background: #222; color: #fff; }
      `}</style>
      </main>
    </div>
  );
}
