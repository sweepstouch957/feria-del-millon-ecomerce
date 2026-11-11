"use client";

import { useEffect, useState } from "react";

// Alterna claro/oscuro repintando data-theme en <html> + persiste en localStorage.
// El boot script del layout ya aplicó el tema guardado antes del primer paint.
// Por defecto es el botón redondo de solo icono del navbar; con `withLabel`
// pinta el chip "Modo oscuro / Modo claro" del menú móvil.
export default function ThemeToggle({ className = "", withLabel = false, style }: { className?: string; withLabel?: boolean; style?: React.CSSProperties }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const cur = document.documentElement.getAttribute("data-theme");
    setTheme(cur === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("fdm-theme", next);
    } catch {}
  };

  const dark = theme === "dark";
  const icon = dark ? (
    <svg width={withLabel ? 18 : 20} height={withLabel ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg width={withLabel ? 18 : 20} height={withLabel ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );

  return (
    <button type="button" onClick={toggle} aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} className={className} style={style}>
      {icon}
      {withLabel && (dark ? "Modo claro" : "Modo oscuro")}
    </button>
  );
}
