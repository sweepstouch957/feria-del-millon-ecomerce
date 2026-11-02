"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MY_PROJECT_KEY } from "@hooks/artist/useMyProject";
import { getMyProject, updateMyProject } from "@services/applications.service";
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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setBio(data?.bio || "");
    setPhoto(data?.profilePhotoUrl || "");
  }, [data?.bio, data?.profilePhotoUrl]);

  const save = useMutation({
    mutationFn: () => updateMyProject({ bio: bio.trim(), profilePhotoUrl: photo }),
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

  const dirty = bio.trim() !== (data?.bio || "") || photo !== (data?.profilePhotoUrl || "");

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 28, marginBottom: 28, borderBottom: hair(10) }}>
      <Eyebrow>Tu perfil público</Eyebrow>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: mix(10) }}>
          {photo && <img src={photo} alt="Tu foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
        </div>
        <label style={{ cursor: "pointer", textDecoration: "underline", fontSize: 14.5 }}>
          {uploading ? "Subiendo…" : "Cambiar foto"}
          <input hidden type="file" accept="image/*" disabled={uploading} onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>
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
        <StudioButton variant="ghost" disabled={!dirty || uploading || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Guardando…" : "Guardar perfil"}
        </StudioButton>
      </div>
    </section>
  );
}
