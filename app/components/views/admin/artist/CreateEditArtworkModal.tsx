"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Form, Formik, useField, useFormikContext, type FormikProps } from "formik";
import { Check, ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createArtwork,
  patchArtwork,
  type CreateArtworkInput,
  type PatchArtworkDto,
} from "@services/artworks.service";
import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { useImageUpload } from "@hooks/artist/useImageUpload";
import { MAX_COPIES, MAX_IMAGE_MB } from "@lib/artwork";
import { formatCOP } from "@lib/money";
import {
  EMPTY_ARTWORK,
  artworkPayload,
  artworkSchema,
  type ArtworkFormValues,
} from "@validators/artwork";
import { zodValidator } from "@validators/formikZod";

import StudioSheet from "./StudioSheet";
import { Eyebrow, StudioButton } from "./ui";
import { CheckboxInput, SelectInput, TextArea, TextInput } from "./ui/fields";
import { hair, mix } from "./studioTheme";

/* Crear o editar una obra.

   El formulario es Formik y las reglas viven en @validators/artwork: acá no se
   decide qué es válido, solo se dibuja. Los valores iniciales se calculan una
   vez por apertura —con `key` en el Formik— porque cuando dependían de la
   lista de obras del estudio, un refresco en segundo plano borraba lo que el
   artista llevaba escrito.

   El tag es del sistema: se genera con el QR al crear la obra. */

const validate = zodValidator<ArtworkFormValues>(artworkSchema);

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Lo guardado de una obra, en el formato que entienden los inputs (texto). */
function valuesOf(row: ArtworkRow | undefined, soloPavilion: string): ArtworkFormValues {
  if (!row) return { ...EMPTY_ARTWORK, pavilion: soloPavilion };
  return {
    title: row.title || "",
    technique: str((row as any)?.techniqueInfo?._id || (row as any)?.technique),
    pavilion: str((row as any)?.pavilionInfo?._id || (row as any)?.pavilion),
    year: str(row.year),
    price: str(row.price),
    stock: str(row.stock),
    dimensions: str((row as any)?.dimensionsText),
    description: row.description || "",
    reproducible: Boolean((row as any)?.reproducible),
    image: row.image || "",
  };
}

/* ── Imagen ───────────────────────────────────────────────────────────────
   Es un campo como cualquier otro, solo que se llena arrastrando un archivo.
   Vive en su propio componente para que el `setFieldValue` de la subida no
   obligue a nadie más a enterarse. */

function ImageField({ disabled }: { disabled?: boolean }) {
  const [field, , helpers] = useField<string>("image");
  const [dragging, setDragging] = useState(false);
  const [broken, setBroken] = useState(false);

  const onUploaded = useCallback(
    (url: string) => {
      setBroken(false);
      helpers.setValue(url);
      helpers.setTouched(true, false);
    },
    [helpers]
  );
  const { upload, uploading } = useImageUpload(onUploaded);

  const url = field.value;
  const show = !!url && !broken;

  return (
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
        {show ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Vista previa de la obra"
            onError={() => setBroken(true)}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 9,
              color: broken ? "#B4472A" : mix(46),
              textAlign: "center",
              padding: 22,
              textTransform: "none",
              letterSpacing: "normal",
            }}
          >
            <ImagePlus size={22} strokeWidth={1.2} />
            <span style={{ fontSize: 13, lineHeight: 1.5 }}>
              {broken ? "Esa dirección no carga. Sube el archivo." : "Arrastra la foto acá o toca para buscarla"}
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
        disabled={disabled}
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
            {show ? "Cambiar" : "Subir imagen"}
          </span>
        </label>
        <Eyebrow tone="faint" size={9} style={{ letterSpacing: "0.1em" }}>
          JPG o PNG · máx {MAX_IMAGE_MB} MB
        </Eyebrow>
      </div>
    </div>
  );
}

/* ── Vista previa del catálogo ───────────────────────────────────────────── */

function CatalogPreview() {
  const { values } = useFormikContext<ArtworkFormValues>();
  const price = values.price === "" ? undefined : Number(values.price);

  return (
    <div style={{ paddingTop: 14, borderTop: hair(14) }}>
      <Eyebrow tone="faint" size={9} style={{ display: "block", marginBottom: 10 }}>
        Así se ve en el catálogo
      </Eyebrow>
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
          {values.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.3 }}>
            {values.title || <span style={{ color: mix(38) }}>Título de la obra</span>}
          </p>
          <p style={{ margin: "6px 0 0" }}>
            <Eyebrow tone="faint" size={9}>
              {[values.year, values.dimensions].filter(Boolean).join(" · ") || "Año · dimensiones"}
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
    </div>
  );
}

