"use client";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { X, Image as ImageIcon, FileText, Paperclip, AlertTriangle } from "lucide-react";
import { uploadImage, uploadPDF } from "@services/upload.service";

/* ── Shared ─────────────────────────────────────────────── */
interface UploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

/* ── Image Upload (Cloudinary) ──────────────────────────── */
export function ImageUpload({ value, onChange, disabled, folder = "convocatoria", label = "Imagen", hint }: UploadProps & { folder?: string; label?: string; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Solo se aceptan imágenes (JPG, PNG, WEBP)"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar 5MB"); return; }
    setError(""); setUploading(true);
    try {
      const res = await uploadImage(file, folder);
      onChange(res.url);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handle(file);
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handle(file);
  };

  return (
    <div className="fu-wrap">
      <span className="fu-label">{label}</span>

      {value ? (
        <div className="fu-preview fu-preview--img">
          <img src={value} alt="preview" className="fu-preview__img" />
          <div className="fu-preview__overlay">
            <button type="button" className="fu-preview__change" onClick={() => inputRef.current?.click()} disabled={disabled || uploading}>
              Cambiar imagen
            </button>
            <button type="button" className="fu-preview__remove" onClick={() => onChange("")} disabled={disabled || uploading}>
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`fu-zone ${dragging ? "fu-zone--drag" : ""} ${uploading ? "fu-zone--loading" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <div className="fu-spinner" />
          ) : (
            <>
              <div className="fu-zone__icon"><ImageIcon size={32} /></div>
              <p className="fu-zone__text">Arrastra una imagen aquí o <span className="fu-zone__link">haz clic para seleccionar</span></p>
              <p className="fu-zone__sub">JPG, PNG, WEBP · Máx. 5MB</p>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onInput} disabled={disabled || uploading} />
      {error && <span className="fu-error"><AlertTriangle size={12} style={{ verticalAlign: "-2px" }} /> {error}</span>}
      {hint && !error && <span className="fu-hint">{hint}</span>}

      <style jsx>{`
        .fu-wrap { display: flex; flex-direction: column; gap: 6px; }
        .fu-label { font-size: 13px; font-weight: 600; color: #ccc; }
        .fu-zone {
          border: 2px dashed #444; border-radius: 12px; padding: 28px 20px; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          background: #0d0d0d; transition: all .2s; min-height: 120px; justify-content: center;
        }
        .fu-zone:hover, .fu-zone--drag { border-color: #fff; background: rgba(255,255,255,0.04); }
        .fu-zone--loading { cursor: default; border-style: solid; border-color: #333; }
        .fu-zone__icon { font-size: 32px; }
        .fu-zone__text { font-size: 14px; color: #aaa; text-align: center; margin: 0; }
        .fu-zone__link { color: #fff; text-decoration: underline; }
        .fu-zone__sub { font-size: 11px; color: #666; margin: 0; }
        .fu-spinner {
          width: 36px; height: 36px; border: 3px solid #333; border-top-color: #fff;
          border-radius: 50%; animation: fu-spin .7s linear infinite;
        }
        @keyframes fu-spin { to { transform: rotate(360deg); } }
        .fu-preview { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
        .fu-preview--img { width: 100%; aspect-ratio: 16/9; max-height: 200px; }
        .fu-preview__img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fu-preview__overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,.55); opacity: 0;
          transition: opacity .2s; display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .fu-preview:hover .fu-preview__overlay { opacity: 1; }
        .fu-preview__change {
          background: #fff; color: #000; border: none; border-radius: 8px;
          padding: 6px 14px; font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .fu-preview__remove {
          background: rgba(239,68,68,.9); color: #fff; border: none; border-radius: 8px;
          padding: 6px 10px; font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .fu-error { font-size: 12px; color: #ef4444; }
        .fu-hint { font-size: 12px; color: #666; }
      `}</style>
    </div>
  );
}

/* ── PDF Upload (S3) ────────────────────────────────────── */
export function PDFUpload({ value, onChange, disabled, label = "Documento PDF", hint }: UploadProps & { label?: string; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) { setError("Solo se aceptan archivos PDF"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("El PDF no puede superar 10MB"); return; }
    setError(""); setUploading(true);
    try {
      const res = await uploadPDF(file);
      onChange(res.url);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Error al subir PDF");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handle(file);
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handle(file);
  };

  // Extract filename from URL
  const filename = value ? value.split("/").pop()?.split("?")[0] || "archivo.pdf" : null;

  return (
    <div className="fu-wrap">
      <span className="fu-label">{label}</span>

      {value ? (
        <div className="fu-pdf-card">
          <div className="fu-pdf-card__icon"><FileText size={32} /></div>
          <div className="fu-pdf-card__info">
            <span className="fu-pdf-card__name">{filename}</span>
            <a href={value} target="_blank" rel="noopener noreferrer" className="fu-pdf-card__link">Ver PDF ↗</a>
          </div>
          <div className="fu-pdf-card__actions">
            <button type="button" className="fu-pdf-card__change" onClick={() => inputRef.current?.click()} disabled={disabled || uploading}>
              Reemplazar
            </button>
            <button type="button" className="fu-pdf-card__remove" onClick={() => onChange("")} disabled={disabled || uploading}><X size={14} /></button>
          </div>
        </div>
      ) : (
        <div
          className={`fu-zone fu-zone--pdf ${dragging ? "fu-zone--drag" : ""} ${uploading ? "fu-zone--loading" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <div className="fu-spinner" />
          ) : (
            <>
              <div className="fu-zone__icon"><Paperclip size={32} /></div>
              <p className="fu-zone__text">Arrastra tu CV aquí o <span className="fu-zone__link">haz clic para seleccionar</span></p>
              <p className="fu-zone__sub">Solo PDF · Máx. 10MB</p>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={onInput} disabled={disabled || uploading} />
      {error && <span className="fu-error"><AlertTriangle size={12} style={{ verticalAlign: "-2px" }} /> {error}</span>}
      {hint && !error && <span className="fu-hint">{hint}</span>}

      <style jsx>{`
        .fu-wrap { display: flex; flex-direction: column; gap: 6px; }
        .fu-label { font-size: 13px; font-weight: 600; color: #ccc; }
        .fu-zone {
          border: 2px dashed #444; border-radius: 12px; padding: 28px 20px; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          background: #0d0d0d; transition: all .2s; min-height: 120px; justify-content: center;
        }
        .fu-zone:hover, .fu-zone--drag { border-color: #fff; background: rgba(255,255,255,0.04); }
        .fu-zone--loading { cursor: default; border-style: solid; border-color: #333; }
        .fu-zone__icon { font-size: 32px; }
        .fu-zone__text { font-size: 14px; color: #aaa; text-align: center; margin: 0; }
        .fu-zone__link { color: #fff; text-decoration: underline; }
        .fu-zone__sub { font-size: 11px; color: #666; margin: 0; }
        .fu-spinner {
          width: 36px; height: 36px; border: 3px solid #333; border-top-color: #fff;
          border-radius: 50%; animation: fu-spin .7s linear infinite;
        }
        @keyframes fu-spin { to { transform: rotate(360deg); } }
        .fu-pdf-card {
          background: #111; border: 1px solid #333; border-radius: 12px;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
        }
        .fu-pdf-card__icon { font-size: 32px; flex-shrink: 0; }
        .fu-pdf-card__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .fu-pdf-card__name { font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fu-pdf-card__link { font-size: 12px; color: #60a5fa; text-decoration: none; }
        .fu-pdf-card__link:hover { text-decoration: underline; }
        .fu-pdf-card__actions { display: flex; gap: 6px; flex-shrink: 0; }
        .fu-pdf-card__change {
          background: #222; color: #ccc; border: 1px solid #444; border-radius: 8px;
          padding: 5px 12px; font-size: 12px; cursor: pointer; transition: all .15s;
        }
        .fu-pdf-card__change:hover { background: #333; color: #fff; }
        .fu-pdf-card__remove {
          background: rgba(239,68,68,.15); color: #ef4444; border: 1px solid rgba(239,68,68,.3);
          border-radius: 8px; padding: 5px 10px; font-size: 12px; cursor: pointer;
        }
        .fu-error { font-size: 12px; color: #ef4444; }
        .fu-hint { font-size: 12px; color: #666; }
      `}</style>
    </div>
  );
}
