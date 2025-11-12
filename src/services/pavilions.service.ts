/* eslint-disable @typescript-eslint/no-explicit-any */

import apiClient from "src/http/axios";

/* ========= Tipos ========= */
export interface PavilionDoc {
  id: string;
  _id?: string;
  event: string;                 // ObjectId -> Event
  name: string;
  slug: string;
  description?: string;
  validFrom?: string;            // ISO
  validTo?: string;              // ISO
  minArtworkPrice?: number;
  maxArtworkPrice?: number;
  mainImage?: string;
  order?: number;
  active?: boolean;
  meta?: Record<string, any>;
  artists?: string[];            // ObjectId[] -> User
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePavilionDto {
  name: string;
  slug: string;
  description?: string;
  validFrom?: string;            // ISO
  validTo?: string;              // ISO
  minArtworkPrice?: number;
  maxArtworkPrice?: number;
  mainImage?: string;
  order?: number;
  active?: boolean;
  meta?: Record<string, any>;
  artists?: string[];
}

/* ========= Helpers ========= */
const normalizeId = <T extends { id?: string; _id?: string }>(obj: T) => ({
  ...obj,
  id: (obj as any).id || (obj as any)._id,
});

/* ========= Endpoints ========= */

// POST /events/:eventId/pavilions
export const createPavilion = async (eventId: string, payload: CreatePavilionDto) => {
  const { data } = await apiClient.post<PavilionDoc>(
    `/event/events/${encodeURIComponent(eventId)}/pavilions`,
    payload,
    { withCredentials: true }
  );
  return normalizeId(data);
};

// GET /events/:eventId/pavilions
export const listPavilions = async (eventId: string) => {
  const { data } = await apiClient.get<PavilionDoc[]>(
    `/event/events/${encodeURIComponent(eventId)}/pavilions`,
    { withCredentials: true }
  );
  return data.map(normalizeId);
};


// GET /events/:eventId/pavilions/:slug
export const getPavillionBySlug = async (eventId: string, slug: string) => {
  const { data } = await apiClient.get<PavilionDoc>(
    `/event/events/${encodeURIComponent(eventId)}/pavilions/${encodeURIComponent(slug)}`,
    { withCredentials: true }
  );
  return normalizeId(data);
}

/* ========= Tipos: Pabellones por Usuario ========= */
export interface PavilionByUserRow {
  pavilionId: string;
  name?: string;
  slug?: string;
  mainImage?: string;
  priceRange?: { min?: number; max?: number };
  artworksCount?: number; // presente si includeCounts=true
}

export interface ListPavilionsByUserResponse {
  ok: boolean;
  total: number;
  rows: PavilionByUserRow[];
}

/* ========= Endpoint: GET /events/:eventId/pavilions/by-user/:userId ========= */
export const listPavilionsByUser = async (
  eventId: string,
  userId: string,
  includeCounts: boolean = true
): Promise<ListPavilionsByUserResponse> => {
  const qs = includeCounts === false ? "?includeCounts=false" : "";
  const url = `/event/events/${encodeURIComponent(
    eventId
  )}/pavilions/by-user/${encodeURIComponent(userId)}${qs}`;

  const { data } = await apiClient.get<ListPavilionsByUserResponse>(url, {
    withCredentials: true,
  });

  // No hay _id en filas; retornamos tal cual
  return data;
};