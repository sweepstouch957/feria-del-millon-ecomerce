import { Suspense } from "react";
import AplicarPageClient from "@components/views/convocatoria/aplicar/AplicarPageClient";

export default function ConvocatoriaAplicarPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center"
        >
          <p style={{ color: "#888" }}>Cargando postulación…</p>
        </div>
      }
    >
      <AplicarPageClient />
    </Suspense>
  );
}
