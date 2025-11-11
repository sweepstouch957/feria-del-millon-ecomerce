"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@components/ui/button";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import useCart from "@store/useCart";
import { useMemo } from "react";

type ImgLike = string | string[] | undefined | null;

type CartViewItem = {
  id: string;
  title: string;
  price: number;
  image?: ImgLike;
  quantity: number;
  // Campos opcionales si tu flujo los trae
  artist?: string;
  year?: number;
  medium?: string;
};

const getFirstImage = (img: ImgLike): string => {
  if (Array.isArray(img)) return img[0] ?? "/placeholder.png";
  if (typeof img === "string" && img.trim() !== "") return img;
  return "/placeholder.png";
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

export default function CartPage() {
  // 🛒 Zustand selectors
  const items = useCart((s) => s.items) as CartViewItem[];
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);

  // Derivados
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0),
    [items]
  );
  const shipping = subtotal > 5_000_000 ? 0 : 150_000; // Envío gratis > 5M
  const total = subtotal + shipping;

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-600 mb-8">
            Explora nuestro catálogo y descubre obras increíbles
          </p>
          <Link href="/catalogo">
            <Button size="lg">Explorar Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/catalogo"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar Comprando
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Carrito de Compras
          </h1>
          <p className="text-gray-600">
            {items.length} {items.length === 1 ? "obra" : "obras"} en tu carrito
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagen */}
                  <div className="flex-shrink-0 w-full md:w-32">
                    <Image
                      src={getFirstImage(item.image)}
                      alt={item.title}
                      width={256}
                      height={256}
                      className="w-full h-32 object-contain rounded-lg"
                    />
                  </div>

                  {/* Información */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        {(item.artist || item.year) && (
                          <p className="text-gray-600">
                            {item.artist ?? ""}{" "}
                            {item.artist && item.year ? "• " : ""}
                            {item.year ?? ""}
                          </p>
                        )}
                        {item.medium && (
                          <p className="text-sm text-gray-500">{item.medium}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(item.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Cantidad */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Cantidad:</span>
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateQty(item.id, Math.max(1, item.quantity - 1))
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateQty(item.id, item.quantity + 1)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Precio */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice((item.price ?? 0) * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.price ?? 0)} c/u
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Resumen del Pedido</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Gratis" : formatPrice(shipping)}
                  </span>
                </div>

                {shipping === 0 && (
                  <p className="text-sm text-green-600">
                    ¡Envío gratis por compra mayor a {formatPrice(5_000_000)}!
                  </p>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Link href="/checkout" className="block">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                    variant="secondary"
                  >
                    Proceder al Pago
                  </Button>
                </Link>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Pago seguro con Mercado Pago
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Información de Compra</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Garantía de autenticidad</li>
                  <li>• Envío asegurado</li>
                  <li>• Certificado de autenticidad incluido</li>
                  <li>• Soporte post-venta</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
