"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MY_PROJECT_KEY } from "@hooks/artist/useMyProject";
import { getMyProject, photoPosition, updateMyProject } from "@services/applications.service";
import { uploadImage } from "@services/upload.service";
import { Eyebrow, StudioButton } from "./ui";
import { fieldInput, hair, mix } from "./studioTheme";

const BIO_MAX = 500;

/** La foto y la bio de su página pública: se guardan aparte de las obras y del envío. */
export default function ArtistProfileCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: MY_PROJECT_KEY, queryFn: getMyProject, staleTime: 60_000 });
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoY, setPhotoY] = useState(25);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setBio(data?.bio || "");
    setPhoto(data?.profilePhotoUrl || "");
    setPhotoY(data?.profilePhotoY ?? 25);
  }, [data?.bio, data?.profilePhotoUrl, data?.profilePhotoY]);

  const save = useMutation({
    mutationFn: () => updateMyProject({ bio: bio.trim(), profilePhotoUrl: photo, profilePhotoY: photoY }),
    onSuccess: (p) => {
      qc.setQueryData(MY_PROJECT_KEY, { ...(data ?? {}), ...p });
      toast.success("Perfil guardado");
    },
    onError: () => toast.error("No se pudo guardar tu perfil"),
  });

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      setPhoto((await uploadImage(file, "artistas")).url);
    } catch {
      toast.error("No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const dirty =
    bio.trim() !== (data?.bio || "") || photo !== (data?.profilePhotoUrl || "") || photoY !== (data?.profilePhotoY ?? 25);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16, borderTop: hair(10) }}>
      <Eyebrow>Foto y presentación</Eyebrow>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: mix(10) }}>
          {photo && (
            <img
              src={photo}
              alt="Tu foto de perfil"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: photoPosition(photoY), display: "block" }}
            />
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ cursor: "pointer", textDecoration: "underline", fontSize: 14.5 }}>
            {uploading ? "Subiendo…" : "Cambiar foto"}
            <input hidden type="file" accept="image/*" disabled={uploading} onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
          {photo && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: mix(62) }}>
              Mover la foto arriba / abajo (que se vea tu cara)
              <input type="range" min={0} max={100} value={photoY} onChange={(e) => setPhotoY(Number(e.target.value))} style={{ width: 220 }} />
            </label>
          )}
        </div>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Eyebrow>Sobre ti ({bio.length}/{BIO_MAX})</Eyebrow>
        <textarea
          value={bio}
          maxLength={BIO_MAX}
          rows={4}
          onChange={(e) => setBio(e.target.value)}
          style={{ ...fieldInput, resize: "vertical" }}
        />
      </label>
      <div>
        <StudioButton variant="green" disabled={!dirty || uploading || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Guardando…" : "Guardar perfil"}
        </StudioButton>
      </div>
    </section>
  );
}
