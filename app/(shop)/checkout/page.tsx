"use client";

import {
  useMemo,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Stepper } from "@components/ui/stepper";
import {
  ArrowLeft,
  Shield,
  Truck,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";

import useCart from "@store/useCart";
import PaymentForm from "@components/PaymentForm";
import { useCities } from "@hooks/queries/useCities";

import {
  createOrder,
  patchOrder,
  confirmCashPayment,
  confirmCardOfflinePayment,
  initiateWhatsappPayment,
  startItauMockCheckout,
  type OrderDoc,
  type PaymentMethod,
} from "@services/order.service";

type ImgLike = string | string[] | undefined | null;

type CartViewItem = {
  id: string;
  title: string;
  price: number;
  image?: ImgLike;
  quantity: number;
  artist?: string;
  year?: number;
  medium?: string;

  // campos “reales” para el backend (puedes ya tenerlos en tu store)
  artworkId?: string;
  copyId?: string | null;
  artistId?: string;
  eventId?: string;
};

type PaymentFormPayload = {
  method: PaymentMethod;
  phone?: string;
  notes?: string;
  cashierId?: string;
  cardLast4?: string;
  cardHolder?: string;
  posTerminalId?: string;
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

export default function CheckoutPage() {
  // 🛒 Zustand
  const items = useCart((s) => s.items) as CartViewItem[];
  const clear = useCart((s) => s.clear);

  // Ciudades
  const { data: cities = [], isLoading: loadingCities } = useCities();

  // Paso actual
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const steps = ["Dirección", "Pago", "Confirmación"];

  // Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    cityId: "",
    state: "",
    zipCode: "",
    country: "Colombia",
    notes: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [currentOrder, setCurrentOrder] = useState<OrderDoc | null>(null);

  // Totales
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),
    [items]
  );
  const shipping = subtotal > 5_000_000 ? 0 : 150_000;
  const total = subtotal + shipping;

  // ────────────────────────────────────────────────────────────────────────────
  // React Query mutations
  // ────────────────────────────────────────────────────────────────────────────
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
  });

  const patchOrderMutation = useMutation({
    mutationFn: ({
      orderId,
      patch,
    }: { orderId: string; patch: Partial<OrderDoc> }) =>
      patchOrder(orderId, patch),
  });

  const cashPaymentMutation = useMutation({
    mutationFn: confirmCashPayment,
  });

  const cardPaymentMutation = useMutation({
    mutationFn: confirmCardOfflinePayment,
  });

  const whatsappInitMutation = useMutation({
    mutationFn: initiateWhatsappPayment,
  });

  const itauCheckoutMutation = useMutation({
    mutationFn: startItauMockCheckout,
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────────────────────────────────
  const handleInputChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Manejo especial ciudad por ID
    if (name === "cityId") {
      setFormData((s) => ({
        ...s,
        cityId: value,
      }));
      return;
    }

    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmitInfo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!items.length) return;

    // Determinar eventId (puedes ajustarlo según tu dominio)
    const EVENT_ID_ENV =
      process.env.NEXT_PUBLIC_EVENT_ID || undefined;
    const eventId =
      items[0]?.eventId || EVENT_ID_ENV;

    if (!eventId) {
      console.error("No se pudo determinar el eventId para la orden");
      return;
    }

    if (!formData.cityId) {
      alert("Por favor selecciona la ciudad de entrega.");
      return;
    }

    try {
      setIsProcessing(true);

      // Mapear items del carrito a OrderItemInput
      const orderItems = items.map((item) => ({
        artworkId: item.artworkId ?? item.id,
        copyId: item.copyId ?? null,
        artistId: item.artist ?? "", // idealmente ya viene del carrito
        qty: item.quantity,
        unitPrice: item.price,
        currency: "COP",
      }));

      const newOrder = await createOrderMutation.mutateAsync({
        event: eventId,
        items: orderItems,
        // userId: si tienes auth, agrégalo aquí
      });

      setCurrentOrder(newOrder);

      // Guardamos datos de envío dentro de invoice.meta (shipping)
      const selectedCity = cities.find(
        (c) => c.id === formData.cityId
      );

      await patchOrderMutation.mutateAsync({
        orderId: newOrder.id,
        patch: {
          invoice: {
            channel: "online",
            meta: {
              shipping: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                cityId: formData.cityId,
                cityName: selectedCity?.name,
                state: formData.state,
                zipCode: formData.zipCode,
                country: formData.country,
                notes: formData.notes,
              },
            },
          },
        },
      });

      // Pasamos a pago
      setStep(2);
    } catch (error) {
      console.error("Error creando la orden:", error);
      alert("Ocurrió un error creando tu orden. Intenta de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (payload: PaymentFormPayload) => {
    if (!currentOrder) {
      console.error("No hay orden en memoria");
      return;
    }

    setIsProcessing(true);

    try {
      const method = payload.method;

      if (method === "cash") {
        await cashPaymentMutation.mutateAsync({
          orderId: currentOrder.id,
          cashierId: payload.cashierId ?? "online",
          amount: currentOrder.total,
        });
      } else if (method === "card_offline") {
        await cardPaymentMutation.mutateAsync({
          orderId: currentOrder.id,
          cashierId: payload.cashierId ?? "online",
          amount: currentOrder.total,
          cardLast4: payload.cardLast4,
          cardHolder: payload.cardHolder,
          posTerminalId: payload.posTerminalId,
        });
      } else if (method === "whatsapp") {
        if (!payload.phone) {
          alert("Debes indicar un número de WhatsApp para este método.");
          return;
        }

        await whatsappInitMutation.mutateAsync({
          orderId: currentOrder.id,
          phone: payload.phone,
          notes: payload.notes,
        });

        // Para WhatsApp dejamos la orden en "payment_processing" y mostramos confirmación
      } else if (method === "itau_mock") {
        const resp = await itauCheckoutMutation.mutateAsync({
          orderId: currentOrder.id,
          buyer: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
          },
        });

        // Redirigimos a la página mock de Itaú (front que simula el banco)
        if (resp.redirectUrl) {
          window.location.href = resp.redirectUrl;
          return; // no seguimos al step 3 aquí, depende del flujo de webhook
        }
      }

      // Si llegamos aquí, consideramos flujo "OK" para mostrar confirmación
      const formattedOrderNumber =
        "FDM-" + (currentOrder.id || "").slice(-6);
      setOrderNumber(formattedOrderNumber);
      clear();
      setStep(3);
    } catch (error) {
      console.error("Error procesando el pago:", error);
      alert("Ocurrió un error procesando el pago. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Carrito vacío (antes de confirmar)
  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No hay productos en el carrito
          </h1>
          <Link href="/catalogo">
            <Button>Explorar Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {step !== 3 && (
            <Link
              href="/carrito"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Carrito
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {steps[step - 1]}
          </h1>
        </div>

        {/* Stepper */}
        <Stepper
          steps={steps}
          current={step}
          descriptions={[
            "Completa tu información y dirección de envío.",
            "Método de pago y verificación.",
            "¡Listo! Confirmación y número de orden.",
          ]}
          lockForward
          onStepChange={(next) => {
            if (next < step) setStep(next as 1 | 2 | 3);
          }}
          className="mb-8"
        />

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario / Contenido */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <form
                onSubmit={handleSubmitInfo}
                className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8"
              >
                <h2 className="text-xl font-semibold tracking-tight mb-6">
                  Información Personal
                </h2>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="Tu nombre"
                      className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Tu apellido"
                      className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="tu@email.com"
                      className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+57 300 123 4567"
                      className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4 mt-8">
                  Dirección de Envío
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Calle, carrera, número"
                    className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad de entrega *
                    </label>
                    <select
                      name="cityId"
                      value={formData.cityId}
                      onChange={handleInputChange}
                      required
                      disabled={loadingCities}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                    >
                      <option value="">
                        {loadingCities
                          ? "Cargando ciudades..."
                          : "Selecciona una ciudad"}
                      </option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento *
                    </label>
                    <Input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      placeholder="Departamento"
                      className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <Input
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="110111"
                      className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    placeholder="Instrucciones especiales de entrega..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full transition-all hover:brightness-[0.98] active:scale-[0.99]"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Procesando..." : "Continuar al Pago"}
                </Button>
              </form>
            )}

            {step === 2 && currentOrder && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
                <PaymentForm
                  total={total}
                  isProcessing={isProcessing}
                  onPay={handlePayment}
                  onBack={() => setStep(1)}
                />
              </div>
            )}

            {step === 3 && (
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
            )}
          </div>

          {/* Resumen del Pedido */}
          {step !== 3 && (
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
                        <h4 className="text-sm font-medium truncate">
                          {item.title}
                        </h4>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Gratis" : formatPrice(shipping)}
                    </span>
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
          )}
        </div>
      </div>
    </div>
  );
}
