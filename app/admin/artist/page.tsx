"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QrCode, Paintbrush2, Layers, Calendar, MapPin } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";

// Auth
import { useAuth } from "@provider/authProvider";

// Services
import { getArtworks, type Artwork } from "@services/artworks.service";
import { type EventInfo } from "@services/events.service";
import { getCopies, type Copy } from "@services/copies.service";

// Hook: evento por artista
import { useArtistEvent } from "@hooks/queries/useArtistEvent";

// UI
import { SectionCard } from "@components/SectionCard";
import { formatCOP } from "@lib/utils";
import { EmptyState } from "@components/ui/empty";

// Formularios integrados con React Query internamente
import { ArtworkForm } from "@components/forms/artworks"; // (sin cambios, si ya lo tienes)
import { EditionForm } from "@components/forms/edition"; // (actualizado abajo)
import { CopyForm } from "@components/forms/copy"; // (actualizado abajo)

/* ──────────────────────────────────────────────────────────────
 * Mini-hooks de consulta en el contenedor
 * ────────────────────────────────────────────────────────────── */
function useArtworksByArtist(artistId?: string) {
  return useQuery({
    queryKey: ["artworks", { artist: artistId }],
    enabled: Boolean(artistId),
    queryFn: () =>
      getArtworks({ artist: artistId!, limit: 100, sort: "-createdAt" }),
  });
}

function useCopiesByEventForArtworks(
  eventId?: string,
  artworkIds?: Set<string>
) {
  const enabled = Boolean(eventId);
  const query = useQuery({
    queryKey: ["copies", { event: eventId }],
    enabled,
    queryFn: () =>
      getCopies({ event: eventId!, limit: 100, sort: "-createdAt" }),
  });

  const docs = query.data?.docs ?? [];
  const filtered = React.useMemo(
    () => (artworkIds ? docs.filter((c) => artworkIds.has(c.artwork)) : docs),
    [docs, artworkIds]
  );

  return { ...query, filtered };
}

/* ──────────────────────────────────────────────────────────────
 * UI helpers
 * ────────────────────────────────────────────────────────────── */
const SkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-60 animate-pulse rounded-xl bg-neutral-100" />
    ))}
  </div>
);

const EventBadge: React.FC<{ event?: EventInfo }> = ({ event }) => {
  if (!event) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black text-white px-3 py-1.5 text-sm">
      <Calendar className="size-4" />
      <span>{event.name}</span>
      {event.location && (
        <>
          <span className="opacity-50">•</span>
          <div className="inline-flex items-center gap-1">
            <MapPin className="size-4" />
            {event.location}
          </div>
        </>
      )}
    </div>
  );
};

