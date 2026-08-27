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

import { Stepper } from "@components/ui/stepper";
import SiteFooter from "@components/SiteFooter";
import { CHECKOUT_CSS, EYEBROW, ROOT_VARS, mix } from "@components/views/checkout/checkoutTheme";

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
import { useEdition } from "@provider/editionProvider";
import PaymentForm, { PaymentFormPayload } from "../payment/PaymentForm";
import { useAuth } from "@provider/authProvider";
import { getArtworkByIdOrSlug } from "@services/artworks.service";
import { pickSrc } from "@lib/utils";

// Validación simple para documento colombiano
const isValidColDocument = (doc: string) => {
    const trimmed = doc.trim();
    const re = /^\d{6,10}(-\d)?$/;
    return re.test(trimmed);
};

export default function CheckoutPageClient() {
    const { eventId } = useEdition();
    // Zustand
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

    // Mensaje cuando la obra ya está vendida / sin stock
    const [artworkUnavailable, setArtworkUnavailable] = useState<string | null>(
        null
    );

    // Precargar carrito cuando mandan id/slug en la URL
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
                        image: pickSrc(artwork.image) || pickSrc(artwork.images?.[0]),
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
                event: eventId,
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
            <div style={ROOT_VARS}>
                <style>{CHECKOUT_CSS}</style>
                <div
                    className="fdm-check"
                    style={{
                        maxWidth: 1600,
                        margin: "0 auto",
                        padding: "clamp(50px,7vw,110px) clamp(20px,4vw,56px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 18,
                        textAlign: "center",
                    }}
                >
                    <span
                        style={{
                            fontWeight: 400,
                            fontSize: "clamp(21px,2.4vw,32px)",
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                        }}
                    >
                        {artworkUnavailable ? "Obra no disponible" : "No hay obras en el carrito"}
                    </span>
                    <p style={{ margin: 0, maxWidth: "42ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
                        {artworkUnavailable
                            ? artworkUnavailable
                            : "Agregá obras al carrito para continuar con el pago."}
                    </p>
                    <Link
                        href="/catalogo"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            height: 48,
                            padding: "0 30px",
                            background: "var(--fg)",
                            color: "var(--bg)",
                            borderRadius: 999,
                            ...EYEBROW,
                            fontSize: 11,
                            letterSpacing: "0.12em",
                        }}
                    >
                        Ver catálogo
                    </Link>
                </div>
                <SiteFooter />
            </div>
        );
    }

    return (
        <div style={ROOT_VARS}>
            <style>{CHECKOUT_CSS}</style>
            <main
                className="fdm-check"
                style={{ maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}
            >
                <nav
                    aria-label="Migas de pan"
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 9,
                        padding: "12px 0",
                        borderBottom: `1px solid ${mix(12)}`,
                        ...EYEBROW,
                        fontSize: 10.5,
                        letterSpacing: "0.14em",
                        color: mix(55),
                    }}
                >
                    <Link href="/catalogo" className="fdm-check-link">Catálogo</Link>
                    <span aria-hidden>/</span>
                    <Link href="/carrito" className="fdm-check-link">Carrito</Link>
                    <span aria-hidden>/</span>
                    <span aria-current="page" style={{ color: mix(85) }}>{steps[step - 1]}</span>
                </nav>

                <h1
                    style={{
                        margin: 0,
                        padding: "clamp(20px,2.4vw,32px) 0 clamp(14px,1.6vw,20px)",
                        fontWeight: 300,
                        fontSize: "clamp(32px,4vw,60px)",
                        lineHeight: 0.98,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                    }}
                >
                    {steps[step - 1]}
                </h1>

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
                            <div style={{ background: mix(3), border: `1px solid ${mix(12)}`, padding: "clamp(18px,2vw,26px)" }}>
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
            </main>
            <SiteFooter />
        </div>
    );
}
            