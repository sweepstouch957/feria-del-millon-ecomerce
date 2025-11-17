"use client";

import Link from "next/link";
import { Button } from "@components/ui/button";
import { CheckCircle, Shield, Truck } from "lucide-react";

type Props = {
  orderNumber: string;
};

export function CheckoutConfirmation({ orderNumber }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        ¡Pedido Confirmado!
      </h2>
      <p className="text-lg text-gray-600 mb-6">
        Tu pedido #{orderNumber} ha sido registrado correctamente.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-lg mx-auto">
        <h3 className="font-semibold mb-2">¿Qué sigue?</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span>Recibirás un email de confirmación</span>
          </div>
          <div className="flex items-center">
            <Truck className="h-4 w-4 text-blue-600 mr-2" />
            <span>Preparamos tu pedido en 2-3 días hábiles</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-purple-600 mr-2" />
            <span>Incluimos certificado de autenticidad</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <Link href="/catalogo">
          <Button className="w-full">Continuar Comprando</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full">
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
