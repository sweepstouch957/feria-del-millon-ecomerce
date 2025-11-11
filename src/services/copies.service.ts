/* eslint-disable @typescript-eslint/no-explicit-any */
// services/catalog/copies.service.ts
import apiClient from "src/http/axios";

// -----------------------------------------
// Paginación
// -----------------------------------------
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string; // "-createdAt" | "price" | "serial"
}

export interface PaginatedResponse<T> {
  docs: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// -----------------------------------------
// Tipos base
// -----------------------------------------
export type CopyStatus = "available" | "reserved" | "sold" | "void";

export interface Copy {
  id: string;
  event: string;        // ObjectId ref -> Event
  artwork: string;      // ObjectId ref -> Artwork
  edition: string;      // ObjectId ref -> Edition

  serial?: string;      // único
  // Campos de precio — soporta ambas variantes de tu schema/controlador
  price?: number;                 // precio editable (controlador updateCopyPrice)
  priceAtCreation?: number;       // si en algún entorno se guardó con este nombre
  currency?: string;              // "COP"
  priceSource?: "edition" | "custom";
  editionPriceSnapshot?: number;

  customDimensions?: string; // "140x110 marco blanco"
  notes?: string;

  // QR
  qrUrl?: string;
  qrImageUrl?: string;
  qrPublicId?: string;
  qrPayloadHash?: string;

  status: CopyStatus;
  reservedAt?: string;
  reservedBy?: string;
  reservedUntil?: string;

  soldAt?: string;
  soldBy?: string;
  soldPrice?: number;

  orderId?: string;
  invoiceId?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CopyFilters extends PaginationParams {
  q?: string;             // texto libre (serial/notas)
  status?: CopyStatus;
  event?: string;         // event id
  artwork?: string;       // artwork id
  edition?: string;       // edition id
  serial?: string;
  reservedBy?: string;
  soldBy?: string;
}

export interface CreateCopyDto {
  // según tu controller:
  editionId: string;
  price: number;                 // requerido
  serial?: string;
  customDimensions?: string;
  notes?: string;
}

export interface UpdateCopyPriceDto {
  price: number;                 // requerido
  regenerateQr?: boolean;        // query param: ?regenerateQr=true
}

export interface ReserveCopyDto {
  userId: string;                // requerido
  ttlMinutes?: number;           // default 30
}

export interface SellCopyDto {
  userId: string;                // requerido
  soldPrice: number;             // requerido
}

const normalizeId = <T extends { id?: string; _id?: string }>(obj: T) => ({
  ...obj,
  id: (obj as any).id || (obj as any)._id,
});

const buildQuery = (params: Record<string, any> = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

// -----------------------------------------
// Endpoints Copias
// -----------------------------------------

// Listar copias
export const getCopies = async (filters: CopyFilters = {}) => {
  const qs = buildQuery(filters);
  const url = `/catalog/copies${qs ? `?${qs}` : ""}`;
  const { data } = await apiClient.get<PaginatedResponse<Copy>>(url, { withCredentials: true });
  return {
    ...data,
    docs: data.docs.map(normalizeId),
  };
};

// Obtener copia por id
export const getCopyById = async (id: string) => {
  const { data } = await apiClient.get<Copy>(`/catalog/copies/${id}`, { withCredentials: true });
  return normalizeId(data);
};

// Crear copia (genera QR y valida rangos como en tu controller)
export const createCopy = async (payload: CreateCopyDto) => {
  const { data } = await apiClient.post<Copy>("/catalog/copies", payload, { withCredentials: true });
  return normalizeId(data);
};

// Actualizar precio de una copia (opcionalmente regenera hash del QR)
export const updateCopyPrice = async (id: string, payload: UpdateCopyPriceDto) => {
  const { price, regenerateQr } = payload;
  const qs = buildQuery({ regenerateQr });
  // Path consistente con tu handler `updateCopyPrice`
  const url = `/catalog/copies/${id}/price${qs ? `?${qs}` : ""}`;
  const { data } = await apiClient.patch<{
    ok: boolean;
    copyId: string;
    price: number;
    priceSource?: "edition" | "custom";
  }>(url, { price }, { withCredentials: true });
  return data;
};

// Reservar copia (TTL default 30m)
export const reserveCopy = async (id: string, payload: ReserveCopyDto) => {
  const { data } = await apiClient.post<{
    ok: boolean;
    copyId: string;
    reservedUntil: string;
  }>(`/catalog/copies/${id}/reserve`, payload, { withCredentials: true });
  return data;
};

// Liberar reserva
export const releaseCopy = async (id: string) => {
  const { data } = await apiClient.post<{ ok: boolean; copyId: string }>(
    `/catalog/copies/${id}/release`,
    {},
    { withCredentials: true }
  );
  return data;
};

// Vender copia (valida rango y estatus)
export const sellCopy = async (id: string, payload: SellCopyDto) => {
  const { data } = await apiClient.post<{ ok: boolean; copyId: string; soldPrice: number }>(
    `/catalog/copies/${id}/sell`,
    payload,
    { withCredentials: true }
  );
  return data;
};
