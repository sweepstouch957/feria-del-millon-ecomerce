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

/** Paso 1 de la postulación: quién es el artista. */
export function ApplicationStepProfile({ cvUrl, setCvUrl, profilePhotoUrl, setProfilePhotoUrl, bio, setBio, onNext, isSaving }: ApplicationStepProfileProps) {
  const missing = [!profilePhotoUrl && "tu foto", !bio.trim() && "tu presentación", !cvUrl && "tu hoja de vida"].filter(Boolean) as string[];

  return (
    <>
      <section className="fdm-st-card fdm-ap-sec">
        <div className="hd">
          <h2 className="fdm-st-h3">1. Tu foto</h2>
          <span className="fdm-ap-help">Una foto tuya, de frente y con buena luz. Es la que acompaña tu nombre.</span>
        </div>
        <ImageUpload label="Foto de perfil" value={profilePhotoUrl} onChange={setProfilePhotoUrl} folder="convocatoria/profiles" />
      </section>

      <section className="fdm-st-card fdm-ap-sec">
        <div className="hd">
          <h2 className="fdm-st-h3">2. Preséntate</h2>
          <span className="fdm-ap-help">Cuéntale al jurado quién eres, en tus palabras.</span>
        </div>
        <div className="fdm-ap-field">
          <label htmlFor="ap-bio">Presentación <small>{bio.length} de 500 letras</small></label>
          <textarea
            id="ap-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={6}
            placeholder="Dónde naciste, qué técnicas trabajas, qué has expuesto, becas o premios…"
          />
        </div>
      </section>

      <section className="fdm-st-card fdm-ap-sec">
        <div className="hd">
          <h2 className="fdm-st-h3">3. Tu hoja de vida</h2>
          <span className="fdm-ap-help">Tu trayectoria artística en un PDF. Si la tienes en Word, guárdala como PDF.</span>
        </div>
        <PDFUpload label="Hoja de vida (PDF)" value={cvUrl} onChange={setCvUrl} />
      </section>

      <div className="fdm-st-bar">
        <span className="st">{missing.length ? <>Te falta <b>{missing.join(", ")}</b></> : <b>Perfil completo</b>}</span>
        <div className="acts">
          <button type="button" className="fdm-st-btn is-green is-main fdm-studio-plain" disabled={isSaving} onClick={onNext}>
            {isSaving ? "Guardando…" : "Guardar y seguir"}
          </button>
        </div>
      </div>
    </>
  );
}
