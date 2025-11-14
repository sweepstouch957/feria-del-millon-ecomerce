// src/services/users.service.ts
import apiClient from "src/http/axios";
import type { Roles } from "./auth.service";

export type DocumentType = "CC" | "NIT" | "CE" | "PP" | "OTRO" | "INE";

export interface UserDoc {
  _id: string;
  email: string;
  passwordHash?: string; // normalmente no se expone
  image?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  city?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  active: boolean;
  roles: Roles;
  lastLoginAt?: string;
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Payload para actualizar usuario (solo campos permitidos en el backend)
export type UpdateUserPayload = Partial<{
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  image: string;
  documentType: DocumentType;
  documentNumber: string;
  city: string;
  address: string;
  instagram: string;
  facebook: string;
  website: string;
  active: boolean;
  // Si decides permitir edición de roles:
  // roles: Roles;
}>;

export interface GetUserByIdResponse {
  user: UserDoc;
}

export interface UpdateUserResponse {
  ok: boolean;
  user: UserDoc;
}

// GET /auth/users/:id
export const getUserById = async (id: string): Promise<UserDoc> => {
  const { data } = await apiClient.get<GetUserByIdResponse>(
    `/auth/users/${id}`,
    { withCredentials: true }
  );
  return data.user;
};

// PATCH /auth/users/:id
export const updateUserById = async (
  id: string,
  payload: UpdateUserPayload
): Promise<UserDoc> => {
  const { data } = await apiClient.patch<UpdateUserResponse>(
    `/auth/users/${id}`,
    payload,
    { withCredentials: true }
  );
  return data.user;
};
