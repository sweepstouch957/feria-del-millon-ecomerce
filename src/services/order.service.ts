

import apiClient from "src/http/axios";

export type PaymentMethod =
    | "card_offline" // datáfono físico (Itaú POS)
    | "cash" // efectivo
    | "whatsapp" // transferencias coordinadas por WhatsApp
    | "itau_mock"
    | "credit_card" // tarjeta en línea o marcada manualmente
    | "pse" // pago PSE (vía webhook)
    | "mercadopago"// pago vía Mercado Pago (vía webhook);
    | "whatsapp";

export interface AddressInput {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    zip?: string;
    country?: string;
}

export interface BuyerInput {
    name: string;
    email: string;
    phone?: string;
    address: AddressInput;
}

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
    authCode?: string;
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
        provider?: string;
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
    /** buyer guardado en la orden */
    buyer?: BuyerInput;
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
    /** buyer requerido por backend: name + email + address */
    buyer: BuyerInput;
}

const normalizeId = <T extends { id?: string; _id?: string }>(obj: T) => ({
    ...obj,
    id: obj.id || (obj as any)._id,
});


export const createOrder = async (
    payload: CreateOrderInput
): Promise<OrderDoc> => {
    const { data } = await apiClient.post<OrderDoc>("/order/orders", payload, {
        withCredentials: true,
    });
    return normalizeId(data);
};

export const chargeMercadoPagoCard = async (payload: {
    orderId: string;
    token: string;
    installments?: number;
    paymentMethodId?: string;
    issuerId?: string;
    email: string;
}) => {
    const { data } = await apiClient.post<{
        ok: boolean;
        status: string;
        payment: any;
    }>("/pay/payments/mercadopago/card-charge", payload, {
        withCredentials: true,
    });
    return data;
};

/* ── Vista del artista ─────────────────────────────────────────────────
   El backend acota por el artista del token: acá no se manda ningún id,
   justamente para que no se pueda pedir la agenda de entregas de otro. */

export interface ArtistOrderItem {
  id: string;
  artworkId: string;
  copyId?: string | null;
  qty: number;
  unitPrice: number;
  currency?: string;
  deliveryStatus: "pending" | "delivered" | "returned";
  deliveredAt?: string | null;
  artistPayoutStatus?: "pending" | "ready" | "paid";
}

export interface ArtistOrderAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  notes?: string;
}

export interface ArtistOrder {
  id: string;
  code: string;
  createdAt: string;
  status: string;
  event?: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
    address?: ArtistOrderAddress | null;
  } | null;
  items: ArtistOrderItem[];
  artistSubtotal: number;
}

export const listMyArtistOrders = async (params?: {
  event?: string;
  deliveryStatus?: string;
}): Promise<ArtistOrder[]> => {
  const { data } = await apiClient.get<{ rows: ArtistOrder[] }>(
    "/order/orders/mine/artist",
    { params, withCredentials: true }
  );
  return data?.rows ?? [];
};

export const setArtistItemDelivery = async (
  orderId: string,
  itemId: string,
  deliveryStatus: "pending" | "delivered" | "returned"
): Promise<ArtistOrderItem> => {
  const { data } = await apiClient.patch<{ item: ArtistOrderItem }>(
    `/order/orders/mine/artist/${orderId}/items/${itemId}/delivery`,
    { deliveryStatus },
    { withCredentials: true }
  );
  return data.item;
};
