"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch, type Control, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  createArtwork,
  patchArtwork,
  type CreateArtworkInput,
  type PatchArtworkDto,
} from "@services/artworks.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { useImageUpload } from "@hooks/artist/useImageUpload";
import { MAX_COPIES, MAX_IMAGE_MB, slugify } from "@lib/artwork";
import { formatCOP } from "@lib/money";

import StudioSheet from "./StudioSheet";
import { Eyebrow, Field, StudioButton } from "./ui";
import { fieldInput, hair, mix } from "./studioTheme";

/* Crear o editar una obra.

   Un cuidado que costó caro: el formulario se rellena cuando el modal se ABRE,
   no cada vez que cambia la lista de obras del estudio. Antes dependía de esa
   lista, y como react-query la refresca sola al volver a la pestaña, lo que el
   artista llevaba escrito se borraba solo a mitad de carga.

   El tag es del sistema: se genera con el QR al crear la obra. */

const CURRENT_YEAR = new Date().getFullYear();

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

const EMPTY: Partial<FormValues> = {
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
};

/* La ficha de cómo va a quedar en el catálogo.

   Es un componente aparte y se suscribe sola a los campos que muestra: si el
   formulario entero escuchara el título para pintar esta ficha, cada tecla
   redibujaría los quince campos. */
