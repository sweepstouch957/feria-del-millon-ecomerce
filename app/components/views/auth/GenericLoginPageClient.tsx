"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@provider/authProvider";
import { Palette, User, Mail, Loader2, Lock, ArrowRight, Paintbrush } from "lucide-react";

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
        title: "Portal de Artistas",
        subtitle:
          "Accede para subir tus obras y gestionar tu participación en la feria.",
        icon: <Paintbrush className="w-8 h-8 text-white relative z-10" />,
        submitText: "Acceder al Portal",
        next: "/artist", // destino tras login
        switchHref: "/login?role=buyer",
        switchText: "¿Eres coleccionista? Entra aquí",
      };
    }
    return {
      title: "Acceso Coleccionistas",
      subtitle: "Ingresa para gestionar tu carrito, favoritos y pedidos.",
      icon: <User className="w-8 h-8 text-white relative z-10" />,
      submitText: "Iniciar Sesión",
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
      setErrorMsg("Por favor, ingresa un correo electrónico válido.");
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
        const customRedirect = search.get("redirect");
        window.sessionStorage.setItem("LOGIN_NEXT", customRedirect || ui.next);
      } catch {}
      await login(email, password); // el provider redirige al NEXT guardado (o a "/")
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          "Credenciales incorrectas. Por favor, intenta de nuevo."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      {/* Luces de fondo (Feria Green + White glow) */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-green-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10">
        
        {/* Toggle superior de perfiles (Pills de lujo) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/5 border border-white/10 p-1.5 rounded-full backdrop-blur-md shadow-2xl relative">
            <div 
               className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-black rounded-full transition-transform duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-white/10 left-1.5 ${role === 'artist' ? 'translate-x-full' : 'translate-x-0'}`} 
            />
            <Link
              href="/login?role=buyer"
              className={`relative z-10 px-8 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 w-36 text-center ${role === "buyer" ? "text-white" : "text-zinc-500 hover:text-white"}`}
            >
              Coleccionista
            </Link>
            <Link
              href="/login?role=artist"
              className={`relative z-10 px-8 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 w-36 text-center ${role === "artist" ? "text-white" : "text-zinc-500 hover:text-white"}`}
            >
              Artista
            </Link>
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-black/40 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pt-12 pb-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.2)] mb-6 relative group overflow-hidden">
              <div className="absolute inset-0 bg-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              {ui.icon}
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent mb-3">
              {ui.title}
            </h1>
            <p className="text-[15px] text-zinc-400 font-medium leading-relaxed max-w-sm mx-auto">
              {ui.subtitle}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10">
            {errorMsg && (
              <div
                className="mb-6 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-medium text-red-400 flex items-center gap-2 backdrop-blur-sm shadow-inner"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,1)]"></div>
                {errorMsg}
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13px] font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1"
                >
                  Correo Electrónico
                </label>
                <div className="relative group/input">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-5 py-4 pl-12 text-[15px] font-medium text-white placeholder:text-zinc-600 outline-none transition-all duration-300 focus:border-green-500/50 focus:bg-green-500/5 focus:ring-4 focus:ring-green-500/10 group-hover/input:border-white/20"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 transition-colors group-focus-within/input:text-green-500" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label
                    htmlFor="password"
                    className="block text-[13px] font-bold uppercase tracking-wider text-zinc-500"
                  >
                    Contraseña
                  </label>
                  <Link
                    href="/recuperar"
                    className="text-[13px] font-semibold text-zinc-500 hover:text-white transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group/input">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-5 py-4 pl-12 pr-24 text-[15px] font-medium text-white placeholder:text-zinc-600 outline-none transition-all duration-300 focus:border-green-500/50 focus:bg-green-500/5 focus:ring-4 focus:ring-green-500/10 group-hover/input:border-white/20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 transition-colors group-focus-within/input:text-green-500" />
                  
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-zinc-500 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20"
                  >
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-8 relative w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-[16px] font-black text-black shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Iniciando acceso...
                  </>
                ) : (
                  <>
                    {ui.submitText}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer - Registro */}
          <div className="px-8 py-6 bg-white/[0.02] border-t border-white/10 text-center relative overflow-hidden">
            <p className="text-[14px] font-medium text-zinc-400">
              {role === "artist" ? "¿Aún no tienes cuenta para postular?" : "¿Nuevo en la feria?"}{" "}
              <Link
                href={role === "artist" ? "/artist/registro" : "/registro"}
                className="font-bold text-white relative after:content-[''] after:absolute after:w-full after:h-[2px] after:bg-green-500 after:left-0 after:-bottom-1 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
              >
                Crear una cuenta gratis
              </Link>
            </p>
          </div>
        </div>

        {/* Marca de agua / Brand */}
        <div className="text-center mt-10 opacity-60">
          <p className="text-[12px] font-bold tracking-widest uppercase text-zinc-500">
            © 2026 Feria del Millón
          </p>
          <p className="text-[13px] font-medium text-zinc-600 mt-1">
            Plataforma Oficial Segura
          </p>
        </div>
      </div>
    </div>
  );
}
