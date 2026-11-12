"use client";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { uploadImage, uploadPDF } from "@services/upload.service";

/* Subida de archivos de la postulación. Mismo lenguaje que "Subir foto de la
   obra" del estudio: zona punteada grande que se toca o recibe el archivo
   arrastrado, y al cargar muestra la vista previa con "Cambiar" y "Quitar"
   siempre visibles (en celular no existe el hover). Colores por tokens del
   sistema, con valores claros de respaldo. */

interface UploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const FU_CSS = `
  .fu-wrap { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .fu-label { font-size: 14px; font-weight: 500; color: var(--fg, #111111); }
  .fu-zone { min-height: 150px; padding: 20px; border: 1px dashed var(--fg4, #8A877F); border-radius: 12px; background: var(--bg, #F7F6F2); color: var(--fg, #111111); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; cursor: pointer; transition: border-color .2s, background .2s; width: 100%; font: inherit; }
  .fu-zone:hover, .fu-zone.is-drag { border-color: var(--green, #1F7A50); background: var(--green-soft, #E4F1EA); }
  .fu-zone.is-loading { cursor: wait; }
  .fu-zone .t { font-size: 17px; font-weight: 500; }
  .fu-zone .s { font-size: 14px; color: var(--fg2, #55534D); }
  .fu-spinner { width: 32px; height: 32px; border: 3px solid var(--line, #DEDBD3); border-top-color: var(--green, #1F7A50); border-radius: 50%; animation: fu-spin .7s linear infinite; }
  @keyframes fu-spin { to { transform: rotate(360deg); } }
  .fu-done { border: 1px solid var(--green, #1F7A50); background: var(--green-soft, #E4F1EA); border-radius: 12px; padding: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; }
  .fu-done img { width: 96px; height: 96px; object-fit: cover; display: block; background: var(--tile, #ECEAE3); flex: none; }
  .fu-done .ico { width: 56px; height: 56px; border-radius: 999px; background: var(--card, #FFFFFF); color: var(--green-deep, #17603F); display: flex; align-items: center; justify-content: center; flex: none; }
  .fu-done .info { flex: 1 1 160px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .fu-done .info b { font-size: 16px; font-weight: 500; color: var(--green-deep, #17603F); }
  .fu-done .info span, .fu-done .info a { font-size: 14px; color: var(--fg2, #55534D); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fu-done .acts { display: flex; gap: 8px; }
  .fu-done .acts button { height: 44px; padding: 0 16px; border: 1px solid var(--line2, #C9C6BD); background: var(--card, #FFFFFF); color: var(--fg, #111111); border-radius: 999px; font: inherit; font-size: 14px; cursor: pointer; }
  .fu-done .acts button.rm { color: var(--fg2, #55534D); background: transparent; }
  .fu-error { font-size: 14px; color: var(--bad, #B4472A); }
  .fu-hint { font-size: 14px; line-height: 1.45; color: var(--fg2, #55534D); }
`;

const IcoCamera = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
const IcoFile = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></svg>
);

function useDrop(handle: (f: File) => void) {
  const [dragging, setDragging] = useState(false);
  return {
    dragging,
    props: {
      onDragOver: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        setDragging(true);
      },
      onDragLeave: () => setDragging(false),
      onDrop: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handle(file);
      },
    },
  };
}

/* ── Imagen (Cloudinary) ────────────────────────────────── */
export function ImageUpload({ value, onChange, disabled, folder = "convocatoria", label = "Imagen", hint }: UploadProps & { folder?: string; label?: string; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (!file.type.startsWith("image/")) return setError("Ese archivo no es una imagen. Sube un JPG o PNG.");
    if (file.size > 5 * 1024 * 1024) return setError("La imagen pesa más de 5 MB. Prueba con una más liviana.");
    setError("");
    setUploading(true);
    try {
      onChange((await uploadImage(file, folder)).url);
    } catch (e: any) {
      setError(e?.response?.data?.error || "No pudimos subir la imagen. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };
  const drop = useDrop(handle);
  const pick = () => !uploading && !disabled && inputRef.current?.click();
  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handle(file);
    e.target.value = "";
  };

  return (
    <div className="fu-wrap">
      <style>{FU_CSS}</style>
      <span className="fu-label">{label}</span>

      {value && !uploading ? (
        <div className="fu-done">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" />
          <div className="info">
            <b>Imagen cargada</b>
            <span>Puedes cambiarla cuando quieras.</span>
          </div>
          <div className="acts">
            <button type="button" className="fdm-studio-plain" onClick={pick} disabled={disabled}>Cambiar</button>
            <button type="button" className="rm fdm-studio-plain" onClick={() => onChange("")} disabled={disabled}>Quitar</button>
          </div>
        </div>
      ) : (
        <button type="button" className={`fu-zone fdm-studio-plain${drop.dragging ? " is-drag" : ""}${uploading ? " is-loading" : ""}`} onClick={pick} {...drop.props}>
          {uploading ? (
            <>
              <span className="fu-spinner" />
              <span className="s">Subiendo…</span>
            </>
          ) : (
            <>
              {IcoCamera}
              <span className="t">Subir imagen</span>
              <span className="s">JPG o PNG, desde tu galería o cámara · máx. 5 MB</span>
            </>
          )}
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onInput} disabled={disabled || uploading} />
      {error ? <span className="fu-error" role="alert">{error}</span> : hint ? <span className="fu-hint">{hint}</span> : null}
    </div>
  );
}

/* ── PDF (S3) ───────────────────────────────────────────── */
export function PDFUpload({ value, onChange, disabled, label = "Documento PDF", hint }: UploadProps & { label?: string; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return setError("Ese archivo no es un PDF. Guarda tu hoja de vida como PDF y súbela.");
    if (file.size > 10 * 1024 * 1024) return setError("El PDF pesa más de 10 MB. Prueba con uno más liviano.");
    setError("");
    setUploading(true);
    try {
      onChange((await uploadPDF(file)).url);
    } catch (e: any) {
      setError(e?.response?.data?.error || "No pudimos subir el PDF. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };
  const drop = useDrop(handle);
  const pick = () => !uploading && !disabled && inputRef.current?.click();
  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handle(file);
    e.target.value = "";
  };

  return (
    <div className="fu-wrap">
      <style>{FU_CSS}</style>
      <span className="fu-label">{label}</span>

      {value && !uploading ? (
        <div className="fu-done">
          <span className="ico">{IcoFile}</span>
          <div className="info">
            <b>PDF cargado</b>
            <a href={value} target="_blank" rel="noopener noreferrer">Abrir para revisarlo</a>
          </div>
          <div className="acts">
            <button type="button" className="fdm-studio-plain" onClick={pick} disabled={disabled}>Cambiar</button>
            <button type="button" className="rm fdm-studio-plain" onClick={() => onChange("")} disabled={disabled}>Quitar</button>
          </div>
        </div>
      ) : (
        <button type="button" className={`fu-zone fdm-studio-plain${drop.dragging ? " is-drag" : ""}${uploading ? " is-loading" : ""}`} onClick={pick} {...drop.props}>
          {uploading ? (
            <>
              <span className="fu-spinner" />
              <span className="s">Subiendo…</span>
            </>
          ) : (
            <>
              {IcoFile}
              <span className="t">Subir PDF</span>
              <span className="s">Solo PDF · máx. 10 MB</span>
            </>
          )}
        </button>
      )}

      <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={onInput} disabled={disabled || uploading} />
      {error ? <span className="fu-error" role="alert">{error}</span> : hint ? <span className="fu-hint">{hint}</span> : null}
    </div>
  );
}
