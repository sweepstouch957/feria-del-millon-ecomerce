"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Landmark,
  User,
  Palette,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";

import { useEventArtists } from "@hooks/queries/useEventArtists";
import { DEFAULT_EVENT_ID, DEFAULT_EVENT_NAME, FIXED_PAVILION_ID, FIXED_PAVILION_NAME } from "@core/constants";


const PAGE_SIZE = 24;

function StatCard({
  icon,
  value,
  label,
  bg = "bg-white",
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  bg?: string;
}) {
  return (
    <div
      className={`${bg} rounded-2xl shadow-md p-6 text-center border border-gray-100`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
        {value}
      </h3>
      <p className="text-gray-600">{label}</p>
    </div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <div className="h-64 w-full bg-gray-100 animate-pulse" />
      <div className="p-6 space-y-4">
        <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

export default function ArtistsPage() {
  // filtros UI
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPavilion, setSelectedPavilion] = useState<string>(FIXED_PAVILION_ID);
  const [sort, setSort] = useState<"artworks" | "name">("artworks");
  const [page, setPage] = useState(1);


  const pavilionId = selectedPavilion !== "all" ? selectedPavilion : undefined;

  // Artistas con stats
  const { data, isFetching, error } = useEventArtists(
    DEFAULT_EVENT_ID,
    {
      q: searchTerm,
      pavilionId,
      sort,
      page,
      limit: PAGE_SIZE,
    },
    {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    }
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // KPI: total de obras en la página actual (y podrías mostrar total global si lo agregas en backend)
  const totalArtworksOnPage = useMemo(
    () => rows.reduce((acc, r) => acc + (r.stats?.totalArtworks ?? 0), 0),
    [rows]
  );

  const headerSubtitle = useMemo(() => {
    if (searchTerm && pavilionId)
      return `Artistas en ${DEFAULT_EVENT_NAME} • Filtro: “${searchTerm}”, Pabellón seleccionado`;
    if (searchTerm)
      return `Artistas en ${DEFAULT_EVENT_NAME} • Resultados para “${searchTerm}”`;
    if (pavilionId)
      return `Artistas en ${DEFAULT_EVENT_NAME} • Filtrado por pabellón`;
    return `Explora el talento de ${DEFAULT_EVENT_NAME}`;
  }, [searchTerm, pavilionId]);

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Curaduría {new Date().getFullYear()}
          </div>
          <h1 className="mt-3 text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            Artistas de la {DEFAULT_EVENT_NAME}
          </h1>
          <p className="mt-3 text-lg text-gray-600">{headerSubtitle}</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o email…"
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="pl-10"
              />
            </div>

            {/* Pabellón */}
            <div>
              <select
                value={selectedPavilion}
                onChange={(e) => {
                  setPage(1);
                  setSelectedPavilion(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value={FIXED_PAVILION_ID}>{FIXED_PAVILION_NAME}</option>
              </select>
            </div>

            {/* Orden */}
            <div>
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value as "artworks" | "name");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="artworks">Ordenar por # de obras</option>
                <option value="name">Ordenar por nombre</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <StatCard
            icon={<User className="h-8 w-8 text-gray-900" />}
            value={total}
            label="Artistas encontrados"
          />
          <StatCard
            icon={<Palette className="h-8 w-8 text-gray-900" />}
            value={totalArtworksOnPage}
            label="Obras (página actual)"
          />
          <StatCard
            icon={<Landmark className="h-8 w-8 text-gray-900" />}
            value={1}
            label="Pabellones"
          />
        </div>

        {/* Info de conteo */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <p>
            Mostrando <span className="font-semibold">{rows.length}</span> de{" "}
            <span className="font-semibold">{total}</span> artistas
          </p>
          <p>
            Página <span className="font-semibold">{page}</span> de{" "}
            <span className="font-semibold">{totalPages}</span>
          </p>
        </div>

        {/* Grid */}
        {isFetching ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <ArtistSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-lg text-red-600 font-medium">
              Ocurrió un error cargando los artistas.
            </p>
            <p className="text-gray-500">Intenta de nuevo en unos segundos.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <User className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron artistas
            </h3>
            <p className="text-gray-500">
              Ajusta los filtros o cambia el término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rows.map((r) => {
              const artist = r.artist;
              const byPavilion = r.stats?.byPavilion || [];
              const sampleCover  = artist?.image || "/api/placeholder/1200/800"; // si luego quieres traer cover del artista, cámbialo aquí

              return (
                <div
                  key={artist.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 group hover:shadow-xl transition-all"
                >
                  {/* Cover */}
                  <div className="relative">
                    <Image
                      src={sampleCover}
                      alt={artist.name}
                      width={1200}
                      height={800}
                      className="w-full h-64 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{artist.name}</h3>
                      <p className="text-sm opacity-90">
                        {r.stats?.totalArtworks ?? 0}{" "}
                        {(r.stats?.totalArtworks ?? 0) === 1 ? "obra" : "obras"}
                      </p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    {/* Pabellones */}
                    {byPavilion.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {byPavilion.slice(0, 3).map((p) => (
                          <Link
                            key={String(p.pavilionId)}
                            href={`/pabellones/${p.slug}`}
                            className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full transition"
                          >
                            <Landmark className="w-3.5 h-3.5" />
                            <span className="font-medium">
                              {p.name ?? "Pabellón"}
                            </span>
                            <span className="opacity-70">
                              · {p.artworksCount}
                            </span>
                          </Link>
                        ))}
                        {byPavilion.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{byPavilion.length - 3} pab.
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Sin pabellón asignado
                      </p>
                    )}

                    {/* Acciones */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/catalogo?artistId=${encodeURIComponent(
                          artist.id
                        )}`}
                        className="col-span-2"
                      >
                        <Button className="w-full" variant="outline">
                          Ver todas sus obras
                        </Button>
                      </Link>
                      {/* Si quieres mostrar email/rol */}
                      {/* <Button disabled className="w-full" variant="ghost">@{artist.email?.split("@")[0]}</Button> */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        <div className="flex items-center justify-between mt-10">
          <Button onClick={onPrev} disabled={page <= 1} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <Button
            onClick={onNext}
            disabled={page >= totalPages}
            variant="outline"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl p-10 text-center text-white bg-[radial-gradient(1200px_400px_at_50%_-10%,#0ea5e9,transparent),linear-gradient(135deg,#0f172a,#111827)] shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">
            ¿Eres artista y quieres participar?
          </h2>
          <p className="text-lg md:text-xl mb-6 text-blue-100">
            Súmate a la próxima edición y muestra tu obra al mundo.
          </p>
          <div className="space-y-2">
            <p className="text-base">
              <strong>Contacto:</strong> coordinaciongeneral@feriadelmillon.com
            </p>
            <p className="text-base">
              <strong>Teléfono:</strong> +(57) 322 700 85 76
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
