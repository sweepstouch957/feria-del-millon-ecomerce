"use client";

import Image from "next/image";
import { AlertCircle, Check } from "lucide-react";

import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { formatCOP } from "@lib/money";
import { missingFields } from "@lib/artwork";
import InventoryQrCards from "./InventoryQrCards";
import { BODY, EYEBROW, hair, mix } from "./studioTheme";
import { Eyebrow, StudioButton } from "./ui";

/* Paso 3: revisar antes de entregar.

   Lo que se envía no se puede cambiar, así que acá se ve todo junto: el
   proyecto, cuántas obras van y qué le falta a cada una. Las faltas se dicen
   por obra —sin precio, sin imagen, sin dimensiones— porque es lo que la feria
   va a necesitar para armar el stand y la etiqueta. */

type Gap = { id: string; title: string; missing: string[] };

const gapsOf = (rows: ArtworkRow[]): Gap[] =>
  rows
    .map((r) => ({ id: r.id, title: r.title, missing: missingFields(r as any) }))
    .filter((g) => g.missing.length > 0);

export default function ReviewPanel({
  rows,
  projectTitle,
  projectReview,
  pavilionName,
  artistId,
  sentAt,
  onFix,
}: {
  rows: ArtworkRow[];
  projectTitle: string;
  projectReview: string;
  pavilionName?: string;
  artistId: string;
  sentAt?: string;
  onFix?: (id: string) => void;
}) {
  const gaps = gapsOf(rows);
  const delivered = !!sentAt;

  const facts: Array<[string, string]> = [
    ["Proyecto", projectTitle || "Sin título todavía"],
    ["Pabellón", pavilionName || "Sin pabellón"],
    ["Obras", `${rows.length}`],
    [
      "Precio total",
      formatCOP(
        rows.reduce((a, r) => a + (typeof r.price === "number" ? r.price : 0), 0),
        { currency: "COP" }
      ),
    ],
  ];

  return (
    <div style={{ display: "grid", gap: "clamp(26px,3vw,38px)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
        <h2
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: "clamp(26px,3.2vw,40px)",
            lineHeight: 1.03,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {delivered ? "Inventario entregado" : "Revisa y envía"}
        </h2>
        <p style={{ ...BODY, maxWidth: "54ch" }}>
          {delivered
            ? `Lo enviaste el ${new Date(sentAt as string).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}. Si necesitas cambiar una obra, escríbele a la feria.`
            : "Esto es lo que va a recibir la feria. Se envía una sola vez: después no vas a poder editarlo por tu cuenta."}
        </p>
      </div>

      {/* Resumen */}
      <dl
        style={{
          margin: 0,
          display: "grid",
          gap: 0,
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))",
          borderTop: hair(16),
          borderBottom: hair(16),
        }}
      >
        {facts.map(([k, v]) => (
          <div key={k} style={{ padding: "16px 20px 16px 0" }}>
            <dt style={{ ...EYEBROW, fontSize: 9, color: mix(44), marginBottom: 7 }}>{k}</dt>
            <dd
              style={{
                margin: 0,
                fontSize: "clamp(16px,1.8vw,19px)",
                lineHeight: 1.25,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {projectReview && (
        <p
          style={{
            margin: 0,
            maxWidth: "62ch",
            fontSize: 14.5,
            lineHeight: 1.75,
            color: mix(74),
            whiteSpace: "pre-line",
          }}
        >
          {projectReview}
        </p>
      )}

      {/* Qué le falta a cada obra */}
      {!delivered && (
        <div>
          <span style={{ ...EYEBROW, fontSize: 9.5, color: gaps.length ? "#B4472A" : "var(--acc)", display: "flex", alignItems: "center", gap: 7 }}>
            {gaps.length ? <AlertCircle size={13} strokeWidth={1.8} /> : <Check size={13} strokeWidth={2.2} />}
            {gaps.length
              ? `${gaps.length} ${gaps.length === 1 ? "obra incompleta" : "obras incompletas"}`
              : "Todas las obras están completas"}
          </span>

          {gaps.length > 0 && (
            <>
              <p style={{ ...BODY, margin: "12px 0 0", maxWidth: "56ch", fontSize: 13.5 }}>
                Puedes enviar igual, pero a la feria le va a faltar ese dato para la etiqueta y
                para el catálogo.
              </p>
              <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, borderTop: hair(12) }}>
                {gaps.map((g) => (
                  <li
                    key={g.id}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: hair(10),
                    }}
                  >
                    <span style={{ flex: "1 1 180px", fontSize: 14.5, minWidth: 0 }}>{g.title}</span>
                    <Eyebrow tone="bad" size={9}>
                      Falta {g.missing.join(" · ")}
                    </Eyebrow>
                    {onFix && (
                      <StudioButton
                        variant="link"
                        onClick={() => onFix(g.id)}
                        style={{ marginLeft: "auto", color: "var(--acc)" }}
                      >
                        Completar
                      </StudioButton>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Las obras que van, en miniatura */}
      {rows.length > 0 && (
        <div>
          <span style={{ ...EYEBROW, fontSize: 9, color: mix(44), display: "block", marginBottom: 12 }}>
            {delivered ? "Lo que entregaste" : "Lo que vas a enviar"}
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {rows.map((r) => (
              <div
                key={r.id}
                title={r.title}
                style={{
                  width: "clamp(64px,8vw,82px)",
                  aspectRatio: "1",
                  position: "relative",
                  background: mix(7),
                  border: `1px solid ${mix(12)}`,
                  overflow: "hidden",
                }}
              >
                {r.image && <Image src={r.image} alt={r.title} fill sizes="82px" style={{ objectFit: "cover" }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entregado: sus dos QR para el stand */}
      {delivered && (
        <div style={{ paddingTop: "clamp(22px,2.8vw,32px)", borderTop: hair(16) }}>
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
    </div>
  );
}
