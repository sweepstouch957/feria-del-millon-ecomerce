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
import { useMounted } from "@hooks/useMounted";
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
import { useCatalogSalesPaused } from "@provider/siteConfigProvider";
import { getArtworkByIdOrSlug } from "@services/artworks.service";
import { pickSrc } from "@lib/utils";

// Validación simple para documento colombiano

export default function CheckoutPageClient() {
    const { eventId } = useEdition();
    // Zustand
    const mounted = useMounted();
    const storedItems = useCart((s) => s.items) as CartViewItem[];
    const items = mounted ? storedItems : [];
    const clear = useCart((s) => s.clear);
    const add = useCart((s) => s.add);
    const searchParams = useSearchParams();

    // Cities
    const { data: cities = [], isLoading: loadingCities } = useCities();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const steps = ["Tus datos", "Pago", "Confirmación"];

    const { user } = useAuth();
    const salesPause = useCatalogSalesPaused();

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
    const count = items.reduce((a, i) => a + Number(i.quantity ?? 1), 0);
    const createOrderMutation = useMutation({ mutationFn: createOrder });

    const handleSubmitInfo = handleSubmit(async (values) => {
        if (!items.length) return;

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
        } catch (error: any) {
            console.error("Error creando la orden:", error);
            const code = error?.response?.data?.error;
            setArtworkUnavailable(
                code === "sin_stock"
                    ? "Una de las obras del carrito se vendió hace un momento. No se hizo ningún cobro."
                    : code === "sales_paused"
                    ? salesPause.message || "Durante la feria las obras se compran en el recinto."
                    : error?.response?.data?.error || "No pudimos crear la orden. Intenta de nuevo."
            );
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
    if (mounted && items.length === 0 && step !== 3) {
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
                        {salesPause.paused ? "Venta en feria" : artworkUnavailable ? "Obra no disponible" : "No hay obras en el carrito"}
                    </span>
                    <p style={{ margin: 0, maxWidth: "42ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
                        {salesPause.paused
                            ? salesPause.message
                            : artworkUnavailable
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
            <style>{`
              .fdm-check-grid { display: grid; grid-template-columns: minmax(0,1fr) 380px; gap: clamp(24px,4vw,64px); align-items: start; padding-bottom: clamp(40px,6vw,88px); }
              @media (max-width: 960px) { .fdm-check-grid { grid-template-columns: 1fr; } .fdm-check-grid > aside { position: static !important; } }
            `}</style>
            <main
                className="fdm-check"
                style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px,3vw,32px)" }}
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

                {/* Cabecera: un solo título y los pasos en línea */}
                <header
                    className="fdm-check-head"
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: "18px 40px",
                        padding: "clamp(22px,3vw,40px) 0 clamp(18px,2vw,26px)",
                        borderBottom: `1px solid ${mix(12)}`,
                        marginBottom: "clamp(24px,3vw,40px)",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                        <span style={{ ...EYEBROW, opacity: 0.65 }}>Compra · {count} {count === 1 ? "pieza" : "piezas"}</span>
                        <h1
                            style={{
                                margin: 0,
                                fontWeight: 200,
                                fontSize: "clamp(34px,4.6vw,56px)",
                                lineHeight: 1,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {step === 3 ? "Listo." : step === 2 ? "Pago." : "Tus datos."}
                        </h1>
                    </div>
                    <Stepper
                        steps={steps}
                        current={step}
                        lockForward
                        onStepChange={(next) => {
                            if (next < step) setStep(next as 1 | 2 | 3);
                        }}
                    />
                </header>

                <div className="fdm-check-grid">
                    <div style={{ minWidth: 0 }}>
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
                            <PaymentForm
                                total={subtotal}
                                isProcessing={isProcessing}
                                onPay={handlePayment}
                                onBack={() => setStep(1)}
                                orderId={currentOrder.id}
                            />
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
            