"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Send } from "lucide-react";
import { toast } from "sonner";

import {
  getMyProject,
  sendMyInventory,
  updateMyProject,
} from "@services/applications.service";
import InventoryQrCards from "./InventoryQrCards";
import StudioSheet from "./StudioSheet";
import {
  BODY,
  EYEBROW,
  btnGhost,
  btnSolid,
  fieldHint,
  fieldInput,
  fieldLabel,
  hair,
  mix,
} from "./studioTheme";

/* El proyecto con el que el artista expone, y el envío a la feria.

   Va debajo de las obras porque es el cierre: primero se carga la obra, que es
   lo que lleva tiempo, después se cuenta de qué va y se entrega. Enviar es de
   una sola vez, así que se confirma antes y después queda todo en solo lectura. */

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
  const [confirming, setConfirming] = useState(false);

  // Lo guardado manda: al llegar (o al refrescar) se reescriben los campos.
  useEffect(() => {
    if (!data) return;
    setTitle(data.projectTitle || "");
    setReview(data.projectReview || "");
    setTouched(false);
  }, [data]);

  const words = countWords(review);
  const tooLong = words > MAX_WORDS;
  const sentAt = data?.inventorySentAt;
  const locked = !!sentAt;

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
      setConfirming(false);
      toast.success("Inventario enviado. Ya tienes tus QR.");
    },
    onError: (e: any) => {
      // Enviar es de una sola vez: si ya estaba enviado, el servidor lo dice.
      const sent = e?.response?.data?.inventorySentAt;
      setConfirming(false);
      if (sent) {
        qc.setQueryData(["my-project"], { ...(data ?? {}), inventorySentAt: sent });
        toast.error("Ya habías enviado tu inventario");
        return;
      }
      toast.error("No se pudo avisar a la feria");
    },
  });

  const tryToSend = () => {
    if (!artworkCount) {
      toast.error("Carga al menos una obra antes de enviar.");
      return;
    }
    if (touched) {
      toast.error("Guarda el proyecto antes de enviarlo.");
      return;
    }
    if (!title.trim()) {
      toast.error("Ponle título a tu proyecto antes de enviarlo.");
      return;
    }
    setConfirming(true);
  };

  if (isLoading) {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: "clamp(26px,3vw,38px)", borderTop: hair(20) }}>
        <div className="fdm-skel" style={{ width: 110, height: 10 }} />
        <div className="fdm-skel" style={{ width: "min(340px,60%)", height: 28 }} />
        <div className="fdm-skel" style={{ width: "100%", height: 120 }} />
      </section>
    );
  }

  return (
    <section style={{ paddingTop: "clamp(26px,3vw,38px)", borderTop: hair(20) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: "clamp(22px,2.6vw,32px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: "min(100%,280px)" }}>
          <span style={{ ...EYEBROW, color: "var(--acc)" }}>
            {locked ? "Proyecto entregado" : "Paso final"}
          </span>
          <h2
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: "clamp(23px,2.8vw,34px)",
              lineHeight: 1.05,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            Mi proyecto
          </h2>
          <p style={{ ...BODY, maxWidth: "54ch" }}>
            Con qué participas en la feria. Las obras de arriba son las piezas de
            este proyecto.
          </p>
        </div>

        {locked && (
          <span
            style={{
              ...EYEBROW,
              fontSize: 9.5,
              padding: "7px 14px",
              border: "1px solid var(--acc)",
              color: "var(--acc)",
              whiteSpace: "nowrap",
            }}
          >
            Enviado el {new Date(sentAt as string).toLocaleDateString("es-CO")}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: "clamp(20px,2.6vw,30px)", maxWidth: 760 }}>
        <div>
          <label htmlFor="project-title" style={fieldLabel}>
            Título del proyecto
          </label>
          <input
            id="project-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTouched(true);
            }}
            placeholder="Nombre del proyecto o serie"
            maxLength={160}
            disabled={locked}
            style={{ ...fieldInput, opacity: locked ? 0.55 : 1 }}
          />
        </div>

        <div>
          <label htmlFor="project-review" style={fieldLabel}>
            Descripción del proyecto
          </label>
          <textarea
            id="project-review"
            value={review}
            onChange={(e) => {
              setReview(e.target.value);
              setTouched(true);
            }}
            placeholder="De qué trata, qué lo une, qué quieres que vea quien se pare enfrente…"
            rows={7}
            disabled={locked}
            aria-describedby="project-words"
            style={{ ...fieldInput, opacity: locked ? 0.55 : 1 }}
          />
          <p
            id="project-words"
            aria-live="polite"
            style={{ ...fieldHint, color: tooLong ? "#B4472A" : mix(50) }}
          >
            {words} de {MAX_WORDS} palabras
            {tooLong ? " · te pasaste, recorta antes de guardar" : ""}
          </p>
        </div>

        {!locked && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              style={{ ...btnGhost, opacity: save.isPending || tooLong || !touched ? 0.45 : 1 }}
              onClick={() => save.mutate()}
              disabled={save.isPending || tooLong || !touched}
            >
              <Check size={14} strokeWidth={1.8} />
              {save.isPending ? "Guardando…" : touched ? "Guardar proyecto" : "Guardado"}
            </button>

            <button type="button" style={btnSolid} onClick={tryToSend} disabled={send.isPending}>
              <Send size={14} strokeWidth={1.8} />
              {send.isPending ? "Enviando…" : "Enviar mi inventario"}
            </button>

            <span style={{ ...EYEBROW, fontSize: 9.5, color: mix(50), lineHeight: 1.5 }}>
              {artworkCount} {artworkCount === 1 ? "obra cargada" : "obras cargadas"} · nada se
              publica hasta que la feria publique el catálogo
            </span>
          </div>
        )}
      </div>

      {/* Entregado: sus dos QR para el stand */}
      {locked && (
        <div style={{ marginTop: "clamp(30px,3.6vw,46px)", paddingTop: "clamp(24px,3vw,34px)", borderTop: hair(14) }}>
          <span style={{ ...EYEBROW, color: "var(--acc)", display: "block", marginBottom: 9 }}>
            Para imprimir
          </span>
          <h3 style={{ margin: 0, fontWeight: 400, fontSize: "clamp(18px,2vw,23px)", letterSpacing: "0.01em" }}>
            Tus códigos QR
          </h3>
          <p style={{ ...BODY, marginTop: 8, maxWidth: "56ch" }}>
            Descárgalos e imprímelos para tu stand: quien los escanee ve tu obra y
            puede comprarla ahí mismo.
          </p>
          <div style={{ marginTop: 22 }}>
            <InventoryQrCards artistId={artistId} />
          </div>
        </div>
      )}

      {/* Confirmar el envío: es irreversible, así que se dice con números */}
      <StudioSheet
        open={confirming}
        onClose={() => !send.isPending && setConfirming(false)}
        eyebrow="Se envía una sola vez"
        title="¿Enviamos tu inventario?"
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              style={btnGhost}
              onClick={() => setConfirming(false)}
              disabled={send.isPending}
            >
              Todavía no
            </button>
            <button
              type="button"
              style={btnSolid}
              onClick={() => send.mutate()}
              disabled={send.isPending}
            >
              <Send size={14} strokeWidth={1.8} />
              {send.isPending ? "Enviando…" : "Sí, enviar"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ ...BODY, color: mix(80) }}>
            Vas a enviarle a la feria{" "}
            <strong style={{ fontWeight: 500, color: "var(--fg)" }}>
              {artworkCount} {artworkCount === 1 ? "obra" : "obras"}
            </strong>
            {title ? (
              <>
                {" "}del proyecto{" "}
                <strong style={{ fontWeight: 500, color: "var(--fg)" }}>{title}</strong>
              </>
            ) : null}
            .
          </p>
          <div style={{ display: "grid", gap: 10, padding: "16px 0", borderTop: hair(14), borderBottom: hair(14) }}>
            {[
              "Después de enviar no vas a poder editar tus obras por tu cuenta.",
              "La feria recibe el aviso y revisa tu inventario.",
              "Te quedan tus dos códigos QR para imprimir y poner en el stand.",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 4,
                    background: "var(--acc)",
                    marginTop: 8,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13.5, lineHeight: 1.6, color: mix(70) }}>{t}</span>
              </div>
            ))}
          </div>
          <p style={{ ...EYEBROW, fontSize: 9.5, color: mix(48), margin: 0 }}>
            Si falta una obra, cierra esto y cárgala primero.
          </p>
        </div>
      </StudioSheet>
    </section>
  );
}
