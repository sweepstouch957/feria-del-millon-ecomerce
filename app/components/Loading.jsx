import { Loader2, Palette } from 'lucide-react';

export default function Loading({ message = "Cargando...", fullScreen = false }) {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="relative mb-4">
          {/* Spinner principal */}
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          
          {/* Icono decorativo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Palette className="h-6 w-6 text-purple-600 animate-pulse" />
          </div>
        </div>
        
        <p className="text-gray-600 font-medium">{message}</p>
        
        {/* Barra de progreso animada */}
        <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ type = "card" }) {
  if (type === "card") {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="h-64 bg-gray-300"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex space-x-4">
          <div className="w-24 h-24 bg-gray-300 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    </div>
  );
}
