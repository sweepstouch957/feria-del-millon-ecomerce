"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { register as registerApi } from "@services/auth.service";
import ThemeToggle from "@components/views/home/v2/ThemeToggle";

/* ──────────────────────────────────────────────────────────────
   Alta de comprador — mismo layout que Login.dc.html.
   El endpoint /auth/register ya existía; lo que faltaba era la
   página (el login enlazaba a /registro y daba 404).
   ────────────────────────────────────────────────────────────── */


const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const ROOT_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#0B0B0A)",
  "--acc": "var(--fdm-green,#3FA46E)",
  "--panel": "var(--fdm-panel,#0B0B0A)",
  background: "var(--bg)",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  letterSpacing: "0.005em",
  // El navbar mide 80px + 1px de borde. Descontarlo exacto deja la pantalla
  // justa, sin scroll. `dvh` en vez de `vh` porque en móvil la barra del
  // navegador se recoge y `vh` deja un salto.
  minHeight: "calc(100dvh - 81px)",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

const PAGE_CSS = `
  .fdm-reg a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-reg-link:hover { color: var(--acc); }
  .fdm-reg-dark a:hover { color: var(--acc); }
  .fdm-reg-field {
    margin-top: 8px; width: 100%; padding: 11px 0;
    background: transparent; color: inherit;
    border: 0; border-bottom: 1px solid color-mix(in srgb, var(--fg) 30%, transparent);
    font-size: 17px; font-weight: 400; outline: none;
    transition: border-color .3s ease;
  }
  .fdm-reg-field:focus { border-color: var(--acc); }
  .fdm-reg-field::placeholder { color: color-mix(in srgb, var(--fg) 38%, transparent); }
  .fdm-reg-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 18px; }
  .fdm-reg-submit:hover:not(:disabled) { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }
`;

const POINTS = [
  "Guardá obras y seguí a tus artistas",
  "Comprá con reserva en feria o envío",
  "Certificado de autenticidad del artista",
];

/** Fuerza de contraseña por longitud y variedad, no por reglas arbitrarias. */
function strengthOf(pwd: string) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^\w\s]/.test(pwd)) score++;

  if (score <= 2) return { score: 1, label: "Débil", color: "#B4472A" };
  if (score === 3) return { score: 2, label: "Aceptable", color: "#C9902B" };
  if (score === 4) return { score: 3, label: "Buena", color: "var(--acc)" };
  return { score: 4, label: "Fuerte", color: "var(--acc)" };
}

