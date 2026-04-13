import { Suspense } from "react";
import PagoExitosoClient from "@components/views/convocatoria/PagoExitosoClient";

export default function PagoExitosoPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
          <p style={{ color: "#888" }}>Cargando…</p>
        </div>
      }
    >
      <PagoExitosoClient />
    </Suspense>
  );
}
