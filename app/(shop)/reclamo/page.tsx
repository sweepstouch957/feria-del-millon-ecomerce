"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ClaimClient from "@components/views/claim/ClaimClient";

export default function ClaimPage() {
  return (
    <Suspense>
      <WithParams />
    </Suspense>
  );
}

function WithParams() {
  const sp = useSearchParams();
  return <ClaimClient artwork={sp.get("obra") || ""} />;
}
