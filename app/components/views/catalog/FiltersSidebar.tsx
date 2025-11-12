"use client";

import {
  ChevronDown,
  Filter,
  ArrowDownUp,
  Search as SearchIcon,
} from "lucide-react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { formatMoney } from "@lib/utils";

type Option = { id: string; name: string };

type Props = {
  // búsqueda
  q: string;
  setQ: (v: string) => void;

  // pabellón
  pavilion: string;
  setPavilion: (id: string) => void;
  pavilionOptions: Option[];
  loadingPavilions?: boolean;
  errorPavilions?: boolean;

  // técnicas
  techniquesData: any[];
  loadingTechniques?: boolean;
  errorTechniques?: boolean;
  techniqueIds: string[];
  onToggleTechnique: (id: string) => void;
  onClearTechniques: () => void;

  // filtros locales
  minPrice: number;
  maxPrice: number;
  setMinPrice: (n: number) => void;
  setMaxPrice: (n: number) => void;
  inStock: boolean;
  setInStock: (b: boolean) => void;
  hasImage: boolean;
  setHasImage: (b: boolean) => void;

  // orden
  sortBy: "createdAt" | "price" | "_id";
  setSortBy: (s: "createdAt" | "price" | "_id") => void;
  sortDir: "asc" | "desc";
  toggleSortDir: () => void;

  // acciones
  onApply: () => void;
  onClear: () => void;

  // opcional: facets
  facetTechniques?: { name: string; count: number }[];
};

export default function FiltersSidebar(props: Props) {
  const {
    q,
    setQ,
    pavilion,
    setPavilion,
    pavilionOptions,
    loadingPavilions,
    errorPavilions,
    techniquesData,
    loadingTechniques,
    errorTechniques,
    techniqueIds,
    onToggleTechnique,
    onClearTechniques,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    inStock,
    setInStock,
    hasImage,
    setHasImage,
    sortBy,
    setSortBy,
    sortDir,
    toggleSortDir,
    onApply,
    onClear,
  } = props;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <Filter className="h-4 w-4 text-gray-500" />
      </div>

      {/* Búsqueda */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar
        </label>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Título, artista…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pabellón */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pabellón
        </label>
        <div className="relative">
          <select
            value={pavilion}
            onChange={(e) => setPavilion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="null">Sin pabellón</option>
            {loadingPavilions ? (
              <option>cargando…</option>
            ) : errorPavilions ? (
              <option>error al cargar</option>
            ) : (
              pavilionOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Técnicas multi */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Técnicas
          </label>
          <button
            type="button"
            onClick={onClearTechniques}
            className="text-xs text-blue-600 hover:underline"
          >
            Limpiar
          </button>
        </div>

        {loadingTechniques ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : errorTechniques ? (
          <p className="text-sm text-red-600">
            No se pudieron cargar las técnicas.
          </p>
        ) : techniquesData.length === 0 ? (
          <p className="text-sm text-gray-500">Sin técnicas disponibles.</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-auto pr-1">
            <button
              onClick={onClearTechniques}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                techniqueIds.length === 0
                  ? "bg-black text-white border-black"
                  : "hover:bg-gray-100"
              }`}
            >
              Todas
            </button>
            {techniquesData.map((t: any) => {
              const id = String(t._id);
              const active = techniqueIds.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => onToggleTechnique(id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    active
                      ? "bg-black text-white border-black"
                      : "hover:bg-gray-100"
                  }`}
                  title={t.slug ?? t.name}
                >
                  <span className="line-clamp-1 max-w-[10rem]">{t.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Rango de precio mejorado con atajos y validación */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Rango de precio
          </label>
          <button
            type="button"
            onClick={() => {
              setMinPrice(500000);
              setMaxPrice(1000000);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Limpiar rango
          </button>
        </div>

        {/* Atajos de rango */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { label: "≤ 100K", min: 0, max: 100_000 },
            { label: "≤ 500K", min: 0, max: 500_000 },
            { label: "≤ 1M", min: 0, max: 1_000_000 },
            { label: "≤ 5M", min: 0, max: 5_000_000 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setMinPrice(p.min);
                setMaxPrice(p.max);
              }}
              className="px-3 py-1.5 rounded-full text-sm border hover:bg-gray-100 transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Input mínimo */}
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={minPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // solo números
                const num = parseInt(value || "0", 10);
                if (num >= 0 && num <= 10_000_000_000) setMinPrice(num);
              }}
              placeholder="Mín"
              className="w-full rounded-md border border-gray-300 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              COP
            </span>
          </div>

          <span className="text-gray-400">—</span>

          {/* Input máximo */}
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={maxPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                const num = parseInt(value || "0", 10);
                if (num >= 0 && num <= 10_000_000_000) setMaxPrice(num);
              }}
              placeholder="Máx"
              className="w-full rounded-md border border-gray-300 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              COP
            </span>
          </div>
        </div>

        {/* Texto con formato de dinero */}
        <p className="text-xs text-gray-500 mt-2">
          {formatMoney(minPrice)} — {formatMoney(maxPrice)}
        </p>

        {/* Validación */}
        {minPrice > 0 && maxPrice > 0 && minPrice > maxPrice && (
          <p className="text-xs mt-2 text-red-600">
            El mínimo no puede ser mayor que el máximo.
          </p>
        )}
      </div>

      {/* Toggles */}
      <div className="mb-5 space-y-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
          />
          Solo en stock
        </label>
      </div>

      {/* Orden */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ordenar por
        </label>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Más recientes</option>
            <option value="price">Precio</option>
          </select>
          <Button
            variant="outline"
            onClick={toggleSortDir}
            title="Cambiar dirección"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <Button onClick={onApply} className="w-full">
          Aplicar
        </Button>
        <Button onClick={onClear} variant="outline" className="w-full">
          Limpiar
        </Button>
      </div>
    </div>
  );
}
