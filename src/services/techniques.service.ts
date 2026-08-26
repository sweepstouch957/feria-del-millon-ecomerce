/* eslint-disable @typescript-eslint/no-explicit-any */
// services/catalog/techniques.service.ts

import apiClient from "src/http/axios";


export interface TechniqueDoc {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
  order?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeId = <T extends { id?: string; _id?: string }>(obj: T) => ({
  ...obj,
  id: obj.id || (obj as any)._id,
});

/** GET /catalogs/techniques  (active=true, sort by order asc) */
export const listTechniques = async (): Promise<TechniqueDoc[]> => {
  const { data } = await apiClient.get<TechniqueDoc[]>(
    "/catalogs/techniques",
    { withCredentials: true }
  );
  return (data || []).map(normalizeId);
};
