"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createApplication } from "@services/applications.service";

interface Convocatoria {
  _id: string;
  name: string;
  fee: number;
  status: string;
}

export function ConvocatoriaPicker({ onCreated }: { onCreated: (doc: any) => void }) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  const { data: convocatorias = [] } = useQuery({
    queryKey: ["convocatorias"],
    queryFn: async () => {
      const { getConvocatorias } = await import("@services/events.service");
      const res: Array<Convocatoria> = await getConvocatorias();
      return (res || []).filter((c) => c.status === "open");
    }
  });

  const createMutation = useMutation({
    mutationFn: (id: string) => createApplication(id),
    onSuccess: (doc) => onCreated(doc),
    onError: (e: any) => setError(e?.response?.data?.error || e?.message || "Error al crear"),
  });

  const handleCreate = async () => {
    if (!selected) return;
    setError("");
    await createMutation.mutateAsync(selected);
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="picker-page w-full">
        <div className="picker-card">
          <h2>Selecciona la convocatoria</h2>
          <p>Elige la convocatoria o salón al que deseas postular:</p>
          {error && <div className="picker-error">{error}</div>}
          {convocatorias.length === 0 ? (
            <p className="picker-empty">No hay convocatorias abiertas en este momento.</p>
          ) : (
            <>
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className="picker-select">
                <option value="">— Selecciona —</option>
                {convocatorias.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} · ${c.fee?.toLocaleString()} COP
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                disabled={!selected || createMutation.isPending}
                className="picker-btn"
              >
                {createMutation.isPending ? "Creando postulación…" : "Continuar →"}
              </button>
            </>
          )}
        </div>
        <style jsx>{`
          .picker-page {
            padding: 24px;
            font-family: "Inter", sans-serif;
            display: flex;
            justify-content: center;
          }
          .picker-card {
            background: #0a0a0a;
            border: 1px solid #222;
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(255, 255, 255, 0.02);
            text-align: center;
          }
          .picker-card h2 {
            font-size: 24px;
            font-weight: 800;
            color: #fff;
            margin: 0 0 8px;
          }
          .picker-card p {
            color: #888;
            margin: 0 0 24px;
          }
          .picker-error {
            background: rgba(220, 38, 38, 0.1);
            border: 1px solid #ef4444;
            color: #ef4444;
            padding: 12px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 16px;
          }
          .picker-empty {
            color: #666;
            font-style: italic;
          }
          .picker-select {
            width: 100%;
            padding: 12px;
            border: 1.5px solid #333;
            border-radius: 100px;
            font-size: 14px;
            margin-bottom: 16px;
            background: #111;
            color: #fff;
          }
          .picker-select:focus {
            border-color: #fff;
            outline: none;
          }
          .picker-btn {
            width: 100%;
            background: #fff;
            color: #000;
            border: none;
            border-radius: 100px;
            padding: 14px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }
          .picker-btn:hover:not(:disabled) {
            background: #eee;
          }
          .picker-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}
