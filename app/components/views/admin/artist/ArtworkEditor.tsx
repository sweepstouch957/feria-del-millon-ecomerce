"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Form, Formik, useField, useFormikContext, type FormikProps } from "formik";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createArtwork, patchArtwork, type CreateArtworkInput, type PatchArtworkDto } from "@services/artworks.service";
import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { useImageUpload } from "@hooks/artist/useImageUpload";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { MAX_COPIES, MAX_IMAGE_MB } from "@lib/artwork";
import { formatCOP } from "@lib/money";
import { EMPTY_ARTWORK, artworkPayload, artworkSchema, type ArtworkFormValues } from "@validators/artwork";
import { zodValidator } from "@validators/formikZod";

import { Bone, Dot, Ico } from "./ui";
import { CheckboxInput, SelectInput, TextArea, TextInput } from "./ui/fields";

/* Crear o editar una obra, a página completa (port de "Mi estudio — Nueva
   obra"): tres tarjetas numeradas a la izquierda, y a la derecha cómo se verá
   en el catálogo y qué falta para poder guardar. La barra de abajo lleva la
   cuenta y el botón.

   El formulario es Formik y las reglas viven en @validators/artwork: acá no se
   decide qué es válido, solo se dibuja. Los valores iniciales se calculan una
   vez por obra —con `key` en el Formik— para que un refresco en segundo plano
   no borre lo que el artista lleva escrito. */

const validate = zodValidator<ArtworkFormValues>(artworkSchema);

/** Lo que dijo el servidor; sin respuesta, es la conexión del artista. */
const saveError = (e: any) =>
  e?.response?.data?.error ||
  (e?.response
    ? "No pudimos guardar la obra. Inténtalo de nuevo; si sigue, escríbenos a soporte@feriadelmillon.com."
    : "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo. Lo que escribiste sigue aquí.");

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

/* ── 1. Foto ─────────────────────────────────────────────────────────────── */

function ImageField() {
  const [field, meta, helpers] = useField<string>("image");
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
    <>
      <label
        htmlFor="artwork-file"
        className={`fdm-st-drop${show ? " is-on" : ""}${dragging ? " is-drag" : ""}`}
        style={{ cursor: uploading ? "wait" : "pointer" }}
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
      >
        {show ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Foto de la obra" onError={() => setBroken(true)} />
            <span className="t">{uploading ? "Subiendo…" : "Foto cargada"}</span>
            <span className="s">Toca para cambiarla</span>
          </>
        ) : (
          <>
            <Ico name="camera" size={28} sw={1.3} />
            <span className="t">{uploading ? "Subiendo…" : broken ? "Esa foto no carga: súbela de nuevo" : "Subir foto de la obra"}</span>
            <span className="s">JPG o PNG, desde tu galería o cámara · máx. {MAX_IMAGE_MB} MB</span>
          </>
        )}
      </label>
      <input id="artwork-file" type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
      {meta.touched && meta.error && (
        <p role="alert" style={{ margin: 0, fontSize: 14, color: "var(--bad)" }}>{meta.error}</p>
      )}
      <span className="fdm-st-note" style={{ fontSize: 14 }}>
        Fotografía la obra de frente, con luz pareja y sin marco ni reflejos. Es lo primero que ve el comprador.
      </span>
    </>
  );
}

/* ── Lo que necesita para poder guardarse ────────────────────────────────── */

function useChecks(needPavilion: boolean) {
  const { values } = useFormikContext<ArtworkFormValues>();
  const price = Number(values.price);
  const checks = [
    { label: "Foto de la obra", ok: !!values.image },
    { label: "Título", ok: values.title.trim().length > 0 },
    { label: needPavilion ? "Técnica y pabellón" : "Técnica", ok: !!values.technique && (!needPavilion || !!values.pavilion) },
    { label: "Precio", ok: values.price !== "" && !Number.isNaN(price) && price > 0 },
  ];
  return { checks, ready: checks.filter((c) => c.ok).length, values };
}

