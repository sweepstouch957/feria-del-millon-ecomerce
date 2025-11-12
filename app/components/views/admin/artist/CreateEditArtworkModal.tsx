"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Upload, Loader2, Image as ImgIcon, Save } from "lucide-react";
import { toast } from "sonner";

import {
  createArtwork,
  patchArtwork,
  type CreateArtworkInput,
  type PatchArtworkDto,
} from "@services/artworks.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { uploadCampaignImage } from "@services/upload.service";

// ========================= Schema =========================
const CURRENT_YEAR = new Date().getFullYear();

const FormSchema = z.object({
  title: z.string().min(2, "El título es requerido"),

  // Permite number o vacío (se transforma a undefined)
  price: z
    .union([z.coerce.number().int().min(0, "Precio inválido"), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),

  currency: z.string().default("COP").optional(),

  // Permite URL válida o vacío (se transforma a undefined)
  image: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  description: z.string().optional(),

  // Permite número válido, vacío o NaN (se transforma a undefined)
  year: z
    .union([
      z.coerce.number().int().min(1800).max(CURRENT_YEAR),
      z.nan(),
      z.string().length(0),
    ])
    .optional()
    .transform((v) =>
      typeof v === "number" && !Number.isNaN(v) ? v : undefined
    ),

  stock: z
    .union([z.coerce.number().int().min(0), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),

  dimensions: z.string().optional(),

  technique: z.string().min(1, "Selecciona una técnica"),

  pavilion: z.string().optional(),

  tagId: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

// ========================= Utils =========================
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

// ========================= Component =========================
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

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    // 👇 Alineamos los tipos del resolver con el genérico del formulario
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    // 👇 Defaults seguros (parcial): no forzamos números vacíos
    defaultValues: {
      title: "",
      currency: "COP",
      technique: "",
      price: undefined,
      year: undefined,
      stock: undefined,
      image: "",
      description: "",
      dimensions: "",
      pavilion: "",
      tagId: "",
    } as Partial<FormValues>,
  });

  const imageUrl = watch("image");

  // Cargar datos si estamos editando
  useEffect(() => {
    if (!editingId) {
      reset({
        title: "",
        price: undefined,
        currency: "COP",
        image: "",
        description: "",
        year: undefined,
        stock: undefined,
        dimensions: "",
        technique: "",
        pavilion: "",
        tagId: "",
      });
      return;
    }

    const row = (currentRows || []).find((r) => r.id === editingId);
    if (!row) return;

    setValue("title", row.title || "");
    setValue("price", (row.price as any) ?? undefined);
    setValue("currency", row.currency || "COP");
    setValue("description", row.description || "");
    setValue("year", (row.year as any) ?? undefined);
    setValue("stock", (row.stock as any) ?? undefined);
    setValue("dimensions", (row as any)?.dimensionsText || "");
    setValue(
      "technique",
      ((row as any)?.techniqueInfo?._id || (row as any)?.technique || "") as any
    );
    setValue(
      "pavilion",
      ((row as any)?.pavilionInfo?._id || (row as any)?.pavilion || "") as any
    );
    setValue("tagId", (row as any)?.tagId || "");
    setValue("image", row.image || "");
  }, [editingId, currentRows, reset, setValue]);

  // ========================= Mutations =========================
  const mCreate = useMutation({
    mutationFn: async (payload: CreateArtworkInput) => createArtwork(payload),
    onSuccess: () => {
      toast.success("Obra creada ✨");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      onDone();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || "Error creando la obra");
    },
  });

  const mPatch = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: PatchArtworkDto;
    }) => patchArtwork(id, payload),
    onSuccess: (resp) => {
      toast.success("Obra actualizada ✅");
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork-detail", resp.doc.id] });
      onDone();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error || "Error actualizando la obra");
    },
  });

  // ========================= Submit =========================
  const onSubmit = handleSubmit(async (form) => {
    const baseSlug = slugify(form.title);

    if (editingId) {
      const payload: PatchArtworkDto = {
        title: form.title,
        slug: baseSlug,
        description: form.description,
        price: form.price,
        currency: form.currency || "COP",
        stock: form.stock,
        image: form.image,
        event: eventId,
        pavilion: form.pavilion || null,
        technique: form.technique,
        tags: form.tagId ? [form.tagId] : undefined,
        status: "published",
      };
      await mPatch.mutateAsync({ id: editingId, payload });
      return;
    }

    const createPayload: CreateArtworkInput = {
      event: eventId,
      artist: artistId,
      pavilion: form.pavilion || null,
      technique: form.technique,
      title: form.title,
      slug: baseSlug,
      year: form.year,
      description: form.description,
      price: form.price,
      currency: form.currency || "COP",
      stock: form.stock,
      image: form.image,
      tags: form.tagId ? [form.tagId] : undefined,
      status: "published",
    };
    await mCreate.mutateAsync(createPayload);
  });

  // ========================= Upload =========================
  const onUploadFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("folder", "artworks");
      const res = await fetch("/upload", { method: "POST", body: form });
      const json = await res.json();
      if (json?.url) {
        setValue("image", json.url);
        return;
      }
      throw new Error("fallback");
    } catch {
      try {
        const r = await uploadCampaignImage(file!, "artworks");
        setValue("image", (r as any)?.url);
      } catch {
        toast.error("No se pudo subir la imagen");
      }
    }
  };

  const closingDisabled = isSubmitting || mCreate.isPending || mPatch.isPending;

  // ========================= Render =========================
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !closingDisabled && onOpenChange(v)}
    >
      <DialogContent
        // Evita cierre por click fuera o ESC cuando está enviando
        onInteractOutside={(e) => closingDisabled && e.preventDefault()}
        onEscapeKeyDown={(e) => closingDisabled && e.preventDefault()}
        className="max-w-3xl p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl font-bold">
            {editingId ? "Editar obra" : "Crear obra"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Completa los campos para {editingId ? "actualizar" : "publicar"} tu
            obra.
          </DialogDescription>
        </DialogHeader>

        {/* Contenedor con scroll propio para evitar que se “pierda” el contenido */}
        <div className="px-6 pb-6 max-h-[75vh] overflow-y-auto">
          <form
            className="grid md:grid-cols-3 gap-4"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Título *</label>
                <Input {...register("title")} placeholder="Nombre de la obra" />
                {errors.title && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Precio (COP)</label>
                <Input
                  type="number"
                  {...register("price")}
                  placeholder="1200000"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Técnica *</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  {...register("technique")}
                >
                  <option value="">Selecciona técnica</option>
                  {(techniqueOptions || []).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.technique && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.technique.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Pabellón</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  {...register("pavilion")}
                >
                  <option value="">Sin pabellón</option>
                  {(pavilionOptions || []).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Año</label>
                <Input
                  type="number"
                  {...register("year")}
                  placeholder={`${CURRENT_YEAR}`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Stock</label>
                <Input type="number" {...register("stock")} placeholder="1" />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Descripción</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 min-h-[120px]"
                  placeholder="Describe la obra…"
                  {...register("description")}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Dimensiones</label>
                <Input
                  {...register("dimensions")}
                  placeholder="42.3 CM x 34.5 CM"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Tag ID</label>
                <Input {...register("tagId")} placeholder="13792" />
              </div>
            </div>

            {/* Imagen + acciones */}
            <div className="space-y-4">
              <div className="w-full rounded-xl border bg-gray-50 aspect-[4/3] overflow-hidden grid place-items-center text-gray-400 text-sm">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImgIcon className="w-6 h-6" />
                    Vista previa (pega URL o sube archivo)
                  </div>
                )}
              </div>

              <label className="text-sm text-gray-600">URL de la imagen</label>
              <Input {...register("image")} placeholder="https://…" />

              <div>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onUploadFile(e.target.files?.[0])}
                />
                <label
                  htmlFor="file-input"
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Subir imagen
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || mCreate.isPending || mPatch.isPending}
                className="w-full"
              >
                {(isSubmitting || mCreate.isPending || mPatch.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Guardar cambios" : "Crear obra"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
