"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";

import { Button } from "@components/ui/button";
import { Stepper } from "@components/ui/stepper";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import useCart from "@store/useCart";
import { useCities } from "@hooks/queries/useCities";

import {
    createOrder,
    type OrderDoc,
} from "@services/order.service";

import {
    CheckoutPersonalForm,
    CheckoutFormData,
} from "@components/views/checkout/CheckoutPersonalForm";
import {
    CheckoutOrderSummary,
    CartViewItem,
} from "@components/views/checkout/CheckoutOrderSummary";
import { CheckoutConfirmation } from "@components/views/checkout/CheckoutConfirmation";
import { DEFAULT_EVENT_ID } from "@core/constants";
import PaymentForm, { PaymentFormPayload } from "../payment/PaymentForm";
import { useAuth } from "@provider/authProvider";
import { getArtworkByIdOrSlug } from "@services/artworks.service";

// Validación simple para documento colombiano
const isValidColDocument = (doc: string) => {
    const trimmed = doc.trim();
    const re = /^\d{6,10}(-\d)?$/;
    return re.test(trimmed);
};

export default function CheckoutPageClient() {
    // 🛒 Zustand
    const items = useCart((s) => s.items) as CartViewItem[];
    const clear = useCart((s) => s.clear);
    const add = useCart((s) => s.add);
    const searchParams = useSearchParams();

    // Cities
    const { data: cities = [], isLoading: loadingCities } = useCities();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const steps = ["Dirección", "Pago", "Confirmación"];

    const { user } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset,
    } = useForm<CheckoutFormData>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            documentNumber: "",
            address: "",
            cityId: "",
            state: "",
            zipCode: "",
            country: "Colombia",
            notes: "",
        },
        mode: "onBlur",
    });

    useEffect(() => {
        if (!user) return;

        reset((prev) => ({
            ...prev,
            firstName: user.firstName || prev.firstName,
            lastName: user.lastName || prev.lastName,
            email: user.email || prev.email,
        }));
    }, [user, reset]);

    // ⭐ Mensaje cuando la obra ya está vendida / sin stock
    const [artworkUnavailable, setArtworkUnavailable] = useState<string | null>(
        null
    );

    // ⭐ Precargar carrito cuando mandan id/slug en la URL
    const [prefilledFromQuery, setPrefilledFromQuery] = useState(false);

    useEffect(() => {
        if (prefilledFromQuery) return;

        const identifier =
            searchParams.get("artwork") ||
            searchParams.get("artworkId") ||
            searchParams.get("artworkSlug");

        if (!identifier) return;

        setPrefilledFromQuery(true);

        (async () => {
            try {
                const resp: any = await getArtworkByIdOrSlug(identifier);
                const artwork = resp.doc;

                if (!artwork || !artwork._id) {
                    setArtworkUnavailable(
                        "La obra que estás intentando comprar ya no está disponible."
                    );
                    return;
                }

                if (artwork.stock === 0) {
                    setArtworkUnavailable(
                        `La obra “${artwork.title}” ya está vendida, no hay copias disponibles.`
                    );
                    return;
                }

                setArtworkUnavailable(null);
                clear();

                add(
                    {
                        id: artwork._id,
                        title: artwork.title,
                        artist: artwork.artist,
                        price: artwork.price ?? 0,
                        image: artwork.image ?? artwork.images?.[0],
                    },
                    1
                );
            } catch (err) {
                console.error("Error precargando carrito desde identificador:", err);
                setArtworkUnavailable(
                    "No pudimos cargar la obra. Es posible que ya no esté disponible."
                );
            }
        })();
    }, [searchParams, clear, add, prefilledFromQuery]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [currentOrder, setCurrentOrder] = useState<OrderDoc | null>(null);

    // Totales
    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [items]
    );

    // React Query
    const createOrderMutation = useMutation({ mutationFn: createOrder });

    const handleSubmitInfo = handleSubmit(async (values) => {
        if (!items.length) return;

        if (!isValidColDocument(values.documentNumber)) {
            setError("documentNumber", {
                type: "validate",
                message: "Documento inválido (6 a 10 dígitos).",
            });
            return;
        }

        if (!values.cityId) {
            setError("cityId", {
                type: "required",
                message: "Selecciona la ciudad.",
            });
            return;
        }

        try {
            setIsProcessing(true);

            const orderItems = items.map((item) => ({
                artworkId: item.id,
                artistId: item.artist ?? "",
                qty: item.quantity,
                unitPrice: item.price,
                currency: "COP",
            }));

            const payload = {
                event: DEFAULT_EVENT_ID,
                items: orderItems,
                buyer: {
                    name: `${values.firstName} ${values.lastName}`,
                    email: values.email,
                    phone: values.phone,
                    address: {
                        line1: values.address,
                        line2: values.notes ?? "",
                        city: values.cityId,
                        state: values.state,
                        zip: values.zipCode,
                        country: "Colombia",
                    },
                },
            };

            const newOrder = await createOrderMutation.mutateAsync(payload);

            setCurrentOrder(newOrder);
            setStep(2);
        } catch (error) {
            console.error("Error creando la orden:", error);
        } finally {
            setIsProcessing(false);
        }
    });

    const handlePayment = async (payload: PaymentFormPayload) => {
        if (!currentOrder) {
            console.error("No hay orden");
            return;
        }

        setIsProcessing(true);

        try {
            const formattedOrderNumber =
                "FDM-" + (currentOrder.id || "").slice(-6);

            setOrderNumber(formattedOrderNumber);
            clear();
            setStep(3);
        } catch (error) {
            console.error("Error procesando pago:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Carrito vacío
    if (items.length === 0 && step !== 3) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        {artworkUnavailable
                            ? "Obra no disponible"
                            : "No hay productos en el carrito"}
                    </h1>

                    <p className="text-gray-600 mb-6">
                        {artworkUnavailable
                            ? artworkUnavailable
                            : "Agrega obras a tu carrito para continuar con el pago."}
                    </p>

                    <Link href="/catalogo">
                        <Button>Explorar catálogo</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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

                <Stepper
                    steps={steps}
                    current={step}
                    descriptions={[
                        "Completa tu información y dirección de envío.",
                        "Método de pago.",
                        "¡Listo! Confirmación.",
                    ]}
                    lockForward
                    onStepChange={(next) => {
                        if (next < step) setStep(next as 1 | 2 | 3);
                    }}
                    className="mb-8"
                />

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {step === 1 && (
                            <CheckoutPersonalForm
                                cities={cities}
                                loadingCities={loadingCities}
                                isProcessing={isProcessing}
                                onSubmit={handleSubmitInfo}
                                register={register}
                                errors={errors}
                            />
                        )}

                        {step === 2 && currentOrder && (
                            <div className="bg-white p-6 rounded-2xl shadow">
                                <PaymentForm
                                    total={subtotal}
                                    isProcessing={isProcessing}
                                    onPay={handlePayment}
                                    onBack={() => setStep(1)}
                                    orderId={currentOrder.id} 
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <CheckoutConfirmation orderNumber={orderNumber} />
                        )}
                    </div>

                    {step !== 3 && (
                        <CheckoutOrderSummary
                            items={items}
                            total={subtotal}
                            subtotal={subtotal}
                        />
                    )}  
                </div>
            </div>
        </main>
    );
}
            