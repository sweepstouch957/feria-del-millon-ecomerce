"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@provider/authProvider";

/* ──────────────────────────────────────────────────────────────
   Acceso — port de Login.dc.html al sistema editorial v2.
   Panel oscuro con el manifiesto a la izquierda, formulario a la
   derecha. El rol sigue viajando en ?role= para que el enlace sea
   compartible; las pestañas son <Link>, no estado local.
   ────────────────────────────────────────────────────────────── */

type Role = "buyer" | "artist";

const REMEMBER_KEY = "fdm-remember";
const LAST_EMAIL_KEY = "fdm-last-email";

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
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

const PAGE_CSS = `
  .fdm-log a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-log-link:hover { color: var(--acc); }
  .fdm-log-dark a:hover { color: var(--acc); }
  .fdm-log-dark { padding: clamp(24px,2.8vw,44px); }
  .fdm-log-field {
    margin-top: 8px; width: 100%; padding: 11px 0;
    background: transparent; color: inherit;
    border: 0; border-bottom: 1px solid color-mix(in srgb, var(--fg) 30%, transparent);
    font-size: 17px; font-weight: 400; outline: none;
    transition: border-color .3s ease;
  }
  .fdm-log-field:focus { border-color: var(--acc); }
  .fdm-log-field::placeholder { color: color-mix(in srgb, var(--fg) 38%, transparent); }
  .fdm-log-submit:hover:not(:disabled) { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }

  /* El navbar mide 80px + 1px de borde. En escritorio la pantalla calza justa
     y no hay scroll; dvh sigue la altura real en movil, donde la barra del
     navegador se recoge. */
  .fdm-log { min-height: calc(100dvh - 81px); }

  /* El navbar es sticky y se superpone a lo que scrollea debajo. Sin esto, al
     enfocar un campo el navegador lo sube justo detrás de la barra. */
  .fdm-log-field { scroll-margin-top: 104px; }

  @media (max-width: 860px) {
    /* Apilado: forzar la altura de pantalla solo sumaba scroll vacío. */
    .fdm-log { min-height: 0; }
    /* En móvil primero el formulario: es a lo que se viene, y así no hay que
       scrollear el manifiesto entero para llegar. */
    .fdm-log-form { order: -1; }
    .fdm-log-dark { min-height: 0; padding-block: clamp(22px,6vw,34px); }
    .fdm-log-dark h1 { font-size: clamp(26px,7.5vw,40px); }
  }

  @media (max-height: 700px) and (min-width: 861px) {
    /* Portátiles bajos: que scrollee antes de comprimir el formulario. */
    .fdm-log { min-height: 0; }
  }
`;

const ARTIST_POINTS = [
  "Gestioná tus obras, precios y ventas",
  "Seguí el estado de tu postulación",
  "Descargá los certificados de tus piezas",
];

const BUYER_POINTS = [
  "Guardá obras y seguí a tus artistas",
  "Comprá con reserva en feria o envío",
  "Certificado de autenticidad del artista",
];

