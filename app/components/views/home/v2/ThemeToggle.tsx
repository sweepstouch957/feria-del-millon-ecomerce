"use client";

import { useEffect, useState } from "react";

// Alterna claro/oscuro repintando data-theme en <html> + persiste en localStorage.
// El boot script del layout ya aplicó el tema guardado antes del primer paint.
export default function ThemeToggle({ className = "" }: { className?: string }) {
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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 36,
        padding: "0 16px",
        borderRadius: 999,
        cursor: "pointer",
        background: "transparent",
        color: "inherit",
        border: "1px solid color-mix(in srgb, var(--fdm-fg,#0B0B0A) 26%, transparent)",
        fontWeight: 300,
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}
    >
      {theme === "dark" ? "Claro" : "Oscuro"}
    </button>
  );
}
