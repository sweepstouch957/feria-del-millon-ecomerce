import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getMyProject,
  sendMyInventory,
  updateMyProject,
} from "@services/applications.service";
import { MAX_PROJECT_WORDS, countWords } from "@lib/artwork";

export const MY_PROJECT_KEY = ["my-project"] as const;

/* El proyecto del artista: lo guardado, el borrador en pantalla y el envío.

   Vive en un hook porque tres pantallas lo necesitan a la vez (los campos, la
   barra de acciones y la revisión final) y porque el envío es de una sola vez:
   quien decide si ya se envió tiene que ser uno solo. */
export function useMyProject(enabled = true) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: MY_PROJECT_KEY,
    queryFn: getMyProject,
    staleTime: 60_000,
    enabled,
  });

  const saved = query.data;

  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [dirty, setDirty] = useState(false);

  // Lo guardado manda: al llegar (o al refrescar) se reescribe el borrador.
  useEffect(() => {
    if (!saved) return;
    setTitle(saved.projectTitle || "");
    setReview(saved.projectReview || "");
    setDirty(false);
  }, [saved]);

  const words = countWords(review);
  const tooLong = words > MAX_PROJECT_WORDS;

  const save = useMutation({
    mutationFn: () => updateMyProject({ projectTitle: title, projectReview: review }),
    onSuccess: (p) => {
      qc.setQueryData(MY_PROJECT_KEY, { ...(saved ?? {}), ...p });
      setDirty(false);
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

  const editTitle = useCallback((v: string) => {
    setTitle(v);
    setDirty(true);
  }, []);

  const editReview = useCallback((v: string) => {
    setReview(v);
    setDirty(true);
  }, []);

  return {
    loading: query.isLoading,
    title,
    review,
    dirty,
    words,
    tooLong,
    editTitle,
    editReview,
    save,
    send,
    sentAt: saved?.inventorySentAt as string | undefined,
    /** Enviado = de acá en adelante se mira, no se toca. */
    locked: !!saved?.inventorySentAt,
    savedTitle: saved?.projectTitle as string | undefined,
  };
}