function Aside({ artistName, techniqueOptions, needPavilion }: { artistName: string; techniqueOptions: Array<{ value: string; label: string }>; needPavilion: boolean }) {
  const { checks, values } = useChecks(needPavilion);
  const price = Number(values.price);
  const tech = techniqueOptions.find((t) => t.value === values.technique)?.label || "Técnica";
  const copies = Number(values.stock) || 1;

  return (
    <aside>
      <section className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 className="fdm-st-label" style={{ margin: 0 }}>Así se verá en el catálogo</h2>
        <div className="fdm-st-pv">
          {values.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.image} alt="" />
          ) : (
            <span>Sin foto</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 18, overflowWrap: "anywhere", color: values.title.trim() ? "var(--fg)" : "var(--fg3)" }}>{values.title.trim() || "Título de la obra"}</span>
          <span style={{ fontSize: 15, color: "var(--fg2)" }}>{artistName}</span>
          <span style={{ fontSize: 13, color: "var(--fg3)" }}>{tech} · {values.reproducible || copies > 1 ? "Reproducción" : "Obra única"}</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 500 }}>{values.price !== "" && price > 0 ? formatCOP(price, { currency: "COP" }) : "$ —"}</span>
      </section>

      <section className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 className="fdm-st-label" style={{ margin: "0 0 2px" }}>Para poder guardar</h2>
        {checks.map((c) => (
          <span key={c.label} className={`fdm-st-ck${c.ok ? " is-on" : ""}`}>
            <Dot on={c.ok} size="sm" />
            {c.label}
          </span>
        ))}
      </section>
    </aside>
  );
}

function Fields({ techniqueOptions, pavilionOptions }: { techniqueOptions: Array<{ value: string; label: string }>; pavilionOptions: Array<{ value: string; label: string }> }) {
  const { values } = useFormikContext<ArtworkFormValues>();
  const copies = Number(values.stock) || 1;

  return (
    <Form id="artwork-form" className="main" noValidate>
      <section className="fdm-st-card fdm-st-sec" style={{ gap: 12 }}>
        <h2 className="fdm-st-h3">1. Foto de la obra</h2>
        <ImageField />
      </section>

      <section className="fdm-st-card fdm-st-sec">
        <h2 className="fdm-st-h3">2. Datos de la obra</h2>
        <div className="fdm-st-grid2">
          <TextInput name="title" label="Título" placeholder="Como quieres que aparezca" maxLength={160} />
          <TextInput name="year" label="Año" type="number" placeholder={`${new Date().getFullYear()}`} />
        </div>
        <div className="fdm-st-grid2">
          <SelectInput name="technique" label="Técnica" options={techniqueOptions} placeholder="Elige una opción" />
          {/* Un solo pabellón no es una pregunta */}
          {pavilionOptions.length > 1 && <SelectInput name="pavilion" label="Pabellón" options={pavilionOptions} placeholder="Elige una opción" />}
        </div>
        <TextInput name="dimensions" label="Medidas" placeholder="Alto × ancho, por ejemplo 42 × 35 cm" />
        <TextArea name="description" label="Descripción (opcional)" rows={4} placeholder="Qué es, de qué está hecha, qué cuenta…" />
      </section>

      <section className="fdm-st-card fdm-st-sec">
        <h2 className="fdm-st-h3">3. Precio y copias</h2>
        <div className="fdm-st-grid2">
          <TextInput name="price" label="Precio (COP)" type="number" placeholder="0" />
          <TextInput name="stock" label="Copias disponibles" type="number" placeholder="1" />
        </div>
        <CheckboxInput name="reproducible">Es una reproducción (serigrafía, grabado, impresión…).</CheckboxInput>
        <span className="fdm-st-hintbox">
          {values.reproducible || copies > 1
            ? `Con ${copies} ${copies === 1 ? "copia" : "copias"} se publicará como reproducción: cada venta descuenta una copia. Máximo ${MAX_COPIES} por obra.`
            : "Con 1 copia se publicará como obra única: al venderse deja de estar disponible."}
        </span>
      </section>
    </Form>
  );
}

function Bar({ busy, editing, needPavilion, onCancel, onSubmit }: { busy: boolean; editing: boolean; needPavilion: boolean; onCancel: () => void; onSubmit: () => void }) {
  const { checks, ready } = useChecks(needPavilion);
  const all = ready === checks.length;
  return (
    <div className="fdm-st-bar">
      <span className="st">
        <b>{all ? "Todo listo para guardar" : `${ready} de ${checks.length} datos listos`}</b>
        {" · No se publica hasta que la feria publique el catálogo"}
      </span>
      <div className="acts">
        <button type="button" className="fdm-st-btn fdm-studio-plain" disabled={busy} onClick={onCancel}>Cancelar</button>
        <button
          type="button"
          className={`fdm-st-btn is-main fdm-studio-plain${all ? " is-green" : ""}`}
          style={all ? undefined : { background: "var(--line2)", borderColor: "var(--line2)", color: "var(--fg)", fontWeight: 500 }}
          disabled={busy}
          onClick={onSubmit}
        >
          {busy ? "Guardando…" : editing ? "Guardar cambios" : "Guardar obra"}
        </button>
      </div>
    </div>
  );
}

