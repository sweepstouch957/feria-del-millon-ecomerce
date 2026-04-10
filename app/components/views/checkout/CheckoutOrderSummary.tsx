"use client";

import Image from "next/image";
import { Shield, Truck, CheckCircle } from "lucide-react";

type ImgLike = string | string[] | undefined | null;

export type CartViewItem = {
  id: string;
  title: string;
  price: number;
  image?: ImgLike;
  quantity: number;
  artist?: string;
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

type Props = {
  items: CartViewItem[];
  subtotal: number;
  total: number;
};

export function CheckoutOrderSummary({
  items,
  subtotal,
  total,
}: Props) {
  
  return (
    <aside className="lg:col-span-1">
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-gray-100 p-6 sticky top-24">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 text-blue-700 text-xs px-3 py-1">
            Pago seguro
          </span>
          <span className="rounded-full bg-indigo-50 text-indigo-700 text-xs px-3 py-1">
            Envío asegurado
          </span>
          <span className="rounded-full bg-fuchsia-50 text-fuchsia-700 text-xs px-3 py-1">
            Certificado autenticidad
          </span>
        </div>

        <h2 className="text-xl font-semibold tracking-tight mb-6">
          Resumen del Pedido
        </h2>

        {/* Items */}
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <Image
                src={getFirstImage(item.image)}
                alt={item.title}
                width={64}
                height={64}
                className="w-16 h-16 object-contain rounded-md border shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{item.title}</h4>
                {item.artist && (
                  <p className="text-xs text-gray-600 truncate">
                    {item.artist}
                  </p>
                )}
                <p className="text-sm font-medium">
                  {item.quantity} × {formatPrice(item.price ?? 0)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Garantías */}
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Pago 100% seguro
          </li>
          <li className="flex items-center">
            <Truck className="h-4 w-4 mr-2" />
            Envío asegurado
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Garantía de autenticidad
          </li>
        </ul>
      </div>
    </aside>
  );
}
