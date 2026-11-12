// app/(shop)/login/page.tsx
import GenericLoginPageClient from "@components/views/auth/GenericLoginPageClient";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <GenericLoginPageClient />
    </Suspense>
  );
}
