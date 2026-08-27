import apiClient from "src/http/axios";

export interface ArtistApplication {
  _id: string;
  convocatoria: { _id: string; name: string; slug: string; fee: number; currency: string; startDate: string; endDate: string; status: string } | string;
  artist: string;
  status: "pending_payment" | "draft" | "submitted" | "under_review" | "revision_requested" | "accepted" | "rejected";
  paymentStatus: "pending" | "approved" | "rejected" | "cancelled";
  isPaid: boolean;
  paidAt?: string;
  cvUrl?: string;
  profilePhotoUrl?: string;
  bio?: string;
  projectReview?: string;
  artworkImages: ArtworkImageEntry[];
  detailImageUrl?: string;
  montageImageUrl?: string;
  adminNotes?: string;
  rejectionReason?: string;
  revisionNotes?: string;
  revisionRequestedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtworkImageEntry {
  _id?: string;
  url: string;
  cloudinaryId?: string;
  title: string;
  technique?: string;
  dimensions?: string;
  year?: number;
  price?: number;
  currency?: string;
  role?: "project" | "detail" | "montage";
}

export const createApplication = async (convocatoriaId: string) => {
  const { data } = await apiClient.post("/applications/applications", { convocatoriaId });
  return data.doc as ArtistApplication;
};

export const getMyApplications = async () => {
  const { data } = await apiClient.get("/applications/applications/my");
  return data.docs as ArtistApplication[];
};

export const getApplicationById = async (id: string) => {
  const { data } = await apiClient.get(`/applications/applications/${id}`);
  return data.doc as ArtistApplication;
};

export const updateApplication = async (id: string, payload: Partial<ArtistApplication>) => {
  const { data } = await apiClient.patch(`/applications/applications/${id}`, payload);
  return data.doc as ArtistApplication;
};

export const submitApplication = async (id: string) => {
  const { data } = await apiClient.post(`/applications/applications/${id}/submit`);
  return data.doc as ArtistApplication;
};

export const initiatePayment = async (id: string) => {
  const { data } = await apiClient.post(`/applications/applications/${id}/payment/initiate`);
  return data as { preferenceId: string; initPoint: string; sandboxInitPoint: string };
};

/** DEV ONLY: mark application as paid without MercadoPago */
export const mockPayment = async (id: string) => {
  const { data } = await apiClient.post(`/applications/applications/${id}/dev/mock-pay`);
  return data as { ok: boolean; doc: ArtistApplication; mock?: boolean };
};

/** Ask the backend to re-check payment status with MercadoPago after redirect */
export const checkPaymentStatus = async (id: string) => {
  const { data } = await apiClient.post(`/applications/applications/${id}/payment/check`);
  return data as { ok: boolean; paymentStatus: string; isPaid: boolean };
};

/** Public (no auth) payment verification — used after MercadoPago redirect
 *  when the auth cookie may have been lost during cross-domain redirect */
export const checkPaymentStatusPublic = async (id: string) => {
  const { data } = await apiClient.get(`/applications/applications/${id}/payment/verify`);
  return data as { ok: boolean; paymentStatus: string; isPaid: boolean };
};


/** Perfil público del artista: solo bio y reseña, de solicitudes aceptadas.
 *  Sin auth — el backend filtra qué campos salen. */
export interface PublicArtistProfile {
  bio: string;
  projectReview: string;
  photoUrl: string;
}

export const getPublicArtistProfile = async (
  artistId: string
): Promise<PublicArtistProfile | null> => {
  const { data } = await apiClient.get(
    `/applications/applications/public/artist/${artistId}`
  );
  return data?.profile ?? null;
};
