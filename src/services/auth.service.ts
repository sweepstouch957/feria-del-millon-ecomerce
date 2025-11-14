/* eslint-disable @typescript-eslint/no-explicit-any */
// services/auth.service.ts
import { AUTH_TOKEN_KEY } from "@core/constants";
import Cookies from "js-cookie";
import apiClient from "src/http/axios";

export interface Roles {
  superuser?: boolean;
  staff?: boolean;
  curador?: boolean;
  cajero?: boolean;
  artista?: boolean;
}

export interface AuthUser {
  id: string;
  _id?: string;
  email: string;
  roles?: Roles;
  firstName?: string;
  lastName?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  // cualquier extra que tu backend permita (mobile, doc, etc.)
  [k: string]: any;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    roles?: Roles;
    firstName?: string;
    lastName?: string;
  };
}

// ------ Password flows ------

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  ok: boolean;
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  message: string;
  // dev-only (según backend)
  token?: string;
  resetUrl?: string;
  expiresAt?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  ok: boolean;
  message: string;
}

// ------- Helpers -------

const setAuthToken = (token: string | null) => {
  if (token) {
    Cookies.set(AUTH_TOKEN_KEY, token);
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    Cookies.remove(AUTH_TOKEN_KEY);
    delete apiClient.defaults.headers.common.Authorization;
  }
};

// Llama esto temprano (ej. en el Provider) para hidratar el header desde cookie
export const setAuthHeaderFromCookie = () => {
  const token = Cookies.get(AUTH_TOKEN_KEY) || null;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const clearAuth = () => setAuthToken(null);

// ------- Auth básico: register + login -------

export const register = async (payload: RegisterPayload) => {
  const { data } = await apiClient.post<RegisterResponse>(
    "/auth/register",
    payload,
    { withCredentials: true }
  );
  return data;
};

export const login = async (email: string, password: string) => {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { withCredentials: true }
  );
  // Guarda token y header para siguientes requests
  setAuthToken(data.token);
  return data;
};

// ------- /me y /logout -------

export const me = async (): Promise<AuthUser> => {
  const { data } = await apiClient.get<{ user: AuthUser }>("/auth/me", {
    withCredentials: true,
  });

  const u = data.user;
  // Normaliza por si el backend usa _id
  return {
    id: (u as any).id || (u as any)._id || u.id,
    email: u.email,
    roles: u.roles,
    firstName: u.firstName,
    lastName: u.lastName,
  };
};

export const logout = async (): Promise<void> => {
  // Si tu backend requiere auth header, ya va con axios defaults
  await apiClient
    .post("/auth/logout", {}, { withCredentials: true })
    .catch(() => {
      // Si falla, igual limpiaremos cliente
    });
  clearAuth();
};

// ------- Password: change, forgot, reset -------

// Cambiar contraseña estando logueado
export const changePassword = async (
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> => {
  const { data } = await apiClient.post<ChangePasswordResponse>(
    "/auth/password/change",
    payload,
    { withCredentials: true }
  );
  return data;
};

// Solicitar reset (forgot password)
export const requestPasswordReset = async (
  email: string
): Promise<ForgotPasswordResponse> => {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    "/auth/password/forgot",
    { email },
    { withCredentials: true }
  );
  return data;
};

// Consumir el token y resetear la password
export const resetPassword = async (
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> => {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    "/auth/password/reset",
    payload,
    { withCredentials: true }
  );
  return data;
};
