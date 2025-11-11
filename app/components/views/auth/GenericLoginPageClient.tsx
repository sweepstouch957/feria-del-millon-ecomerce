"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@provider/authProvider";
import { Palette, User, Mail, Lock, Loader2 } from "lucide-react";

type Role = "buyer" | "artist";

export default function GenericLoginPageClient() {
  const search = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const roleParam = (search.get("role") || "buyer").toLowerCase() as Role;
  const [role, setRole] = useState<Role>(
    ["artist", "buyer"].includes(roleParam) ? roleParam : "buyer"
  );

  const ui = useMemo(() => {
    if (role === "artist") {
      return {
        title: "Iniciar sesión — Artista",
        subtitle: "Accede a tu portal para subir obras y gestionar tu catálogo.",
        badge: "Artista",
        iconBg: "bg-black",
        next: "/artist",
        switchHref: "/login?role=buyer",
        switchText: "¿Eres comprador? Entra aquí",
      };
    }
    return {
      title: "Iniciar sesión — Comprador",
      subtitle: "Ingresa para gestionar tu carrito y tus pedidos.",
      badge: "Comprador",
      iconBg: "bg-black",
      next: "/",
      switchHref: "/login?role=artist",
      switchText: "¿Eres artista? Entra aquí",
    };
  }, [role]);

  useEffect(() => {
    setRole(["artist", "buyer"].includes(roleParam) ? roleParam : "buyer");
  }, [roleParam]);

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
      try {
        window.sessionStorage.setItem("LOGIN_NEXT", ui.next);
      } catch {}
      await login(email, password);
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
      {/* …todo tu JSX exactamente igual… */}
      {/* (omitido aquí por brevedad, pero copia el mismo que ya tenías) */}
    </div>
  );
}
