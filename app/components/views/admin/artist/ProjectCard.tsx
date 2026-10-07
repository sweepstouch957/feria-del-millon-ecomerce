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
import InventoryQrCards from "./InventoryQrCards";

/* El proyecto con el que el artista expone: título y descripción.
   Va arriba de las obras porque es lo que las agrupa — las obras son las piezas
   de ESTE proyecto. Y desde acá se avisa a la feria que ya quedó todo cargado. */

const MAX_WORDS = 250;
const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function ProjectCard({
  artistId,
  artworkCount,
  pavilionName,
}: {
  artistId: string;
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
      toast.success("Inventario enviado. Ya tienes tus QR.");
    },
    onError: (e: any) => {
      // Enviar es de una sola vez: si ya estaba enviado, el servidor lo dice.
      const sent = e?.response?.data?.inventorySentAt;
      if (sent) {
        qc.setQueryData(["my-project"], { ...(data ?? {}), inventorySentAt: sent });
        toast.error("Ya habías enviado tu inventario");
        return;
      }
      toast.error("No se pudo avisar a la feria");
    },
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

            {/* Enviar es de una sola vez: es el catálogo con el que la feria
                arma el stand. Después del envío el botón ya no está. */}
            {!sentAt && (
              <Button
                variant="outline"
                onClick={() => {
                  if (!artworkCount) {
                    toast.error("Carga al menos una obra antes de enviar.");
                    return;
                  }
                  if (
                    !window.confirm(
                      `Vas a enviar ${artworkCount} ${artworkCount === 1 ? "obra" : "obras"} a la Feria. Se envía una sola vez: después no podrás cambiarlo por tu cuenta. ¿Seguimos?`
                    )
                  )
                    return;
                  send.mutate();
                }}
                disabled={send.isPending}
              >
                {send.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar mi inventario
              </Button>
            )}

            <span className="text-xs text-gray-500">
              {artworkCount} {artworkCount === 1 ? "obra cargada" : "obras cargadas"} ·{" "}
              {sentAt
                ? "ya enviado. Si necesitas cambiar algo, escríbele a la feria."
                : "nada se publica hasta que la Feria publique el catálogo."}
            </span>
          </div>

          {/* Entregado: sus dos QR para el stand */}
          {sentAt && (
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div>
                <p className="text-sm font-semibold">Tus códigos QR</p>
                <p className="text-xs text-gray-500">
                  Descárgalos e imprímelos para tu stand: quien los escanee ve tu obra y puede
                  comprarla.
                </p>
              </div>
              <InventoryQrCards artistId={artistId} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
