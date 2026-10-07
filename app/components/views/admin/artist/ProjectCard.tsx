"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  getMyProject,
  sendMyInventory,
  updateMyProject,
} from "@services/applications.service";

/* El proyecto con el que el artista expone: título y descripción.
   Va arriba de las obras porque es lo que las agrupa — las obras son las piezas
   de ESTE proyecto. Y desde acá se avisa a la feria que ya quedó todo cargado. */

const MAX_WORDS = 250;
const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function ProjectCard({
  artworkCount,
  pavilionName,
}: {
  artworkCount: number;
  pavilionName?: string;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-project"],
    queryFn: getMyProject,
    staleTime: 60_000,
  });

  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [touched, setTouched] = useState(false);

  // Lo guardado manda: al llegar (o al refrescar) se reescriben los campos.
  useEffect(() => {
    if (!data) return;
    setTitle(data.projectTitle || "");
    setReview(data.projectReview || "");
    setTouched(false);
  }, [data]);

  const words = countWords(review);
  const tooLong = words > MAX_WORDS;

  const save = useMutation({
    mutationFn: () => updateMyProject({ projectTitle: title, projectReview: review }),
    onSuccess: (p) => {
      qc.setQueryData(["my-project"], { ...(data ?? {}), ...p });
      setTouched(false);
      toast.success("Proyecto guardado");
    },
    onError: () => toast.error("No se pudo guardar el proyecto"),
  });

  const send = useMutation({
    mutationFn: () => sendMyInventory({ artworkCount, pavilionName }),
    onSuccess: (r) => {
      qc.setQueryData(["my-project"], { ...(data ?? {}), inventorySentAt: r.inventorySentAt });
      toast.success("Listo: la feria ya tiene tu inventario");
    },
    onError: () => toast.error("No se pudo avisar a la feria"),
  });

  const sentAt = data?.inventorySentAt;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Mi proyecto</h2>
          <p className="text-sm text-gray-600">
            Con qué participas en la feria. Las obras de abajo son las piezas de este
            proyecto.
          </p>
        </div>
        {sentAt && (
          <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1">
            Enviado el {new Date(sentAt).toLocaleDateString("es-CO")}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-6 grid place-items-center text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <label className="text-sm text-gray-600">Título del proyecto</label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTouched(true);
              }}
              placeholder="Nombre del proyecto o serie"
              maxLength={160}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Descripción del proyecto
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 min-h-[140px]"
              value={review}
              onChange={(e) => {
                setReview(e.target.value);
                setTouched(true);
              }}
              placeholder="De qué trata, qué lo une, qué quieres que vea quien se pare enfrente…"
            />
            <p className={`mt-1 text-[11px] ${tooLong ? "text-red-600" : "text-gray-500"}`}>
              {words} de {MAX_WORDS} palabras{tooLong ? " · te pasaste" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || tooLong || !touched}
            >
              {save.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar proyecto
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!artworkCount) {
                  toast.error("Carga al menos una obra antes de enviar.");
                  return;
                }
                send.mutate();
              }}
              disabled={send.isPending}
            >
              {send.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {sentAt ? "Volver a avisar a la feria" : "Enviar mi inventario"}
            </Button>

            <span className="text-xs text-gray-500">
              {artworkCount} {artworkCount === 1 ? "obra cargada" : "obras cargadas"} · nada se
              publica hasta que la Feria publique el catálogo.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