export default function ArtworkEditor({
  eventId,
  artistId,
  artistName,
  editingId,
  currentRows,
  techniqueOptions,
  pavilionOptions,
  onDone,
  onCancel,
}: {
  eventId: string;
  artistId: string;
  artistName: string;
  editingId: string | null;
  currentRows: ArtworkRow[];
  techniqueOptions: Array<{ value: string; label: string }>;
  pavilionOptions: Array<{ value: string; label: string }>;
  /** Se guardó: vuelve a la lista. */
  onDone: () => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const form = useRef<FormikProps<ArtworkFormValues>>(null);
  const needPavilion = pavilionOptions.length > 1;

  const mCreate = useMutation({
    mutationFn: (payload: CreateArtworkInput) => createArtwork(payload),
    onSuccess: () => {
      toast.success("Obra cargada");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      onDone();
    },
    onError: (e: any) => toast.error(saveError(e)),
  });

  const mPatch = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchArtworkDto }) => patchArtwork(id, payload),
    onSuccess: (resp) => {
      toast.success("Obra actualizada");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork-detail", resp.doc.id] });
      onDone();
    },
    onError: (e: any) => toast.error(saveError(e)),
  });

  const busy = mCreate.isPending || mPatch.isPending;

  // Al editar se carga la obra completa: la fila de la lista no trae todo, y
  // un campo que llegaba vacío se guardaba vacío (se "borraba" lo cargado).
  const detail = useArtworkDetail(editingId ?? undefined);
  const editRow = editingId
    ? (detail.data?.doc as ArtworkRow | undefined) ?? (detail.isError ? currentRows.find((r) => r.id === editingId) : undefined)
    : undefined;
  const loadingEdit = !!editingId && !editRow;

  // Se calculan una vez con la obra lista y no se vuelven a mirar.
  const initialValues = useMemo(() => {
    const solo = pavilionOptions?.length === 1 ? pavilionOptions[0].value : "";
    return valuesOf(editRow, solo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, loadingEdit]);

  // El botón está en la barra y el campo con error puede quedar fuera de la
  // vista: sin este aviso, "no pasa nada" al tocarlo.
  const trySubmit = async () => {
    const errors = await form.current?.validateForm();
    const first = Object.values(errors ?? {})[0];
    if (first) toast.error(String(first));
    form.current?.submitForm();
  };

  const cancel = () => {
    if (busy) return;
    if (form.current?.dirty && !window.confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
    onCancel();
  };

  const submit = async (values: ArtworkFormValues) => {
    const payload = artworkPayload(values);
    if (editingId) {
      // El estado y la visibilidad son del equipo de la feria.
      await mPatch.mutateAsync({ id: editingId, payload: { ...payload, event: eventId } as PatchArtworkDto });
      return;
    }
    await mCreate.mutateAsync({ ...payload, event: eventId, artist: artistId } as CreateArtworkInput);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button type="button" className="fdm-st-back fdm-studio-plain" onClick={cancel}>
          <Ico name="back" />
          Volver a mis obras
        </button>
        <h1 className="fdm-st-h1">{editingId ? "Editar obra" : "Nueva obra"}</h1>
      </div>

      {loadingEdit ? (
        <div className="fdm-st-editor" aria-busy="true">
          <div className="main">
            <Bone h={260} style={{ borderRadius: 16 }} />
            <Bone h={320} style={{ borderRadius: 16 }} />
          </div>
          <aside><Bone h={420} style={{ borderRadius: 16 }} /></aside>
        </div>
      ) : (
        <Formik<ArtworkFormValues>
          // Una obra distinta es un formulario distinto: la `key` lo reinicia.
          key={editingId ?? "nueva"}
          innerRef={form}
          initialValues={initialValues}
          // Con varios pabellones la obra tiene que decir en cuál va.
          validate={(v) => {
            const errors = validate(v);
            return needPavilion && !v.pavilion ? { ...errors, pavilion: "Elige en qué pabellón va esta obra" } : errors;
          }}
          onSubmit={submit}
        >
          <>
            <div className="fdm-st-editor">
              <Fields techniqueOptions={techniqueOptions} pavilionOptions={pavilionOptions} />
              <Aside artistName={artistName} techniqueOptions={techniqueOptions} needPavilion={needPavilion} />
            </div>
            <Bar busy={busy} editing={!!editingId} needPavilion={needPavilion} onCancel={cancel} onSubmit={trySubmit} />
          </>
        </Formik>
      )}
    </div>
  );
}
