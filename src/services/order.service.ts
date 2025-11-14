/* eslint-disable @typescript-eslint/no-explicit-any */
// services/order/orders/order/orders.service.ts

import apiClient from "src/http/axios";

/** ─────────────────────────────────────────────────────────────────────────────
 *  Tipos compartidos con el backend (orders-svc / payments-svc)
 *  ────────────────────────────────────────────────────────────────────────────*/

export type PaymentMethod =
    | "card_offline" // datáfono físico (Itaú POS)
    | "cash"         // efectivo
    | "whatsapp"     // transferencias coordinadas por WhatsApp
    | "itau_mock";   // mock de pasarela Itaú

export interface OrderItemInput {
    artworkId: string;
    copyId?: string | null; // reservado por inventory-svc (opcional)
    artistId: string;
    qty: number;
    unitPrice: number;
    currency?: string; // default "COP" en backend
}

export interface PaymentDetails {
    cashierId?: string;
    cashDrawerId?: string;
    cardLast4?: string;
    cardHolder?: string;
    posTerminalId?: string;
    phone?: string;
    notes?: string;
    confirmedBy?: string;
    [key: string]: any;
}

export interface PaymentSnapshot {
    method: PaymentMethod;
    state: "pending" | "approved" | "declined" | "expired" | "error";
    amount?: number;
    currency?: string;
    reference?: string;
    gateway?: {
        transactionId?: string;
        mock?: boolean;
        [key: string]: any;
    };
    details?: PaymentDetails;
}

export interface InvoiceSnapshot {
    number?: string;
    issuedAt?: string;
    channel?: "event_pos" | "online" | "whatsapp";
    issuedBy?: string;
    externalId?: string;
    meta?: any;
}

