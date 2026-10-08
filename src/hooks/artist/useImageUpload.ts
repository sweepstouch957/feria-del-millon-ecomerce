import { useCallback, useState } from "react";
import { toast } from "sonner";

import { uploadCampaignImage } from "@services/upload.service";
import { imageFileProblem } from "@lib/artwork";

/* Subir la imagen de una obra.

   Primero por la ruta propia del sitio y, si esa falla, derecho a Cloudinary:
   el artista está cargando desde el celular en media feria y no le sirve que
   un proxy caído le cueste la obra. */
export function useImageUpload(onUploaded: (url: string) => void) {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file?: File | null) => {
      if (!file) return;

      const problem = imageFileProblem(file);
      if (problem) {
        toast.error(problem);
        return;
      }

      setUploading(true);
      try {
        const body = new FormData();
        body.append("image", file);
        body.append("folder", "artworks");
        const res = await fetch("/upload", { method: "POST", body });
        const json = await res.json();
        if (json?.url) {
          onUploaded(json.url);
          return;
        }
        throw new Error("sin url");
      } catch {
        try {
          const r = await uploadCampaignImage(file, "artworks");
          const url = (r as any)?.url;
          if (!url) throw new Error("sin url");
          onUploaded(url);
        } catch {
          toast.error("No se pudo subir la imagen");
        }
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  return { upload, uploading };
}
