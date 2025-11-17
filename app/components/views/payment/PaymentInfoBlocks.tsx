// components/Payment/PaymentInfoBlocks.tsx

'use client';

import React from 'react';

export function PseInfo() {
  return (
    <div className="flex flex-col justify-center text-sm text-gray-600 space-y-2">
      <p>
        Serás redirigido al botón{' '}
        <span className="font-semibold">PSE Itaú</span> para completar tu pago
        de forma segura desde tu banco colombiano.
      </p>
      <p>
        Una vez aprobado el pago, volverás a la Feria del Millón para ver la
        confirmación de tu compra.
      </p>
    </div>
  );
}

export function MercadoPagoInfo() {
  return (
    <div className="flex flex-col justify-center text-sm text-gray-600 space-y-2">
      <p>
        Serás redirigido a{' '}
        <span className="font-semibold">Mercado Pago</span> para finalizar tu
        compra.
      </p>
      <p>
        Podrás pagar con tarjeta, saldo en Mercado Pago o efectivo en puntos
        autorizados, según las opciones disponibles.
      </p>
    </div>
  );
}

export function TrustBadges() {
  return (
    <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        🔒 Cifrado TLS 1.2+
      </div>
      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        🛡️ Prevención de fraude
      </div>
      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        ✅ Garantía de autenticidad
      </div>
    </div>
  );
}
