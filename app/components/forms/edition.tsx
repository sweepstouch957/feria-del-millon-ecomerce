/* eslint-disable @typescript-eslint/no-explicit-any */
import { SectionCard } from "@components/SectionCard";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Artwork,
  createEdition,
  getEditionsByArtwork,
} from "@services/artworks.service";
import { EventInfo } from "@services/events.service";
import { CheckCircle2, Layers, Loader2, PackagePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import * as Label from "@radix-ui/react-label";
import z from "zod";
import { RadixSelect } from "@components/ui/radix-select";
import { formatCOP, toSelectItems } from "@lib/utils";
import { FieldError } from "@components/ui/field-error";
import { Button } from "@components/ui/button";
import { EmptyState } from "@components/ui/empty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const EditionSchema = z.object({
  artworkId: z.string().min(1, "Selecciona una obra"),
  label: z.string().min(1, "Etiqueta de edición (ej. 1/6)"),
  support: z.string().optional(), // p.ej. "Papel Zerkall"
  currency: z.string().default("COP"),
  stock: z.coerce.number().int().min(1).default(1),
  status: z.enum(["active", "inactive"]).default("active"),
  // 👉 sin price en el form
});

type EditionFormValues = z.infer<typeof EditionSchema>;

type Props = {
  event?: any;
  artworks: Artwork[];
};

export const EditionForm: React.FC<Props> = ({ event, artworks }) => {
  const qc = useQueryClient();

  const form = useForm<EditionFormValues>({
    resolver: zodResolver(EditionSchema),
    defaultValues: {
      artworkId: "",
      label: "",
      support: "",
      currency: "COP",
      stock: 1,
      status: "active",
    },
  });

  const artworkId = form.watch("artworkId");
  const editionsQuery = useQuery({
    enabled: Boolean(artworkId),
    queryKey: ["editions", "by-artwork", artworkId],
    queryFn: () =>
      getEditionsByArtwork(artworkId, { limit: 100, sort: "-createdAt" }),
  });

  const mutation = useMutation({
    mutationFn: async (vals: EditionFormValues) => {
      if (!event?.id) throw new Error("No hay evento asignado al artista.");
      // Fijamos un price base en 0 o lo que defina backend (tu controller actual lo requiere).
      return createEdition({
        event: event.id,
        artwork: vals.artworkId,
        label: vals.label,
        support: vals.support,
        currency: vals.currency,
        stock: vals.stock,
        status: vals.status,
        price: 0, // 👉 si en backend lo vuelves opcional, cambia a price?: number y elimínalo aquí
        // copies: [{ price: 0 }], // opcional si quieres crear QR al vuelo
      });
    },
    onSuccess: async () => {
      toast.success("Edición agregada");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["artworks"] }),
        qc.invalidateQueries({
          queryKey: ["editions", "by-artwork", artworkId],
        }),
      ]);
      form.reset({
        artworkId: "",
        label: "",
        support: "",
        currency: "COP",
        stock: 1,
        status: "active",
      });
    },
    onError: (e: any) => {
      toast.error(
        e?.response?.data?.error || e?.message || "No se pudo crear la edición"
      );
    },
  });

  return (
    <>
      <SectionCard title="Agregar Edición" icon={<Layers className="size-5" />}>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          {/* Obra */}
          <div className="grid gap-2">
            <Label.Root className="text-sm font-medium">Obra</Label.Root>
            <RadixSelect
              value={form.watch("artworkId") || undefined}
              onValueChange={(v) =>
                form.setValue("artworkId", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              items={toSelectItems(
                artworks,
                (a) => a.title,
                (a) => a.id
              )}
              placeholder="Selecciona una obra"
            />
            <FieldError msg={form.formState.errors.artworkId?.message} />
          </div>

          {/* Etiqueta */}
          <div className="grid gap-2">
            <Label.Root htmlFor="label" className="text-sm font-medium">
              Etiqueta (ej. 1/6)
            </Label.Root>
            <input
              id="label"
              {...form.register("label")}
              className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
            <FieldError msg={form.formState.errors.label?.message} />
          </div>

          {/* Soporte */}
          <div className="grid gap-2">
            <Label.Root htmlFor="support" className="text-sm font-medium">
              Soporte (opcional)
            </Label.Root>
            <input
              id="support"
              {...form.register("support")}
              className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              placeholder='Ej. "Papel Zerkall"'
            />
            <FieldError msg={form.formState.errors.support?.message} />
          </div>

          {/* Moneda */}
          <div className="grid gap-2">
            <Label.Root className="text-sm font-medium">Moneda</Label.Root>
            <RadixSelect
              value={form.watch("currency") || "COP"}
              onValueChange={(v) =>
                form.setValue("currency", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              items={[
                { label: "COP (peso colombiano)", value: "COP" },
                { label: "USD (dólar)", value: "USD" },
                { label: "EUR (euro)", value: "EUR" },
              ]}
              placeholder="Selecciona moneda"
            />
            <FieldError msg={form.formState.errors.currency?.message} />
          </div>

          {/* Stock */}
          <div className="grid gap-2">
            <Label.Root htmlFor="stock" className="text-sm font-medium">
              Stock (unidades)
            </Label.Root>
            <input
              id="stock"
              type="number"
              min={1}
              {...form.register("stock")}
              className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              placeholder="1"
            />
            <FieldError msg={form.formState.errors.stock?.message} />
          </div>

          {/* Estado */}
          <div className="grid gap-2">
            <Label.Root className="text-sm font-medium">Estado</Label.Root>
            <RadixSelect
              value={form.watch("status") || "active"}
              onValueChange={(v) =>
                form.setValue("status", v as "active" | "inactive", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              items={[
                { label: "Activa", value: "active" },
                { label: "Inactiva", value: "inactive" },
              ]}
              placeholder="Selecciona estado"
            />
            <FieldError msg={form.formState.errors.status?.message} />
          </div>

          {/* Botón */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <PackagePlus className="size-4" />
                Agregar edición
              </>
            )}
          </Button>
        </form>
      </SectionCard>

      {/* Vista de ediciones de la obra seleccionada */}
      <SectionCard
        title="Ediciones de la Obra"
        icon={<Layers className="size-5" />}
      >
        {artworkId ? (
          <div className="grid gap-4">
            <div className="text-sm text-neutral-600">
              Obra seleccionada:{" "}
              <b>{artworks.find((a) => a.id === artworkId)?.title}</b>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {editionsQuery.isLoading ? (
                <div className="h-40 animate-pulse rounded-xl bg-neutral-100" />
              ) : (editionsQuery.data?.docs?.length ?? 0) > 0 ? (
                editionsQuery.data!.docs.map((ed) => (
                  <div
                    key={ed.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{ed.label ?? "Edición"}</div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                        {ed.price != null
                          ? formatCOP(ed.price)
                          : ed.currency || "—"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {ed.support ? `Soporte: ${ed.support}` : "—"}
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">
                      {ed.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="size-3.5" /> Activa
                        </span>
                      ) : (
                        <span>Inactiva</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<Layers className="size-7" />}
                  title="Sin ediciones"
                  subtitle="Agrega ediciones desde el formulario."
                />
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Layers className="size-7" />}
            title="Selecciona una obra"
            subtitle="Elige una obra para ver/crear sus ediciones."
          />
        )}
      </SectionCard>
    </>
  );
};