export interface OrderDoc {
    id: string;
    _id?: string;
    status:
    | "created"
    | "payment_processing"
    | "paid"
    | "failed"
    | "canceled"
    | "refunded";
    userId?: string;
    event: string;
    items: OrderItemInput[];
    subtotal: number;
    total: number;
    currency: string;
    /** id de la reserva (hold) creada en inventory-svc */
    reservationId?: string | null;
    payment?: PaymentSnapshot;
    invoice?: InvoiceSnapshot;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateOrderInput {
    event: string;
    items: OrderItemInput[];
    userId?: string;
    /** reservationId devuelto por inventory-svc (/inventory/holds) */
    reservationId?: string;
}

/**
 * Payload para POST /orders/:id/paid (orders-svc)
 *
 * Coincide con el body esperado en el backend:
 * {
 *   method,
 *   amount,
 *   transactionId,
 *   reference,
 *   gateway,
 *   details,
 *   invoice
 * }
 */
export interface MarkOrderPaidInput {
    method: PaymentMethod;
    amount?: number;
    transactionId?: string;
    reference?: string;
    gateway?: Record<string, any>;
    details?: PaymentDetails;
    invoice?: InvoiceSnapshot;
}

/** Payloads específicos de cada método de pago (payments-svc) */

export interface CashPaymentConfirmInput {
    orderId: string;
    cashierId: string;
    amount: number;
    cashDrawerId?: string;
}

export interface CardOfflineConfirmInput {
    orderId: string;
    cashierId: string;
    amount: number;
    cardLast4?: string;
    cardHolder?: string;
    posTerminalId?: string;
}

export interface WhatsappInitiateInput {
    orderId: string;
    phone: string;
    messageId?: string;
    notes?: string;
}

export interface WhatsappConfirmInput {
    orderId: string;
    amount: number;
    confirmedBy?: string;
    reference?: string;
}

export interface ItauMockCheckoutInput {
    orderId: string;
    buyer?: {
        email?: string;
        firstName?: string;
        lastName?: string;
    };
}

export interface ItauMockCheckoutResponse {
    ok: boolean;
    reference: string;
    redirectUrl: string;
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Helpers
 *  ────────────────────────────────────────────────────────────────────────────*/

const normalizeId = <T extends { id?: string; _id?: string }>(obj: T) => ({
    ...obj,
    id: obj.id || (obj as any)._id,
});

/** ─────────────────────────────────────────────────────────────────────────────
 *  ORDERS-SVC (ruteado como /order/* desde el API Gateway)
 *  ────────────────────────────────────────────────────────────────────────────*/

/** POST /order/orders  → app.post("/orders", ...) */
export const createOrder = async (
    payload: CreateOrderInput
): Promise<OrderDoc> => {
    const { data } = await apiClient.post<OrderDoc>("/order/orders", payload, {
        withCredentials: true,
    });
    return normalizeId(data);
};

/** GET /order/orders/:id */
export const getOrder = async (orderId: string): Promise<OrderDoc> => {
    const { data } = await apiClient.get<OrderDoc>(`/order/orders/${orderId}`, {
        withCredentials: true,
    });
    return normalizeId(data);
};

/** PATCH /order/orders/:id (ajustes puntuales de la orden) */
export const patchOrder = async (
    orderId: string,
    patch: Partial<OrderDoc>
): Promise<OrderDoc> => {
    const { data } = await apiClient.patch<OrderDoc>(
        `/order/orders/${orderId}`,
        patch,
        {
            withCredentials: true,
        }
    );
    return normalizeId(data);
};

/**
 * POST /order/orders/:id/paid
 * Marca la orden como pagada y dispara la confirmación del hold en inventory-svc
 * cuando exista `reservationId`.
 */
export const markOrderPaid = async (
    orderId: string,
    payload: MarkOrderPaidInput
): Promise<{ ok: boolean; already?: boolean }> => {
    const { data } = await apiClient.post<{ ok: boolean; already?: boolean }>(
        `/order/orders/${orderId}/paid`,
        payload,
        { withCredentials: true }
    );
    return data;
};

/** ─────────────────────────────────────────────────────────────────────────────
 *  PAYMENTS-SVC  (métodos de venta de obra)
 *  ────────────────────────────────────────────────────────────────────────────*/

/** POST /pay/payments/cash/confirm */
export const confirmCashPayment = async (
    payload: CashPaymentConfirmInput
): Promise<{ ok: boolean }> => {
    const { data } = await apiClient.post<{ ok: boolean }>(
        "/pay/payments/cash/confirm",
        payload,
        { withCredentials: true }
    );
    return data;
};

/** POST /pay/payments/card-offline/confirm */
export const confirmCardOfflinePayment = async (
    payload: CardOfflineConfirmInput
): Promise<{ ok: boolean }> => {
    const { data } = await apiClient.post<{ ok: boolean }>(
        "/pay/payments/card-offline/confirm",
        payload,
        { withCredentials: true }
    );
    return data;
};

/** POST /pay/payments/whatsapp/initiate */
export const initiateWhatsappPayment = async (
    payload: WhatsappInitiateInput
): Promise<{ ok: boolean }> => {
    const { data } = await apiClient.post<{ ok: boolean }>(
        "/pay/payments/whatsapp/initiate",
        payload,
        { withCredentials: true }
    );
    return data;
};

/** POST /pay/payments/whatsapp/confirm */
export const confirmWhatsappPayment = async (
    payload: WhatsappConfirmInput
): Promise<{ ok: boolean }> => {
    const { data } = await apiClient.post<{ ok: boolean }>(
        "/pay/payments/whatsapp/confirm",
        payload,
        { withCredentials: true }
    );
    return data;
};

/** POST /pay/payments/itau/mock/checkout */
export const startItauMockCheckout = async (
    payload: ItauMockCheckoutInput
): Promise<ItauMockCheckoutResponse> => {
    const { data } = await apiClient.post<ItauMockCheckoutResponse>(
        "/pay/payments/itau/mock/checkout",
        payload,
        { withCredentials: true }
    );
    return data;
};

/** POST /pay/payments/itau/mock/webhook (para pruebas manuales desde admin) */
export const sendItauMockWebhook = async (payload: {
    orderId: string;
    reference?: string;
    state: "approved" | "declined" | "expired" | "pending";
}): Promise<{ ok: boolean }> => {
    const { data } = await apiClient.post<{ ok: boolean }>(
        "/pay/payments/itau/mock/webhook",
        payload,
        { withCredentials: true }
    );
    return data;
};