function CatalogPreview({ control, image }: { control: Control<FormValues>; image?: string }) {
  const [title, price, dimensions, year] = useWatch({
    control,
    name: ["title", "price", "dimensions", "year"],
  });

  return (
    <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
      <div
        style={{
          width: 58,
          aspectRatio: "1",
          flexShrink: 0,
          background: mix(8),
          border: `1px solid ${mix(12)}`,
          overflow: "hidden",
        }}
      >
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.3 }}>
          {title || <span style={{ color: mix(38) }}>Título de la obra</span>}
        </p>
        <p style={{ margin: "6px 0 0" }}>
          <Eyebrow tone="faint" size={9}>
            {[year, dimensions].filter(Boolean).join(" · ") || "Año · dimensiones"}
          </Eyebrow>
        </p>
        <p style={{ margin: "7px 0 0", fontSize: 14, fontVariantNumeric: "tabular-nums", color: mix(80) }}>
          {typeof price === "number" && !Number.isNaN(price) ? (
            formatCOP(price, { currency: "COP" })
          ) : (
            <span style={{ color: mix(38) }}>Sin precio</span>
          )}
        </p>
      </div>
    </div>
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
  const [dragging, setDragging] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    defaultValues: EMPTY as Partial<FormValues>,
  });

  // Solo estos dos cambian lo que se dibuja alrededor del formulario; el resto
  // de la vista previa se suscribe por su cuenta.
  const imageUrl = watch("image");
  const isReproducible = watch("reproducible");

  const onUploaded = useCallback(
    (url: string) => {
      setImageBroken(false);
      setValue("image", url, { shouldValidate: true });
    },
    [setValue]
  );
  const { upload, uploading } = useImageUpload(onUploaded);

  // La lista de obras y el pabellón se leen al abrir, no se "escuchan": si
  // cambian mientras el artista escribe, el formulario no se toca.
  const rowsRef = useRef(currentRows);
  rowsRef.current = currentRows;
  const soloPavilionRef = useRef("");
  soloPavilionRef.current = pavilionOptions?.length === 1 ? pavilionOptions[0].value : "";

  useEffect(() => {
    if (!open) return;
    setImageBroken(false);

    if (!editingId) {
      // Si el artista tiene un solo pabellón asignado, no tiene sentido
      // preguntárselo: sus obras van ahí.
      reset({ ...EMPTY, pavilion: soloPavilionRef.current } as FormValues);
      return;
    }

    const row = rowsRef.current.find((r) => r.id === editingId);
    if (!row) return;

    reset({
      ...EMPTY,
      title: row.title || "",
      price: (row.price as any) ?? undefined,
      currency: row.currency || "COP",
      description: row.description || "",
      year: (row.year as any) ?? undefined,
      stock: (row.stock as any) ?? undefined,
      dimensions: (row as any)?.dimensionsText || "",
      reproducible: Boolean((row as any)?.reproducible),
      technique: ((row as any)?.techniqueInfo?._id || (row as any)?.technique || "") as any,
      pavilion: ((row as any)?.pavilionInfo?._id || (row as any)?.pavilion || "") as any,
      image: row.image || "",
    } as FormValues);
  }, [open, editingId, reset]);

  const mCreate = useMutation({
    mutationFn: (payload: CreateArtworkInput) => createArtwork(payload),
    onSuccess: () => {
      toast.success("Obra cargada");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "No se pudo cargar la obra"),
  });

  const mPatch = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchArtworkDto }) => patchArtwork(id, payload),
    onSuccess: (resp) => {
      toast.success("Obra actualizada");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork-detail", resp.doc.id] });
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "No se pudo actualizar la obra"),
  });

  const onSubmit = handleSubmit(async (form) => {
    const common = {
      title: form.title,
      slug: slugify(form.title),
      description: form.description,
      price: form.price,
      currency: form.currency || "COP",
      stock: form.stock,
      reproducible: Boolean(form.reproducible),
      image: form.image,
      event: eventId,
      pavilion: form.pavilion || null,
      technique: form.technique,
    };

    if (editingId) {
      // El estado y la visibilidad son del equipo de la feria: lo que carga el
      // artista espera a que se publique el catálogo.
      await mPatch.mutateAsync({
        id: editingId,
        payload: { ...common, dimensionsText: form.dimensions || "" } as PatchArtworkDto,
      });
      return;
    }

    await mCreate.mutateAsync({
      ...common,
      artist: artistId,
      year: form.year,
      dimensionsText: form.dimensions || undefined,
    } as CreateArtworkInput);
  });

  const busy = isSubmitting || mCreate.isPending || mPatch.isPending;
  const showPreview = !!imageUrl && !imageBroken;

  // Estable a propósito: lo que cambia es `busy`, y se lee por ref dentro.
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const close = useCallback(() => {
    if (!busyRef.current) onOpenChange(false);
  }, [onOpenChange]);

  return (
    <StudioSheet
      open={open}
      onClose={close}
      eyebrow={editingId ? "Editar obra" : "Nueva obra"}
      title={editingId ? "Editar la obra" : "Cargar una obra"}
      description="Imagen, título, dimensiones, técnica, precio y copias. Puedes editarla las veces que quieras hasta que envíes tu inventario."
      maxWidth={900}
      footer={
        <>
          <StudioButton onClick={close} disabled={busy}>
            Cancelar
          </StudioButton>
          {/* Vive fuera del <form> (está en el pie de la hoja), así que dispara
              el envío a mano en vez de con type="submit". */}
          <StudioButton variant="solid" disabled={busy || uploading} onClick={() => onSubmit()}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={1.8} />}
            {busy ? "Guardando…" : editingId ? "Guardar cambios" : "Cargar obra"}
          </StudioButton>
          <Eyebrow tone="faint" size={9} style={{ marginLeft: "auto" }}>
            No se publica hasta que la feria publique el catálogo
          </Eyebrow>
        </>
      }
    >
      <form
        id="artwork-form"
        onSubmit={onSubmit}
        noValidate
        style={{
          display: "grid",
          gap: "clamp(22px,3vw,34px)",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))",
        }}
      >
        {/* ── Imagen ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Eyebrow tone="muted" size={9.5} style={{ letterSpacing: "0.22em", display: "block", marginBottom: 7 }}>
              Imagen de la obra
            </Eyebrow>

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
                upload(e.dataTransfer.files?.[0]);
              }}
              style={{
                display: "grid",
                placeItems: "center",
                position: "relative",
                width: "100%",
                // Alto acotado: una foto vertical no puede empujar el resto del
                // formulario fuera de la pantalla.
                aspectRatio: "4 / 3",
                maxHeight: 300,
                cursor: uploading ? "wait" : "pointer",
                background: mix(5),
                border: `1px ${dragging ? "solid" : "dashed"} ${dragging ? "var(--acc)" : mix(24)}`,
                overflow: "hidden",
                transition: "border-color .25s ease",
                textTransform: "none",
                letterSpacing: "normal",
              }}
            >
              {showPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Vista previa de la obra"
                  onError={() => setImageBroken(true)}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 9,
                    color: imageBroken ? "#B4472A" : mix(46),
                    textAlign: "center",
                    padding: 22,
                    textTransform: "none",
                    letterSpacing: "normal",
                  }}
                >
                  <ImagePlus size={22} strokeWidth={1.2} />
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {imageBroken
                      ? "Esa dirección no carga. Sube el archivo."
                      : "Arrastra la foto acá o toca para buscarla"}
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
                  }}
                >
                  <Eyebrow tone="accent">Subiendo…</Eyebrow>
                </span>
              )}
            </label>

            <input
              id="artwork-file"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => upload(e.target.files?.[0])}
            />

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 10 }}>
              <label htmlFor="artwork-file" style={{ cursor: "pointer", textTransform: "none", letterSpacing: "normal" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    height: 34,
                    padding: "0 16px",
                    borderRadius: 999,
                    border: `1px solid ${mix(26)}`,
                    fontSize: 10.5,
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  <Upload size={13} strokeWidth={1.6} />
                  {showPreview ? "Cambiar" : "Subir imagen"}
                </span>
              </label>
              <Eyebrow tone="faint" size={9} style={{ letterSpacing: "0.1em" }}>
                JPG o PNG · máx {MAX_IMAGE_MB} MB
              </Eyebrow>
            </div>
          </div>

          <Field id="artwork-image-url" label="…o pega una dirección" error={errors.image?.message}>
            <input
              id="artwork-image-url"
              {...register("image", { onChange: () => setImageBroken(false) })}
              placeholder="https://…"
              style={fieldInput}
            />
          </Field>

          {/* Cómo va a quedar en el catálogo */}
          <div style={{ paddingTop: 14, borderTop: hair(14) }}>
            <Eyebrow tone="faint" size={9} style={{ display: "block", marginBottom: 10 }}>
              Así se ve en el catálogo
            </Eyebrow>
            <CatalogPreview control={control} image={showPreview ? imageUrl : undefined} />
          </div>
        </div>

        {/* ── Datos ─────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gap: "clamp(18px,2.2vw,22px)", alignContent: "start" }}>
          <Field id="artwork-title" label="Título *" error={errors.title?.message}>
            <input
              id="artwork-title"
              {...register("title")}
              placeholder="Nombre de la obra"
              aria-invalid={!!errors.title}
              style={fieldInput}
            />
          </Field>

          <div style={{ display: "grid", gap: "clamp(18px,2.2vw,22px)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))" }}>
            <Field id="artwork-technique" label="Técnica *" error={errors.technique?.message}>
              <select
                id="artwork-technique"
                {...register("technique")}
                aria-invalid={!!errors.technique}
                style={fieldInput}
              >
                <option value="">Elige una</option>
                {techniqueOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="artwork-year" label="Año" error={errors.year?.message}>
              <input
                id="artwork-year"
                type="number"
                inputMode="numeric"
                {...register("year")}
                placeholder={`${CURRENT_YEAR}`}
                style={fieldInput}
              />
            </Field>
          </div>

          <Field id="artwork-dimensions" label="Dimensiones">
            <input
              id="artwork-dimensions"
              {...register("dimensions")}
              placeholder="42.3 cm x 34.5 cm"
              style={fieldInput}
            />
          </Field>

          {/* Un solo pabellón no es una pregunta */}
          {pavilionOptions.length > 1 ? (
            <Field id="artwork-pavilion" label="Pabellón">
              <select id="artwork-pavilion" {...register("pavilion")} style={fieldInput}>
                <option value="">Sin pabellón</option>
                {pavilionOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <input type="hidden" {...register("pavilion")} />
          )}

          <div style={{ display: "grid", gap: "clamp(18px,2.2vw,22px)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))" }}>
            <Field id="artwork-price" label="Precio en pesos" error={errors.price?.message}>
              <input
                id="artwork-price"
                type="number"
                inputMode="numeric"
                {...register("price")}
                placeholder="1200000"
                style={fieldInput}
              />
            </Field>

            <Field
              id="artwork-stock"
              label={isReproducible ? "N.º de copias" : "Cantidad"}
              hint={
                isReproducible
                  ? `Copias a la venta, máximo ${MAX_COPIES} por serie. Cada compra descuenta una.`
                  : "Obra única: deja 1."
              }
            >
              <input
                id="artwork-stock"
                type="number"
                inputMode="numeric"
                {...register("stock")}
                placeholder="1"
                style={fieldInput}
              />
            </Field>
          </div>

          <label className="fdm-studio-check" style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" {...register("reproducible")} style={{ marginTop: 3, width: 15, height: 15 }} />
            <span>
              Es una reproducción (serigrafía, grabado, impresión…). La cantidad pasa a ser el
              número de copias.
            </span>
          </label>

          <Field id="artwork-description" label="Descripción">
            <textarea
              id="artwork-description"
              {...register("description")}
              rows={5}
              placeholder="Qué es, de qué está hecha, qué cuenta…"
              style={fieldInput}
            />
          </Field>
        </div>
      </form>
    </StudioSheet>
  );
}
