import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getMyProject,
  sendMyInventory,
  updateMyProject,
} from "@services/applications.service";
import type { ProjectFormValues } from "@validators/project";

export const MY_PROJECT_KEY = ["my-project"] as const;

/* El proyecto del artista: lo guardado y el envío.

   El borrador de los campos es de Formik; acá sólo vive lo que viene y va al
   servidor. Y el envío, que es de una sola vez: quien decide si ya se envió
   tiene que ser uno solo, porque lo preguntan la barra de acciones, el índice
   de pasos y la revisión final. */
export function useMyProject(enabled = true) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: MY_PROJECT_KEY,
    queryFn: getMyProject,
    staleTime: 60_000,
    enabled,
  });

  const saved = query.data;

  const initialValues: ProjectFormValues = useMemo(
    () => ({ title: saved?.projectTitle || "", review: saved?.projectReview || "" }),
    [saved?.projectTitle, saved?.projectReview]
  );

  const save = useMutation({
    mutationFn: (v: ProjectFormValues) =>
      updateMyProject({ projectTitle: v.title, projectReview: v.review }),
    onSuccess: (p) => {
      qc.setQueryData(MY_PROJECT_KEY, { ...(saved ?? {}), ...p });
      toast.success("Proyecto guardado");
    },
    onError: () => toast.error("No se pudo guardar el proyecto"),
  });

  const send = useMutation({
    mutationFn: (vars: { artworkCount: number; pavilionName?: string }) => sendMyInventory(vars),
    onSuccess: (r) => {
      qc.setQueryData(MY_PROJECT_KEY, { ...(saved ?? {}), inventorySentAt: r.inventorySentAt });
      toast.success("Inventario enviado. Ya tienes tus QR.");
    },
    onError: (e: any) => {
      // Enviar es de una sola vez: si ya estaba enviado, el servidor lo dice.
      const already = e?.response?.data?.inventorySentAt;
      if (already) {
        qc.setQueryData(MY_PROJECT_KEY, { ...(saved ?? {}), inventorySentAt: already });
        toast.error("Ya habías enviado tu inventario");
        return;
      }
      toast.error("No se pudo avisar a la feria");
    },
  });

  return {
    loading: query.isLoading,
    /** Lo guardado, listo para abrir el formulario. */
    initialValues,
    save,
    send,
    sentAt: saved?.inventorySentAt as string | undefined,
    /** Enviado = de acá en adelante se mira, no se toca. */
    locked: !!saved?.inventorySentAt,
    savedTitle: saved?.projectTitle as string | undefined,
    savedReview: saved?.projectReview as string | undefined,
  };
}
