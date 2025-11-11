/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Images, Loader2, Paintbrush2 } from "lucide-react";

import { SectionCard } from "@components/SectionCard";
import { Button } from "@components/ui/button";
import { FieldError } from "@components/ui/field-error";
import { RadixSelect } from "@components/ui/radix-select";

import { useAuth } from "@provider/authProvider";
import {
  createArtwork,
  type CreateArtworkDto,
  type ArtworkCategory,
} from "@services/artworks.service";
import { uploadCampaignImage } from "@services/upload.service";
import type { EventInfo } from "@services/events.service";

/* ──────────────────────────────────────────────
 * Schema
 * ────────────────────────────────────────────── */
const ArtworkSchema = z.object({
  title: z.string().min(2, "Nombre de la obra"),
  category: z.custom<ArtworkCategory>(
    (val) =>
      [
        "dibujo",
        "fotografia",
        "pintura",
        "escultura",
        "urbanismo-ciudad",
      ].includes(String(val)),
    "Categoría inválida"
  ),
  technique: z.string().optional(),
  size: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  description: z.string().optional(),
  images: z.any().optional(), // input<FileList>
});

type ArtworkFormValues = z.infer<typeof ArtworkSchema>;

type ArtworkFormProps = {
  event?: EventInfo; // <- lo pasas desde la page: <ArtworkForm event={eventData} />
};

export const ArtworkForm: React.FC<ArtworkFormProps> = ({ event }) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const artistId = user?.id;

  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(ArtworkSchema),
    defaultValues: {
      title: "",
      category: "dibujo",
      technique: "",
      size: "",
      price: undefined,
      year: undefined,
      description: "",
      images: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (vals: ArtworkFormValues) => {
      if (!artistId) throw new Error("No hay usuario autenticado.");
      const files: File[] = Array.from(
        (vals.images as FileList | undefined) ?? []
      );
      let uploadedUrls: string[] = [];
      if (files.length) {
        const ups = await Promise.all(
          files.map((f) => uploadCampaignImage(f, "artworks"))
        );
        uploadedUrls = ups.map((u) => u.url);
      }

      const dto: CreateArtworkDto = {
        title: vals.title,
        category: vals.category as ArtworkCategory,
        technique: vals.technique,
        size: vals.size,
        price: vals.price,
        year: vals.year,
        description: vals.description,
        images: uploadedUrls,
        artist: artistId,
        available: true,
        event: event?.id, // 👈 viene del prop
      };

      return createArtwork(dto);
    },
    onSuccess: async () => {
      toast.success("Obra creada");
      await qc.invalidateQueries({ queryKey: ["artworks"] });
      form.reset({
        title: "",
        category: "dibujo",
        technique: "",
        size: "",
        price: undefined,
        year: undefined,
        description: "",
        images: undefined,
      });
    },
    onError: (e: any) => {
      toast.error(
        e?.response?.data?.error || e?.message || "No se pudo crear la obra"
      );
    },
  });

  return (
    <SectionCard title="Crear Obra" icon={<Paintbrush2 className="size-5" />}>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        {/* Título */}
        <div className="grid gap-2">
          <Label.Root htmlFor="title" className="text-sm font-medium">
            Título
          </Label.Root>
          <input
            id="title"
            {...form.register("title")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="Nombre de la obra"
          />
          <FieldError msg={form.formState.errors.title?.message} />
        </div>

        {/* Categoría */}
        <div className="grid gap-2">
          <Label.Root className="text-sm font-medium">Categoría</Label.Root>
          <RadixSelect
            value={form.watch("category") as string}
            onValueChange={(v) =>
              form.setValue("category", v as ArtworkCategory, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            items={[
              { label: "Dibujo", value: "dibujo" },
              { label: "Fotografía", value: "fotografia" },
              { label: "Pintura", value: "pintura" },
              { label: "Escultura", value: "escultura" },
              { label: "Urbanismo / Ciudad", value: "urbanismo-ciudad" },
            ]}
          />
          <FieldError msg={form.formState.errors.category?.message as string} />
        </div>

        {/* Técnica */}
        <div className="grid gap-2">
          <Label.Root htmlFor="technique" className="text-sm font-medium">
            Técnica
          </Label.Root>
          <input
            id="technique"
            {...form.register("technique")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="Carboncillo sobre papel"
          />
        </div>

        {/* Dimensiones (texto) */}
        <div className="grid gap-2">
          <Label.Root htmlFor="size" className="text-sm font-medium">
            Dimensiones (texto)
          </Label.Root>
          <input
            id="size"
            {...form.register("size")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="75 x 75 cm"
          />
        </div>

        {/* Precio (opcional) */}
        <div className="grid gap-2">
          <Label.Root htmlFor="price" className="text-sm font-medium">
            Precio (COP)
          </Label.Root>
          <input
            id="price"
            type="number"
            {...form.register("price")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="2,300,000"
          />
          <FieldError msg={form.formState.errors.price?.message} />
        </div>

        {/* Año (opcional) */}
        <div className="grid gap-2">
          <Label.Root htmlFor="year" className="text-sm font-medium">
            Año
          </Label.Root>
          <input
            id="year"
            type="number"
            {...form.register("year")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="2024"
          />
          <FieldError msg={form.formState.errors.year?.message} />
        </div>

        {/* Descripción */}
        <div className="grid gap-2">
          <Label.Root htmlFor="description" className="text-sm font-medium">
            Descripción
          </Label.Root>
          <textarea
            id="description"
            rows={3}
            {...form.register("description")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="Breve descripción de la obra…"
          />
        </div>

        {/* Imágenes */}
        <div className="grid gap-2">
          <Label.Root htmlFor="images" className="text-sm font-medium">
            Imágenes (JPG/PNG)
          </Label.Root>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              form.setValue("images", e.target.files as any, {
                shouldDirty: true,
              })
            }
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none"
          />
          <p className="text-xs text-neutral-500 inline-flex items-center gap-1">
            <Images className="size-3.5" /> Se subirán a tu carpeta{" "}
            <b>artworks</b>.
          </p>
        </div>

        <Button
          type="submit"
          className="inline-flex items-center gap-2"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creando…
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Crear obra
            </>
          )}
        </Button>
      </form>
    </SectionCard>
  );
};
