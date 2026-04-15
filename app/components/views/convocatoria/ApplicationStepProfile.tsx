"use client";
import { ImageUpload, PDFUpload } from "@components/ui/FileUpload";

interface ApplicationStepProfileProps {
  cvUrl: string;
  setCvUrl: (url: string) => void;
  profilePhotoUrl: string;
  setProfilePhotoUrl: (url: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  onBack?: () => void;
  onNext: () => void;
  isSaving: boolean;
}

export function ApplicationStepProfile({
  cvUrl,
  setCvUrl,
  profilePhotoUrl,
  setProfilePhotoUrl,
  bio,
  setBio,
  onBack,
  onNext,
  isSaving
}: ApplicationStepProfileProps) {
  return (
    <div className="app-section">
      <h2 className="app-section__title">👤 Perfil del artista</h2>
      <p className="app-section__desc">Completa tu información personal antes de continuar con el proyecto.</p>

      <div className="app-field">
        <PDFUpload
          label="Tu CV (PDF) *"
          value={cvUrl}
          onChange={setCvUrl}
          hint="Formato PDF · Máx. 10MB · Se sube de forma segura a nuestro almacenamiento"
        />
      </div>

      <div className="app-field">
        <ImageUpload
          label="Foto de perfil *"
          value={profilePhotoUrl}
          onChange={setProfilePhotoUrl}
          folder="convocatoria/profiles"
          hint="640×480 px mínimo · JPG o PNG · Foto profesional, buena iluminación"
        />
      </div>

      <div className="app-field">
        <label>Biografía * <span className="app-chars">{bio.length}/500</span></label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder="Ciudad de nacimiento, grupo poblacional, técnicas y trayectoria artística, becas, premios…"
        />
      </div>

      <div className="app-actions">
        {onBack && (
          <button className="app-btn-secondary" onClick={onBack}>← Atrás</button>
        )}
        <button className="app-btn-primary" disabled={isSaving} onClick={onNext}>
          {isSaving ? "Guardando…" : "Guardar y continuar →"}
        </button>
      </div>
    </div>
  );
}
