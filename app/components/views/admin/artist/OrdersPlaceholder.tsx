"use client";

export default function OrdersPlaceholder() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-600">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">Órdenes</h2>
        <p className="mb-2">
          Aquí aparecerán las órdenes asociadas a tus obras. Próximamente podrás
          ver estados, compradores y descargar comprobantes.
        </p>
        <p className="text-sm text-gray-500">
          (Placeholder – sin datos por ahora)
        </p>
      </div>
    </div>
  );
}
