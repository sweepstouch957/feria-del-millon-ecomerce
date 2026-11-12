"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createApplication } from "@services/applications.service";
import { Bone } from "@components/views/admin/artist/ui";
import { Alert, ApplyShell, Ico, Journey } from "./applyUi";

interface Convocatoria {
  _id: string;
  name: string;
  fee: number;
  status: string;
}

const cop = (n?: number) => (n ? "$ " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "Sin costo");

/** Primer paso con sesión: elegir a qué convocatoria se postula. Cada una es
 *  un botón grande con su nombre y su valor; si hay una sola, ya viene elegida. */
export function ConvocatoriaPicker({ onCreated }: { onCreated: (doc: any) => void }) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  const { data: convocatorias = [], isLoading } = useQuery({
    queryKey: ["convocatorias"],
    queryFn: async () => {
      const { getConvocatorias } = await import("@services/events.service");
      const res: Array<Convocatoria> = await getConvocatorias();
      return (res || []).filter((c) => c.status === "open");
    },
  });

  // Una sola convocatoria abierta no es una pregunta.
  useEffect(() => {
    if (!selected && convocatorias.length === 1) setSelected(convocatorias[0]._id);
  }, [convocatorias, selected]);

  const createMutation = useMutation({
    mutationFn: (id: string) => createApplication(id),
    onSuccess: (doc) => onCreated(doc),
    onError: (e: any) => setError(e?.response?.data?.error || "No pudimos crear tu postulación. Inténtalo de nuevo."),
  });

  const handleCreate = () => {
    if (!selected) return;
    setError("");
    createMutation.mutate(selected);
  };

  return (
    <ApplyShell narrow>
      <Journey current={1} />
      <div className="fdm-ap-head">
        <span className="fdm-st-eyebrow">Empieza tu postulación</span>
        <h1 className="fdm-st-h1">¿A cuál te quieres postular?</h1>
        <p className="fdm-st-lead">Elige la convocatoria o el salón. Después pagas la inscripción y subes tu proyecto.</p>
      </div>

      {error && <Alert tone="bad">{error}</Alert>}

      {isLoading ? (
        <Bone h={72} style={{ borderRadius: 16 }} />
      ) : convocatorias.length === 0 ? (
        <div className="fdm-st-empty" style={{ padding: "40px 20px" }}>
          <b>No hay convocatorias abiertas</b>
          En este momento no se están recibiendo postulaciones.
          <Link href="/convocatoria" className="fdm-st-btn" style={{ marginTop: 8 }}>Ver la convocatoria</Link>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Convocatorias abiertas" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {convocatorias.map((c) => (
              <button key={c._id} type="button" className="fdm-ap-opt fdm-studio-plain" aria-pressed={selected === c._id} onClick={() => setSelected(c._id)}>
                <span className="fdm-ap-radio" />
                <span className="k">
                  {c.name}
                  <small>Inscripción</small>
                </span>
                <span className="p">{cop(c.fee)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="fdm-st-btn is-green is-lg fdm-studio-plain" disabled={!selected || createMutation.isPending} onClick={handleCreate}>
            {createMutation.isPending ? "Creando tu postulación…" : <>Continuar al pago<Ico name="arrow" /></>}
          </button>
        </>
      )}
    </ApplyShell>
  );
}
