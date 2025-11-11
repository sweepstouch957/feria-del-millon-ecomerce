/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Label from "@radix-ui/react-label";
import { Artwork, getEditionsByArtwork } from "@services/artworks.service";
import { EventInfo } from "@services/events.service";
import { SectionCard } from "@components/SectionCard";
import { Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { RadixSelect } from "@components/ui/radix-select";
import { FieldError } from "@components/ui/field-error";
import { toSelectItems } from "@lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCopy as createCopySvc } from "@services/copies.service";
import { toast } from "sonner";

const CopySchema = z.object({
  eventId: z.string().min(1, "Evento requerido"),
  editionId: z.string().min(1, "Selecciona una edición"),
  price: z.coerce.number().min(0, "Precio inválido"),
  serial: z.string().optional(),
  customDimensions: z.string().optional(),
  notes: z.string().optional(),
});

type CopyFormValues = z.infer<typeof CopySchema>;

type Props = {
  event?: EventInfo;
  artworks: Artwork[];
};

function useSyncEventIdIntoForm(
  setValue: (k: any, v: any) => void,
  eventId?: string
) {
  useEffect(() => {
    if (eventId) setValue("eventId", eventId);
  }, [eventId, setValue]);
}

export const CopyForm: React.FC<Props> = ({ event, artworks }) => {
  const qc = useQueryClient();

  const form = useForm<CopyFormValues>({
    resolver: zodResolver(CopySchema),
    defaultValues: {
      eventId: event?.id ?? "",
      editionId: "",
      price: 0,
      serial: "",
      customDimensions: "",
      notes: "",
    },
  });

  const [selectedArtworkId, setSelectedArtworkId] = useState<string>("");

  // Carga ediciones cuando seleccionas obra
  const editionsQuery = useQuery({
    enabled: Boolean(selectedArtworkId),
    queryKey: ["editions", "by-artwork", selectedArtworkId],
    queryFn: () =>
      getEditionsByArtwork(selectedArtworkId, {
        limit: 100,
        sort: "-createdAt",
      }),
  });

  useSyncEventIdIntoForm(form.setValue, event?.id);

  const mutation = useMutation({
    mutationFn: async (vals: CopyFormValues) =>
      createCopySvc({
        editionId: vals.editionId,
        price: vals.price,
        serial: vals.serial,
        customDimensions: vals.customDimensions,
        notes: vals.notes,
      }),
    onSuccess: async () => {
      toast.success("Copia creada y QR generado");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["copies"] }),
        qc.invalidateQueries({ queryKey: ["artworks"] }),
      ]);
      form.reset({
        eventId: event?.id ?? "",
        editionId: "",
        price: 0,
        serial: "",
        customDimensions: "",
        notes: "",
      });
    },
    onError: (e: any) => {
      toast.error(
        e?.response?.data?.error || e?.message || "No se pudo crear la copia"
      );
    },
  });

  const editionItems = toSelectItems(
    editionsQuery.data?.docs ?? [],
    (ed) => ed.label ?? "Edición",
    (ed) => ed.id
  );

  return (
    <SectionCard
      title="Generar Copia (QR)"
      icon={<QrCode className="size-5" />}
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((vals) => mutation.mutate(vals))}
      >
        <div className="grid gap-2">
          <Label.Root className="text-sm font-medium">
            Evento asignado
          </Label.Root>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
            {event?.name ?? "—"}
          </div>
        </div>

        <div className="grid gap-2">
          <Label.Root className="text-sm font-medium">Obra</Label.Root>
          <RadixSelect
            value={selectedArtworkId}
            onValueChange={(v) => {
              setSelectedArtworkId(v);
              form.setValue("editionId", "");
            }}
            items={toSelectItems(
              artworks,
              (a) => a.title,
              (a) => a.id
            )}
            placeholder="Selecciona una obra"
          />
        </div>

        <div className="grid gap-2">
          <Label.Root className="text-sm font-medium">Edición</Label.Root>
          <RadixSelect
            value={form.watch("editionId")}
            onValueChange={(v) => form.setValue("editionId", v)}
            items={editionItems}
            placeholder={
              editionsQuery.isLoading ? "Cargando..." : "Selecciona una edición"
            }
          />
          <FieldError msg={form.formState.errors.editionId?.message} />
        </div>

        <div className="grid gap-2">
          <Label.Root htmlFor="copy-price" className="text-sm font-medium">
            Precio de la copia (COP)
          </Label.Root>
          <input
            id="copy-price"
            type="number"
            {...form.register("price")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="2,200,000"
          />
          <FieldError msg={form.formState.errors.price?.message} />
        </div>

        <div className="grid gap-2">
          <Label.Root htmlFor="serial" className="text-sm font-medium">
            Serial (opcional)
          </Label.Root>
          <input
            id="serial"
            {...form.register("serial")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="Dejar vacío para autogenerado"
          />
        </div>

        <div className="grid gap-2">
          <Label.Root
            htmlFor="customDimensions"
            className="text-sm font-medium"
          >
            Dimensiones personalizadas (opcional)
          </Label.Root>
          <input
            id="customDimensions"
            {...form.register("customDimensions")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder='Ej. "140 x 110, marco blanco"'
          />
        </div>

        <div className="grid gap-2">
          <Label.Root htmlFor="notes" className="text-sm font-medium">
            Notas (opcional)
          </Label.Root>
          <textarea
            id="notes"
            rows={3}
            {...form.register("notes")}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            placeholder="Observaciones…"
          />
        </div>

        <input type="hidden" value={form.watch("eventId")} readOnly />

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generando QR…
            </>
          ) : (
            <>
              <QrCode className="size-4" />
              Crear copia
            </>
          )}
        </Button>
      </form>
    </SectionCard>
  );
};
