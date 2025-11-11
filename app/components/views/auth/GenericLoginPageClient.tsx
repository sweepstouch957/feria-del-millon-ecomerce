"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@provider/authProvider";
import { Palette, User, Mail, Loader2 } from "lucide-react";

type Role = "buyer" | "artist";

export default function GenericLoginPageClient() {
  const search = useSearchParams();
  const { login } = useAuth();

  // Rol por query (?role=artist|buyer). Default: buyer
  const roleParam = (search.get("role") || "buyer").toLowerCase() as Role;
  const [role, setRole] = useState<Role>(
    (["artist", "buyer"] as const).includes(roleParam) ? roleParam : "buyer"
  );

  // UI copy según rol
  const ui = useMemo(() => {
    if (role === "artist") {
      return {
        title: "Iniciar sesión — Artista",
        subtitle:
          "Accede a tu portal para subir obras y gestionar tu catálogo.",
        badge: "Artista",
        iconBg: "bg-black",
        next: "/artist", // destino tras login
        switchHref: "/login?role=buyer",
        switchText: "¿Eres comprador? Entra aquí",
      };
    }
    return {
      title: "Iniciar sesión — Comprador",
      subtitle: "Ingresa para gestionar tu carrito y tus pedidos.",
      badge: "Comprador",
      iconBg: "bg-black",
      next: "/", // destino tras login
      switchHref: "/login?role=artist",
      switchText: "¿Eres artista? Entra aquí",
    };
  }, [role]);

  useEffect(() => {
    // sincroniza si cambian los params por navegación
    setRole(
      (["artist", "buyer"] as const).includes(roleParam) ? roleParam : "buyer"
    );
  }, [roleParam]);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg("Ingresa un correo válido.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setSubmitting(true);
      // Guardamos el destino preferido para que el AuthProvider lo lea después de /login
      try {
        window.sessionStorage.setItem("LOGIN_NEXT", ui.next);
      } catch {}
      await login(email, password); // el provider redirige al NEXT guardado (o a "/")
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          "No pudimos iniciar sesión. Intenta de nuevo."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-black flex items-center justify-center">
              {role === "artist" ? (
                <Palette className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              {ui.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{ui.subtitle}</p>

            {/* Pills para alternar rol */}
            <div className="mt-4 inline-flex items-center rounded-full border border-gray-200">
              <Link
                href="/login?role=buyer"
                className={`px-3 py-1.5 text-xs font-medium rounded-l-full transition ${
                  role === "buyer"
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-current={role === "buyer" ? "page" : undefined}
              >
                Comprador
              </Link>
              <Link
                href="/login?role=artist"
                className={`px-3 py-1.5 text-xs font-medium rounded-r-full transition ${
                  role === "artist"
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-current={role === "artist" ? "page" : undefined}
              >
                Artista
              </Link>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {errorMsg}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800"
              >
                Correo electrónico
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errorMsg && !email}
                />
                <Mail className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-800"
              >
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pr-20 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errorMsg && !password}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 hover:text-black"
                  aria-label={
                    showPwd ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <Link
                href={ui.switchHref}
                className="text-xs text-gray-600 hover:text-black underline underline-offset-2"
              >
                {ui.switchText}
              </Link>
              <Link
                href="/recuperar"
                className="text-xs text-gray-600 hover:text-black underline underline-offset-2"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Footer: registro */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
            {role === "artist" ? (
              <p className="text-sm text-gray-700">
                ¿Aún no tienes cuenta de artista?{" "}
                <Link
                  href="/artist/registro"
                  className="font-medium text-black underline underline-offset-4 hover:no-underline"
                >
                  Crear cuenta
                </Link>
              </p>
            ) : (
              <p className="text-sm text-gray-700">
                ¿Nuevo en la feria?{" "}
                <Link
                  href="/registro"
                  className="font-medium text-black underline underline-offset-4 hover:no-underline"
                >
                  Crear cuenta
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Copy & brand */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            2025 • Feria del Millón —{" "}
            {role === "artist" ? "Portal de Artistas" : "Compradores"}
          </p>
        </div>
      </div>
    </div>
  );
}
