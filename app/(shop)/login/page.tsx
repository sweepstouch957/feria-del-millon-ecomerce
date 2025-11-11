// app/(shop)/login/page.tsx
import GenericLoginPageClient from "@components/views/auth/GenericLoginPageClient";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando login…</div>}>
      <GenericLoginPageClient />
    </Suspense>
  );
}