export default function RegisterPageClient() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const firstRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => firstRef.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(t);
  }, []);

  const strength = useMemo(() => strengthOf(password), [password]);

  const onPassKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const on = e.getModifierState?.("CapsLock");
    if (typeof on === "boolean" && on !== capsOn) setCapsOn(on);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim()) return setErrorMsg("Escribí tu nombre.");
    if (!email || !/\S+@\S+\.\S+/.test(email))
      return setErrorMsg("Ingresá un correo electrónico válido.");
    if (password.length < 8)
      return setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
    if (!accepted)
      return setErrorMsg("Necesitamos que aceptes los términos para continuar.");

    try {
      setSubmitting(true);
      await registerApi({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      });
      // El alta no deja sesión iniciada: mandamos al login con el aviso, que ya
      // sabe mostrarlo, y conservando el destino original si venía uno.
      const qs = new URLSearchParams({ role: "buyer", msg: "cuenta_creada" });
      if (redirect) qs.set("redirect", redirect);
      router.replace(`/login?${qs.toString()}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(
        e?.response?.data?.error ||
          e?.message ||
          "No pudimos crear la cuenta. Revisá los datos e intentá de nuevo."
      );
      setSubmitting(false);
    }
  };

  const loginHref = `/login?role=buyer${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`;

  return (
    <div className="fdm-reg" style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>

      {/* ══ Panel oscuro ═══════════════════════════════════ */}
      <div
        className="fdm-reg-dark"
        style={{
          flex: "1 1 400px",
          minWidth: "min(100%,320px)",
          background: "var(--panel)",
          color: "#F5F4EF",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          // Sin el logo arriba, el manifiesto queda centrado y los enlaces
          // anclados abajo.
          justifyContent: "center",
          gap: "clamp(20px,2.4vw,32px)",
          padding: "clamp(24px,2.8vw,44px)",
        }}
      >


        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: "clamp(30px,3.6vw,52px)",
              lineHeight: 1.05,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ display: "block" }}>Creá tu</span>
            <span style={{ display: "block" }}>cuenta y</span>
            <span style={{ display: "block", color: "var(--acc)" }}>coleccioná</span>
          </h1>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {POINTS.map((p, i) => (
              <span
                key={p}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  padding: "9px 0",
                  borderTop: "1px solid rgba(245,244,239,0.16)",
                  borderBottom: i === POINTS.length - 1 ? "1px solid rgba(245,244,239,0.16)" : undefined,
                  fontSize: 14.5,
                  color: "rgba(245,244,239,0.88)",
                }}
              >
                <span style={{ fontSize: 9.5, letterSpacing: "0.2em", color: "var(--acc)" }}>
                  0{i + 1}
                </span>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 20px",
            ...EYEBROW,
            letterSpacing: "0.16em",
            color: "rgba(245,244,239,0.7)",
          }}
        >
          <Link href="/catalogo">← Catálogo</Link>
          <a href="mailto:info@feriadelmillon.com">Ayuda</a>
        </div>
      </div>

      {/* ══ Formulario ═════════════════════════════════════ */}
      <div
        style={{
          flex: "1 1 520px",
          minWidth: "min(100%,320px)",
          display: "flex",
          flexDirection: "column",
          padding: "clamp(20px,2.4vw,36px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            paddingBottom: "clamp(16px,1.8vw,24px)",
            borderBottom: `1px solid ${mix(14)}`,
          }}
        >
          <span style={{ ...EYEBROW, color: mix(62) }}>Crear cuenta</span>
          <ThemeToggle />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(16px,2vw,30px) 0",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column" }}
          >
            <h2
              style={{
                margin: "0 0 6px",
                fontWeight: 300,
                fontSize: "clamp(26px,2.6vw,36px)",
                lineHeight: 1.1,
                letterSpacing: "0.02em",
              }}
            >
              Empezá acá
            </h2>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(72) }}>
              Con tu cuenta guardás obras, seguís tus pedidos y comprás sin volver a cargar datos.
            </p>

            <div className="fdm-reg-row" style={{ marginTop: 22 }}>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <label htmlFor="rg-first" style={{ ...EYEBROW, fontSize: 9.5, color: mix(66) }}>
                  Nombre
                </label>
                <input
                  id="rg-first"
                  ref={firstRef}
                  className="fdm-reg-field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Ana"
                  required
                />
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <label htmlFor="rg-last" style={{ ...EYEBROW, fontSize: 9.5, color: mix(66) }}>
                  Apellido
                </label>
                <input
                  id="rg-last"
                  className="fdm-reg-field"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  placeholder="Gómez"
                />
              </span>
            </div>

            <label htmlFor="rg-mail" style={{ ...EYEBROW, marginTop: 18, fontSize: 9.5, color: mix(66) }}>
              Correo
            </label>
            <input
              id="rg-mail"
              className="fdm-reg-field"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              required
            />

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginTop: 18,
              }}
            >
              <label htmlFor="rg-pass" style={{ ...EYEBROW, fontSize: 9.5, color: mix(66) }}>
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="fdm-reg-link"
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--acc)",
                  ...EYEBROW,
                  fontSize: 9.5,
                  letterSpacing: "0.16em",
                }}
              >
                {showPwd ? "Ocultar" : "Ver"}
              </button>
            </div>
            <input
              id="rg-pass"
              className="fdm-reg-field"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={onPassKey}
              onKeyDown={onPassKey}
              onBlur={() => setCapsOn(false)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
            />

            {/* Medidor de fuerza */}
            {password && (
              <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <span style={{ display: "flex", gap: 4, flex: 1 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      style={{
                        flex: 1,
                        height: 2,
                        background: n <= strength.score ? strength.color : mix(14),
                        transition: "background .3s ease",
                      }}
                    />
                  ))}
                </span>
                <span
                  style={{
                    ...EYEBROW,
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    color: strength.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {strength.label}
                </span>
              </span>
            )}

            {capsOn && (
              <span
                role="status"
                style={{
                  marginTop: 8,
                  ...EYEBROW,
                  fontSize: 9.5,
                  letterSpacing: "0.14em",
                  color: "var(--acc)",
                }}
              >
                Bloq Mayús activado
              </span>
            )}

            <button
              type="button"
              role="switch"
              aria-checked={accepted}
              onClick={() => setAccepted((v) => !v)}
              className="fdm-reg-link"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 11,
                marginTop: 20,
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                color: "inherit",
                fontSize: 13.5,
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: "0 0 auto",
                  display: "block",
                  width: 11,
                  height: 11,
                  marginTop: 5,
                  transition: "all .25s ease",
                  border: `1px solid ${accepted ? "var(--acc)" : mix(26)}`,
                  background: accepted ? "var(--acc)" : "transparent",
                }}
              />
              <span>
                Acepto los términos y la política de privacidad de la Feria del Millón.
              </span>
            </button>

            {errorMsg && (
              <div
                role="alert"
                style={{
                  marginTop: 18,
                  padding: "12px 14px",
                  borderLeft: "2px solid var(--acc)",
                  background: mix(5),
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="fdm-reg-submit"
              style={{
                marginTop: 22,
                width: "100%",
                height: 54,
                borderRadius: 999,
                cursor: submitting ? "wait" : "pointer",
                opacity: submitting ? 0.7 : 1,
                ...EYEBROW,
                fontSize: 11,
                letterSpacing: "0.18em",
                whiteSpace: "nowrap",
                transition: "all .3s ease",
                border: "1px solid var(--fg)",
                background: "var(--fg)",
                color: "var(--bg)",
              }}
            >
              {submitting ? "Creando cuenta…" : "Crear cuenta"}
            </button>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginTop: 22,
                paddingTop: 16,
                borderTop: `1px solid ${mix(14)}`,
                fontSize: 14,
                color: mix(72),
              }}
            >
              <span>¿Ya tenés cuenta?</span>
              <Link href={loginHref} className="fdm-reg-link" style={{ color: "var(--acc)", ...EYEBROW, fontSize: 10 }}>
                Ingresar →
              </Link>
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: mix(60),
              }}
            >
              ¿Sos artista y querés postular obra?{" "}
              <Link href="/convocatoria" className="fdm-reg-link" style={{ color: "var(--acc)" }}>
                Andá a la convocatoria
              </Link>
              .
            </div>
          </form>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 20px",
            justifyContent: "space-between",
            paddingTop: 14,
            borderTop: `1px solid ${mix(14)}`,
            ...EYEBROW,
            fontSize: 9.5,
            letterSpacing: "0.16em",
            color: mix(55),
          }}
        >
          <span>© Feria del Millón · Oficina para la Cultura SAS</span>
          <span style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <Link href="/legal" className="fdm-reg-link">
              Privacidad
            </Link>
            <Link href="/legal" className="fdm-reg-link">
              Términos
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