export default function GenericLoginPageClient() {
  const search = useSearchParams();
  const { login } = useAuth();

  const roleParam = (search.get("role") || "buyer").toLowerCase() as Role;
  const [role, setRole] = useState<Role>(
    (["artist", "buyer"] as const).includes(roleParam) ? roleParam : "buyer"
  );

  useEffect(() => {
    setRole((["artist", "buyer"] as const).includes(roleParam) ? roleParam : "buyer");
  }, [roleParam]);

  const isArtist = role === "artist";

  const ui = useMemo(() => {
    if (isArtist) {
      return {
        manifesto: ["Tu arte", "en el", "millón."],
        points: ARTIST_POINTS,
        heading: "Entrá a tu perfil",
        subheading: "Gestioná tus obras, precios y ventas de la edición 2026.",
        submitText: "Ingresar como artista",
        next: "/artist",
        registerHref: "/convocatoria/register",
        registerText: "Crear cuenta →",
      };
    }
    return {
      manifesto: ["Comprá obra", "de artistas", "emergentes"],
      points: BUYER_POINTS,
      heading: "Entrá y comprá",
      subheading: "Tu carrito, favoritos y pedidos de la edición 2026 en un solo lugar.",
      submitText: "Ingresar",
      next: "/",
      registerHref: "/registro",
      registerText: "Crear cuenta →",
    };
  }, [isArtist]);

  // /convocatoria/register redirige acá con ?msg=cuenta_creada, pero nadie lo
  // mostraba: el que acababa de registrarse no recibía confirmación alguna.
  const justRegistered = search.get("msg") === "cuenta_creada";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capsOn, setCapsOn] = useState(false);
  const [remember, setRemember] = useState(true);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passRef = useRef<HTMLInputElement | null>(null);

  // La preferencia de "Recordarme" se recuerda a sí misma, y el correo del
  // último ingreso vuelve precargado: en un login compartido esto es lo que
  // separa "entrar" de "volver a escribir todo".
  useEffect(() => {
    try {
      const savedRemember = window.localStorage.getItem(REMEMBER_KEY);
      if (savedRemember !== null) setRemember(savedRemember === "1");
      const savedEmail = window.localStorage.getItem(LAST_EMAIL_KEY);
      if (savedEmail) setEmail(savedEmail);
    } catch {}
  }, []);

  // Foco en el primer campo vacío: si el correo vino precargado, el cursor
  // arranca en la contraseña.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const target = email ? passRef.current : emailRef.current;
      target?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(t);
    // Solo al montar: reenfocar en cada tecleo sería insoportable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bloq Mayús es la causa nº1 de "mi contraseña no funciona".
  const onPassKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const on = e.getModifierState?.("CapsLock");
    if (typeof on === "boolean" && on !== capsOn) setCapsOn(on);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      setSubmitting(true);
      try {
        const customRedirect = search.get("redirect");
        window.sessionStorage.setItem("LOGIN_NEXT", customRedirect || ui.next);
        window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
        // El correo solo se recuerda si el usuario pidió ser recordado.
        if (remember) window.localStorage.setItem(LAST_EMAIL_KEY, email.trim());
        else window.localStorage.removeItem(LAST_EMAIL_KEY);
      } catch {}
      await login(email.trim(), password, remember);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(
        e?.response?.data?.error || e?.message || "Credenciales incorrectas. Intenta de nuevo."
      );
      setSubmitting(false);
    }
  };

  // Conserva ?redirect= al cambiar de pestaña: si llegaste acá desde el
  // checkout, cambiar de rol no debería tirar a la basura tu destino.
  const tabHref = (r: Role) => {
    const redirect = search.get("redirect");
    return `/login?role=${r}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`;
  };

  return (
    <div className="fdm-log" style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>

      {/* ══ Panel oscuro ═══════════════════════════════════ */}
      <div
        className="fdm-log-dark"
        style={{
          flex: "1 1 400px",
          minWidth: "min(100%,320px)",
          background: "var(--panel)",
          color: "#F5F4EF",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(20px,2.4vw,32px)",
        }}
      >


        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
          }}
        >
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
            {ui.manifesto.map((line, i) => (
              <span key={line} style={{ display: "block", color: i === 2 ? "var(--acc)" : undefined }}>
                {line}
              </span>
            ))}
          </h1>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {ui.points.map((p, i) => (
              <span
                key={p}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  padding: "9px 0",
                  borderTop: "1px solid rgba(245,244,239,0.16)",
                  borderBottom:
                    i === ui.points.length - 1 ? "1px solid rgba(245,244,239,0.16)" : undefined,
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
        className="fdm-log-form"
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
            paddingBottom: "clamp(16px,1.8vw,24px)",
            borderBottom: `1px solid ${mix(14)}`,
          }}
        >
          <span style={{ ...EYEBROW, color: mix(62) }}>Acceso a tu cuenta</span>
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
            {/* Pestañas de rol */}
            <div
              style={{
                display: "flex",
                gap: 26,
                paddingBottom: 14,
                borderBottom: `1px solid ${mix(20)}`,
              }}
            >
              {(
                [
                  ["buyer", "Comprador"],
                  ["artist", "Artista"],
                ] as [Role, string][]
              ).map(([r, label]) => {
                const on = role === r;
                return (
                  <Link
                    key={r}
                    href={tabHref(r)}
                    style={{
                      padding: "2px 0",
                      fontWeight: 500,
                      fontSize: 11.5,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: on ? "var(--acc)" : mix(55),
                      borderBottom: `1px solid ${on ? "var(--acc)" : "transparent"}`,
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <h2
              style={{
                margin: "20px 0 6px",
                fontWeight: 300,
                fontSize: "clamp(26px,2.6vw,36px)",
                lineHeight: 1.1,
                letterSpacing: "0.02em",
              }}
            >
              {ui.heading}
            </h2>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(72) }}>
              {ui.subheading}
            </p>

            <label htmlFor="lg-mail" style={{ ...EYEBROW, marginTop: 22, fontSize: 9.5, color: mix(66) }}>
              Correo
            </label>
            <input
              id="lg-mail"
              ref={emailRef}
              className="fdm-log-field"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              aria-invalid={!!errorMsg}
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
              <label htmlFor="lg-pass" style={{ ...EYEBROW, fontSize: 9.5, color: mix(66) }}>
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="fdm-log-link"
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
              id="lg-pass"
              ref={passRef}
              className="fdm-log-field"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={onPassKey}
              onKeyDown={onPassKey}
              onBlur={() => setCapsOn(false)}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errorMsg}
              required
            />

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

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                role="switch"
                aria-checked={remember}
                onClick={() => setRemember((v) => !v)}
                className="fdm-log-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  color: "inherit",
                  fontSize: 13.5,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flex: "0 0 auto",
                    display: "block",
                    width: 11,
                    height: 11,
                    transition: "all .25s ease",
                    border: `1px solid ${remember ? "var(--acc)" : mix(26)}`,
                    background: remember ? "var(--acc)" : "transparent",
                  }}
                />
                Recordarme
              </button>

              <Link
                href={`/convocatoria/recuperar?role=${role}`}
                className="fdm-log-link"
                style={{ fontSize: 13.5, color: mix(72) }}
              >
                ¿Olvidaste la contraseña?
              </Link>
            </div>

            {justRegistered && !errorMsg && (
              <div
                role="status"
                style={{
                  marginTop: 18,
                  padding: "12px 14px",
                  borderLeft: "2px solid var(--acc)",
                  background: "color-mix(in srgb, var(--acc) 10%, transparent)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Cuenta creada. Ingresá con tu correo y contraseña para continuar.
              </div>
            )}

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
              className="fdm-log-submit"
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
              {submitting ? "Ingresando…" : ui.submitText}
            </button>

            {ui.registerHref && (
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
                <span>¿No tenés cuenta?</span>
                <Link
                  href={ui.registerHref}
                  className="fdm-log-link"
                  style={{ color: "var(--acc)", ...EYEBROW, fontSize: 10 }}
                >
                  {ui.registerText}
                </Link>
              </div>
            )}
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
            <Link href="/legal" className="fdm-log-link">
              Privacidad
            </Link>
            <Link href="/legal" className="fdm-log-link">
              Términos
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
