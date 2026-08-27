import { Suspense } from "react";
import RegisterPageClient from "@components/views/auth/RegisterPageClient";

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageClient />
    </Suspense>
  );
}
