"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, ImagePlus, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

import {
  createArtwork,
  patchArtwork,
  type CreateArtworkInput,
  type PatchArtworkDto,
} from "@services/artworks.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { uploadCampaignImage } from "@services/upload.service";
import { formatCOP } from "@lib/money";

import StudioSheet from "./StudioSheet";
import { EYEBROW, btnGhost, btnSolid, fieldHint, fieldInput, fieldLabel, hair, mix } from "./studioTheme";

/* Crear o editar una obra.

   La imagen manda: ocupa media hoja y debajo se ve, en chiquito, cómo va a
   quedar la ficha en el catálogo — es lo que va a leer quien compre, y verlo
   mientras se escribe evita títulos a medias y precios en blanco.

   El tag es del sistema: se genera con el QR al crear la obra, así que el
   artista no lo escribe (el backend ya ignoraba ese campo cuando venía de él). */

const CURRENT_YEAR = new Date().getFullYear();
const MAX_IMAGE_MB = 5;

const FormSchema = z.object({
  title: z.string().min(2, "Ponle un título a la obra"),

  price: z
    .union([z.coerce.number().int().min(0, "El precio no puede ser negativo"), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),

  currency: z.string().default("COP").optional(),

  image: z
    .string()
    .url("Esa dirección de imagen no es válida")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  description: z.string().optional(),

  year: z
    .union([
      z.coerce.number().int().min(1800, "Año muy antiguo").max(CURRENT_YEAR, `Como máximo ${CURRENT_YEAR}`),
      z.nan(),
      z.string().length(0),
    ])
    .optional()
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : undefined)),

  stock: z
    .union([z.coerce.number().int().min(0), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),

  dimensions: z.string().optional(),

  reproducible: z.boolean().optional(),

  technique: z.string().min(1, "Elige la técnica"),

  pavilion: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

/** Error debajo del campo al que pertenece. */
function FieldError({ msg }: { msg?: unknown }) {
  if (typeof msg !== "string" || !msg) return null;
  return (
    <p role="alert" style={{ ...fieldHint, color: "#B4472A" }}>
      {msg}
    </p>
  );
}

export default function CreateEditArtworkModal({
  open,
  onOpenChange,
  eventId,
  artistId,
  editingId,
  currentRows,
  techniqueOptions,
  pavilionOptions,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  artistId: string;
  editingId: string | null;
  currentRows: ArtworkRow[];
  techniqueOptions: Array<{ value: string; label: string }>;
  pavilionOptions: Array<{ value: string; label: string }>;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      currency: "COP",
      technique: "",
      price: undefined,
      year: undefined,
      stock: undefined,
      image: "",
      description: "",
      dimensions: "",
      reproducible: false,
      pavilion: "",
    } as Partial<FormValues>,
  });

  const imageUrl = watch("image");
  const isReproducible = watch("reproducible");
  const previewTitle = watch("title");
  const previewPrice = watch("price");
  const previewDims = watch("dimensions");
  const previewYear = watch("year");

  // Valor primitivo en vez del arreglo: si el padre re-renderiza, esto sigue
  // siendo el mismo string y el efecto de abajo no vuelve a resetear el
  // formulario a medio llenar.
  const soloPavilion = pavilionOptions?.length === 1 ? pavilionOptions[0].value : "";

  useEffect(() => {
    if (!editingId) {
      reset({
        title: "",
        price: undefined,
        currency: "COP",
        image: "",
        description: "",
        year: undefined,
        stock: undefined,
        dimensions: "",
        reproducible: false,
        technique: "",
        // Si el artista tiene un solo pabellón asignado, no tiene sentido
        // pedirle que lo elija: sus obras van ahí.
        pavilion: soloPavilion,
      });
      return;
    }

    const row = (currentRows || []).find((r) => r.id === editingId);
    if (!row) return;

    setValue("title", row.title || "");
    setValue("price", (row.price as any) ?? undefined);
    setValue("currency", row.currency || "COP");
    setValue("description", row.description || "");
    setValue("year", (row.year as any) ?? undefined);
    setValue("stock", (row.stock as any) ?? undefined);
    setValue("dimensions", (row as any)?.dimensionsText || "");
    setValue("reproducible", Boolean((row as any)?.reproducible));
    setValue("technique", ((row as any)?.techniqueInfo?._id || (row as any)?.technique || "") as any);
    setValue("pavilion", ((row as any)?.pavilionInfo?._id || (row as any)?.pavilion || "") as any);
    setValue("image", row.image || "");
  }, [editingId, currentRows, reset, setValue, soloPavilion]);

  const mCreate = useMutation({
    mutationFn: async (payload: CreateArtworkInput) => createArtwork(payload),
    onSuccess: () => {
      toast.success("Obra cargada");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "No se pudo cargar la obra"),
  });

  const mPatch = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: PatchArtworkDto }) =>
      patchArtwork(id, payload),
    onSuccess: (resp) => {
      toast.success("Obra actualizada");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork-detail", resp.doc.id] });
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "No se pudo actualizar la obra"),
  });

  const onSubmit = handleSubmit(async (form) => {
    const baseSlug = slugify(form.title);

    if (editingId) {
      const payload: PatchArtworkDto = {
        title: form.title,
        slug: baseSlug,
        description: form.description,
        price: form.price,
        currency: form.currency || "COP",
        stock: form.stock,
        reproducible: Boolean(form.reproducible),
        dimensionsText: form.dimensions || "",
        image: form.image,
        event: eventId,
        pavilion: form.pavilion || null,
        technique: form.technique,
        // El estado y la visibilidad son del equipo de la feria: lo que carga
        // el artista espera a que se publique el catálogo.
      };
      await mPatch.mutateAsync({ id: editingId, payload });
      return;
    }

    const createPayload: CreateArtworkInput = {
      event: eventId,
      artist: artistId,
      pavilion: form.pavilion || null,
      technique: form.technique,
      title: form.title,
      slug: baseSlug,
      year: form.year,
      description: form.description,
      price: form.price,
      currency: form.currency || "COP",
      stock: form.stock,
      reproducible: Boolean(form.reproducible),
      dimensionsText: form.dimensions || undefined,
      image: form.image,
    };
    await mCreate.mutateAsync(createPayload);
  });

  const onUploadFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Eso no es una imagen. Sube un JPG o un PNG.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(
        `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB: el máximo son ${MAX_IMAGE_MB} MB.`
      );
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("folder", "artworks");
      const res = await fetch("/upload", { method: "POST", body: form });
      const json = await res.json();
      if (json?.url) {
        setValue("image", json.url, { shouldValidate: true });
        return;
      }
      throw new Error("fallback");
    } catch {
      try {
        const r = await uploadCampaignImage(file!, "artworks");
        setValue("image", (r as any)?.url, { shouldValidate: true });
      } catch {
        toast.error("No se pudo subir la imagen");
      }
    } finally {
      setUploading(false);
    }
  };

  const busy = isSubmitting || mCreate.isPending || mPatch.isPending;

  return (
    <StudioSheet
      open={open}
      onClose={() => !busy && onOpenChange(false)}
      eyebrow={editingId ? "Editar obra" : "Nueva obra"}
      title={editingId ? "Editar la obra" : "Cargar una obra"}
      description="Imagen, título, dimensiones, técnica, precio y copias. Puedes editarla las veces que quieras hasta que envíes tu inventario."
      maxWidth={940}
      footer={
        <>
          <button type="button" style={btnGhost} onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" form="artwork-form" style={btnSolid} disabled={busy || uploading}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={1.8} />}
            {busy ? "Guardando…" : editingId ? "Guardar cambios" : "Cargar obra"}
          </button>
          <span style={{ ...EYEBROW, fontSize: 9, color: mix(46), marginLeft: "auto" }}>
            No se publica hasta que la feria publique el catálogo
          </span>
        </>
      }
    >
      <form
        id="artwork-form"
        onSubmit={onSubmit}
        noValidate
        style={{
          display: "grid",
          gap: "clamp(24px,3vw,38px)",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,290px),1fr))",
        }}
      >
        {/* ── Columna de la imagen ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span style={fieldLabel}>Imagen de la obra</span>
            <label
              htmlFor="artwork-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onUploadFile(e.dataTransfer.files?.[0]);
              }}
              style={{
                display: "grid",
                placeItems: "center",
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
                marginTop: 6,
                cursor: uploading ? "wait" : "pointer",
                background: mix(5),
                border: `1px ${dragging ? "solid" : "dashed"} ${dragging ? "var(--acc)" : mix(24)}`,
                overflow: "hidden",
                transition: "border-color .25s ease, background .25s ease",
                textTransform: "none",
                letterSpacing: "normal",
              }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Vista previa de la obra"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    color: mix(46),
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  <ImagePlus size={24} strokeWidth={1.2} />
                  <span style={{ fontSize: 13.5, lineHeight: 1.5, textTransform: "none", letterSpacing: "normal" }}>
                    Arrastra la foto acá
                    <br />o toca para buscarla
                  </span>
                </span>
              )}

              {uploading && (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "color-mix(in srgb, var(--bg) 78%, transparent)",
                    ...EYEBROW,
                    fontSize: 9.5,
                    color: "var(--acc)",
                  }}
                >
                  Subiendo…
                </span>
              )}
            </label>
            <input
              id="artwork-file"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onUploadFile(e.target.files?.[0])}
            />
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 10 }}>
              <label
                htmlFor="artwork-file"
                style={{ ...btnGhost, height: 34, padding: "0 16px", cursor: "pointer" }}
              >
                <Upload size={13} strokeWidth={1.6} />
                {imageUrl ? "Cambiar" : "Subir imagen"}
              </label>
              <span style={{ ...fieldHint, margin: 0 }}>JPG o PNG, máximo {MAX_IMAGE_MB} MB.</span>
            </div>
          </div>

          <div>
            <label htmlFor="artwork-image-url" style={fieldLabel}>
              …o pega una dirección
            </label>
            <input id="artwork-image-url" {...register("image")} placeholder="https://…" style={fieldInput} />
            <FieldError msg={errors.image?.message} />
          </div>

          {/* Cómo va a quedar en el catálogo */}
          <div style={{ paddingTop: 16, borderTop: hair(14) }}>
            <span style={{ ...EYEBROW, fontSize: 9, color: mix(44), display: "block", marginBottom: 10 }}>
              Así se ve en el catálogo
            </span>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 62,
                  aspectRatio: "1",
                  flexShrink: 0,
                  background: mix(8),
                  border: `1px solid ${mix(12)}`,
                  overflow: "hidden",
                }}
              >
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.3 }}>
                  {previewTitle || <span style={{ color: mix(38) }}>Título de la obra</span>}
                </p>
                <p style={{ ...EYEBROW, fontSize: 9, color: mix(46), margin: "6px 0 0" }}>
                  {[previewYear, previewDims].filter(Boolean).join(" · ") || "Año · dimensiones"}
                </p>
                <p style={{ margin: "7px 0 0", fontSize: 14, fontVariantNumeric: "tabular-nums", color: mix(80) }}>
                  {typeof previewPrice === "number" && !Number.isNaN(previewPrice)
                    ? formatCOP(previewPrice, { currency: "COP" })
                    : <span style={{ color: mix(38) }}>Sin precio</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Columna de los datos ──────────────────────────────────────── */}
        <div style={{ display: "grid", gap: "clamp(18px,2.2vw,24px)", alignContent: "start" }}>
          <div>
            <label htmlFor="artwork-title" style={fieldLabel}>
              Título *
            </label>
            <input
              id="artwork-title"
              {...register("title")}
              placeholder="Nombre de la obra"
              aria-invalid={!!errors.title}
              style={fieldInput}
            />
            <FieldError msg={errors.title?.message} />
          </div>

          <div style={{ display: "grid", gap: "clamp(18px,2.2vw,24px)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))" }}>
            <div>
              <label htmlFor="artwork-technique" style={fieldLabel}>
                Técnica *
              </label>
              <select
                id="artwork-technique"
                {...register("technique")}
                aria-invalid={!!errors.technique}
                style={fieldInput}
              >
                <option value="">Elige una</option>
                {(techniqueOptions || []).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.technique?.message} />
            </div>

            <div>
              <label htmlFor="artwork-year" style={fieldLabel}>
                Año
              </label>
              <input
                id="artwork-year"
                type="number"
                inputMode="numeric"
                {...register("year")}
                placeholder={`${CURRENT_YEAR}`}
                style={fieldInput}
              />
              <FieldError msg={errors.year?.message as string} />
            </div>
          </div>

          <div>
            <label htmlFor="artwork-dimensions" style={fieldLabel}>
              Dimensiones
            </label>
            <input
              id="artwork-dimensions"
              {...register("dimensions")}
              placeholder="42.3 cm x 34.5 cm"
              style={fieldInput}
            />
          </div>

          {/* Un solo pabellón no es una pregunta */}
          {pavilionOptions.length > 1 ? (
            <div>
              <label htmlFor="artwork-pavilion" style={fieldLabel}>
                Pabellón
              </label>
              <select id="artwork-pavilion" {...register("pavilion")} style={fieldInput}>
                <option value="">Sin pabellón</option>
                {(pavilionOptions || []).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" {...register("pavilion")} />
          )}

          <div style={{ display: "grid", gap: "clamp(18px,2.2vw,24px)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))" }}>
            <div>
              <label htmlFor="artwork-price" style={fieldLabel}>
                Precio en pesos
              </label>
              <input
                id="artwork-price"
                type="number"
                inputMode="numeric"
                {...register("price")}
                placeholder="1200000"
                style={fieldInput}
              />
              <FieldError msg={errors.price?.message as string} />
            </div>

            <div>
              <label htmlFor="artwork-stock" style={fieldLabel}>
                {isReproducible ? "N.º de copias" : "Cantidad"}
              </label>
              <input
                id="artwork-stock"
                type="number"
                inputMode="numeric"
                {...register("stock")}
                placeholder="1"
                style={fieldInput}
              />
              <p style={fieldHint}>
                {isReproducible
                  ? "Copias a la venta, máximo 10 por serie. Cada compra descuenta una."
                  : "Obra única: deja 1."}
              </p>
            </div>
          </div>

          <label
            className="fdm-studio-check"
            style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}
          >
            <input type="checkbox" {...register("reproducible")} style={{ marginTop: 3, width: 15, height: 15 }} />
            <span>
              Es una reproducción (serigrafía, grabado, impresión…). La cantidad pasa a ser el
              número de copias.
            </span>
          </label>

          <div>
            <label htmlFor="artwork-description" style={fieldLabel}>
              Descripción
            </label>
            <textarea
              id="artwork-description"
              {...register("description")}
              rows={5}
              placeholder="Qué es, de qué está hecha, qué cuenta…"
              style={fieldInput}
            />
          </div>
        </div>
      </form>
    </StudioSheet>
  );
}
