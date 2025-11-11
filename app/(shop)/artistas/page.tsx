"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Palette } from "lucide-react";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { artworks, categories } from "@data/artworks";

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dimensions: string;
  description: string;
  category: string;
  image: string;
  price: number;
}

type ArtistView = {
  id: string;
  name: string;
  artworks: Artwork[];
  categories: string[];
  bio: string;
  image: string;
};

export default function ArtistsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // 🔎 Construcción de artistas únicos a partir de artworks (sin mutaciones peligrosas)
  const allArtists: ArtistView[] = useMemo(() => {
    const map = new Map<
      string,
      { data: Omit<ArtistView, "categories"> & { categoriesSet: Set<string> } }
    >();

    (artworks as Artwork[]).forEach((art) => {
      const key = art.artist;
      const existing = map.get(key);

      if (existing) {
        existing.data.artworks.push(art);
        existing.data.categoriesSet.add(art.category);
      } else {
        map.set(key, {
          data: {
            id: key.toLowerCase().replace(/\s+/g, "-"),
            name: key,
            artworks: [art],
            categoriesSet: new Set([art.category]),
            bio: `Artista colombiano especializado en ${art.category.toLowerCase()}. Participante destacado en la Semana del Arte 2025.`,
            image: "/api/placeholder/300/300",
          },
        });
      }
    });

    // Normalizamos categories (Set -> Array) y ordenamos por nombre
    return Array.from(map.values())
      .map(({ data }) => ({
        id: data.id,
        name: data.name,
        artworks: data.artworks,
        categories: Array.from(data.categoriesSet),
        bio: data.bio,
        image: data.image,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);

  const getArtistPriceRange = (list: Artwork[]) => {
    const prices = list.map((a) => a.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? formatPrice(min)
      : `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  const filteredArtists = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return allArtists.filter((artist) => {
      const matchesSearch = artist.name.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "Todos" ||
        artist.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [allArtists, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Artistas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conoce a los talentosos artistas que participan en la Semana del
            Arte 2025. Cada uno aporta su visión única al panorama artístico
            colombiano.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar artistas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "Todos" ? "Todas las categorías" : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {allArtists.length}
            </h3>
            <p className="text-gray-600">Artistas Participantes</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {artworks.length}
            </h3>
            <p className="text-gray-600">Obras Disponibles</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">🎨</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {categories.length - 1}
            </h3>
            <p className="text-gray-600">Disciplinas Artísticas</p>
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {filteredArtists.length} de {allArtists.length} artistas
          </p>
        </div>

        {/* Grid de Artistas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              {/* Imagen del Artista */}
              <div className="relative">
                <Image
                  src={artist.image}
                  alt={artist.name}
                  width={1200}
                  height={800}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{artist.name}</h3>
                  <p className="text-sm opacity-90">
                    {artist.artworks.length}{" "}
                    {artist.artworks.length === 1 ? "obra" : "obras"}
                  </p>
                </div>
              </div>

              {/* Información */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {artist.bio}
                  </p>
                </div>

                {/* Categorías */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {artist.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rango de Precios */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Rango de precios:</p>
                  <p className="font-semibold text-gray-900">
                    {getArtistPriceRange(artist.artworks)}
                  </p>
                </div>

                {/* Obras Destacadas */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Obras destacadas:
                  </p>
                  <div className="space-y-1">
                    {artist.artworks.slice(0, 2).map((artwork) => (
                      <Link
                        key={artwork.id}
                        href={`/obra/${artwork.id}`}
                        className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        • {artwork.title} ({artwork.year})
                      </Link>
                    ))}
                    {artist.artworks.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{artist.artworks.length - 2} obras más
                      </p>
                    )}
                  </div>
                </div>

                {/* Botón: Ver todas sus obras */}
                <div className="space-y-2">
                  <Link
                    href={`/catalogo?artista=${encodeURIComponent(
                      artist.name
                    )}`}
                    className="block"
                  >
                    <Button className="w-full" variant="outline">
                      Ver todas sus obras
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArtists.length === 0 && (
          <div className="text-center py-12">
            <User className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron artistas
            </h3>
            <p className="text-gray-500">
              Intenta ajustar los filtros de búsqueda.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-blue-900 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Eres artista y quieres participar?
          </h2>
          <p className="text-xl mb-6 text-blue-200">
            Únete a la próxima edición de la Semana del Arte
          </p>
          <div className="space-y-2">
            <p className="text-lg">
              <strong>Contacto:</strong> coordinaciongeneral@feriadelmillon.com
            </p>
            <p className="text-lg">
              <strong>Teléfono:</strong> +(57) 322 700 85 76
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