/* ── Los campos ──────────────────────────────────────────────────────────── */

function ArtworkFields({
  techniqueOptions,
  pavilionOptions,
}: {
  techniqueOptions: Array<{ value: string; label: string }>;
  pavilionOptions: Array<{ value: string; label: string }>;
}) {
  const { values } = useFormikContext<ArtworkFormValues>();
  const twoUp = {
    display: "grid",
    gap: "clamp(18px,2.2vw,22px)",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))",
  } as const;

  return (
    <Form
      id="artwork-form"
      style={{
        display: "grid",
        gap: "clamp(22px,3vw,34px)",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ImageField />
        <TextInput name="image" label="…o pega una dirección" placeholder="https://…" />
        <CatalogPreview />
      </div>

      <div style={{ display: "grid", gap: "clamp(18px,2.2vw,22px)", alignContent: "start" }}>
        <TextInput name="title" label="Título *" placeholder="Nombre de la obra" maxLength={160} />

        <div style={twoUp}>
          <SelectInput name="technique" label="Técnica *" options={techniqueOptions} />
          <TextInput name="year" label="Año" type="number" placeholder={`${new Date().getFullYear()}`} />
        </div>

        <TextInput name="dimensions" label="Dimensiones" placeholder="42.3 cm x 34.5 cm" />

        {/* Un solo pabellón no es una pregunta */}
        {pavilionOptions.length > 1 && (
          <SelectInput
            name="pavilion"
            label="Pabellón"
            options={pavilionOptions}
            placeholder="Sin pabellón"
          />
        )}

        <div style={twoUp}>
          <TextInput name="price" label="Precio en pesos" type="number" placeholder="1200000" />
          <TextInput
            name="stock"
            label={values.reproducible ? "N.º de copias" : "Cantidad"}
            type="number"
            placeholder="1"
            hint={
              values.reproducible
                ? `Copias a la venta, máximo ${MAX_COPIES} por serie. Cada compra descuenta una.`
                : "Obra única: deja 1."
            }
          />
        </div>

        <CheckboxInput name="reproducible">
          Es una reproducción (serigrafía, grabado, impresión…). La cantidad pasa a ser el número
          de copias.
        </CheckboxInput>

        <TextArea
          name="description"
          label="Descripción"
          rows={5}
          placeholder="Qué es, de qué está hecha, qué cuenta…"
        />
      </div>
    </Form>
  );
}

/* ── La hoja ─────────────────────────────────────────────────────────────── */

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
  const form = useRef<FormikProps<ArtworkFormValues>>(null);

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

  const busy = mCreate.isPending || mPatch.isPending;

  // Estable a propósito: lo que cambia es `busy`, y se lee por ref adentro.
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const close = useCallback(() => {
    if (!busyRef.current) onOpenChange(false);
  }, [onOpenChange]);

  // Se calculan al abrir y no se vuelven a mirar: si la lista de obras cambia
  // en segundo plano, el formulario no se entera.
  const initialValues = useMemo(() => {
    const solo = pavilionOptions?.length === 1 ? pavilionOptions[0].value : "";
    return valuesOf(editingId ? currentRows.find((r) => r.id === editingId) : undefined, solo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const submit = async (values: ArtworkFormValues) => {
    const payload = artworkPayload(values);

    if (editingId) {
      // El estado y la visibilidad son del equipo de la feria: lo que carga el
      // artista espera a que se publique el catálogo.
      await mPatch.mutateAsync({
        id: editingId,
        payload: { ...payload, event: eventId } as PatchArtworkDto,
      });
      return;
    }

    await mCreate.mutateAsync({ ...payload, event: eventId, artist: artistId } as CreateArtworkInput);
  };

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
          {/* El pie vive fuera del <form>, así que envía a mano. */}
          <StudioButton variant="solid" disabled={busy} onClick={() => form.current?.submitForm()}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={1.8} />}
            {busy ? "Guardando…" : editingId ? "Guardar cambios" : "Cargar obra"}
          </StudioButton>
          <Eyebrow tone="faint" size={9} style={{ marginLeft: "auto" }}>
            No se publica hasta que la feria publique el catálogo
          </Eyebrow>
        </>
      }
    >
      <Formik<ArtworkFormValues>
        // Una obra distinta es un formulario distinto: la `key` lo reinicia sin
        // efectos de por medio.
        key={editingId ?? "nueva"}
        innerRef={form}
        initialValues={initialValues}
        validate={validate}
        onSubmit={submit}
      >
        <ArtworkFields techniqueOptions={techniqueOptions} pavilionOptions={pavilionOptions} />
      </Formik>
    </StudioSheet>
  );
}
