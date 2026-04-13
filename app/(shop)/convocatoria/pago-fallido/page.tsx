import { Suspense } from "react";
import PagoFallidoClient from "@components/views/convocatoria/PagoFallidoClient";

export default function PagoFallidoPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
          <p style={{ color: "#888" }}>Cargando…</p>
        </div>
      }
    >
      <PagoFallidoClient />
    </Suspense>
  );
}
