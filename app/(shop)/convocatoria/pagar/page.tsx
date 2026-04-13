import { Suspense } from "react";
import PagarClient from "@components/views/convocatoria/PagarClient";

export default function ConvocatoriaPagarPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
          <p style={{ color: "#888" }}>Cargando pago…</p>
        </div>
      }
    >
      <PagarClient />
    </Suspense>
  );
}
