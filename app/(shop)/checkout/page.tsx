import CheckoutPageClient from "@components/views/checkout/CheckoutPageClient";
import { Suspense } from "react";

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="p-8">Cargando checkout…</div>}>
            <CheckoutPageClient />
        </Suspense>
    )

}