const ArtworkCardItem: React.FC<{ artwork: Artwork }> = ({ artwork }) => {
  const cover = artwork.images?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
    >
      <div className="relative aspect-square bg-neutral-50">
        {cover ? (
          <Image
            src={cover}
            alt={artwork.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <Paintbrush2 className="size-10" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-medium">{artwork.title}</div>
        <div className="mt-1 text-xs text-neutral-500">
          {artwork.category} {artwork.year ? `• ${artwork.year}` : ""}
        </div>
        <div className="mt-3 space-y-1">
          {(artwork.editions ?? []).length ? (
            artwork.editions!.map((ed) => (
              <div
                key={ed.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-neutral-600">
                  {ed.label ?? "Edición"}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">
                  {ed.price != null ? formatCOP(ed.price) : ed.currency || "—"}
                </span>
              </div>
            ))
          ) : (
            <span className="text-xs text-neutral-400">Sin ediciones</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ArtworkGrid: React.FC<{ artworks: Artwork[]; loading?: boolean }> = ({
  artworks,
  loading,
}) => (
  <SectionCard title="Tus Obras" icon={<Paintbrush2 className="size-5" />}>
    {loading ? (
      <SkeletonGrid />
    ) : artworks.length === 0 ? (
      <EmptyState
        icon={<Paintbrush2 className="size-8" />}
        title="Aún no has subido obras"
        subtitle="Crea tu primera obra desde el formulario de la izquierda."
      />
    ) : (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((a) => (
          <ArtworkCardItem key={a.id} artwork={a} />
        ))}
      </div>
    )}
  </SectionCard>
);

const QRCopiesGrid: React.FC<{ copies: Copy[]; loading?: boolean }> = ({
  copies,
  loading,
}) => (
  <SectionCard
    title="Copias Recientes (QR)"
    icon={<QrCode className="size-5" />}
  >
    {loading ? (
      <SkeletonGrid />
    ) : copies.length === 0 ? (
      <EmptyState
        icon={<QrCode className="size-7" />}
        title="Sin copias aún"
        subtitle="Cuando generes copias, verás aquí sus QR."
      />
    ) : (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {copies.map((c) => (
          <div
            key={c.id}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            <div className="aspect-square bg-neutral-50 relative">
              {c.qrImageUrl ? (
                <Image
                  src={c.qrImageUrl}
                  alt={`QR ${c.serial ?? c.id}`}
                  fill
                  className="object-contain p-6"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  <QrCode className="size-10" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-sm font-medium">
                {c.serial ?? "Sin serial"}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Estado: <b>{c.status}</b>
              </div>
              {c.price != null && (
                <div className="mt-1 text-xs text-neutral-500">
                  {formatCOP(c.price)}
                </div>
              )}
              {c.qrUrl && (
                <Link
                  href={c.qrUrl}
                  target="_blank"
                  className="mt-3 inline-block text-sm underline underline-offset-4"
                >
                  Ver destino QR
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);

/* ──────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────── */
export default function ArtistInventoryPage() {
  const { user } = useAuth();
  const artistId = user?.id;

  // Evento asignado al artista
  const { data: eventData } = useArtistEvent(artistId);

  // Artworks
  const { data: artworksData, isLoading: loadingArtworks } =
    useArtworksByArtist(artistId);
  const myArtworks = artworksData?.docs ?? [];
  const myArtworkIds:any = React.useMemo(
    () => new Set(myArtworks.map((a) => a.id)),
    [myArtworks]
  );

  // Copias filtradas por mis obras (en el evento)
  const { filtered: myCopies, isLoading: loadingCopies } =
    useCopiesByEventForArtworks(eventData?.id, myArtworkIds);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Inventario del Artista
            </h1>
            <p className="text-sm text-neutral-500">
              Sube tus obras, crea ediciones y genera copias con QR para el
              evento asignado.
            </p>
          </div>
          <EventBadge event={eventData as EventInfo | undefined} />
        </div>

        <Tabs.Root defaultValue="artwork" className="grid gap-6">
          <Tabs.List className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
            <Tabs.Trigger
              value="artwork"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <div className="inline-flex items-center gap-2">
                <Paintbrush2 className="size-4" />
                <span>Nueva Obra</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="edition"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <div className="inline-flex items-center gap-2">
                <Layers className="size-4" />
                <span>Nueva Edición</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="copy"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <div className="inline-flex items-center gap-2">
                <QrCode className="size-4" />
                <span>Nueva Copia</span>
              </div>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Tab: Obra */}
          <Tabs.Content
            value="artwork"
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            <ArtworkForm event={eventData} />{" "}
            {/* usa React Query internamente */}
            <div className="md:col-span-2">
              <ArtworkGrid artworks={myArtworks} loading={loadingArtworks} />
            </div>
          </Tabs.Content>

          {/* Tab: Edición */}
          <Tabs.Content
            value="edition"
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            <EditionForm event={eventData} artworks={myArtworks} />{" "}
            {/* usa React Query internamente */}
            <div className="md:col-span-2" />
          </Tabs.Content>

          {/* Tab: Copia */}
          <Tabs.Content
            value="copy"
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            <CopyForm event={eventData} artworks={myArtworks} />{" "}
            {/* usa React Query internamente */}
            <div className="md:col-span-2">
              <QRCopiesGrid copies={myCopies} loading={loadingCopies} />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
