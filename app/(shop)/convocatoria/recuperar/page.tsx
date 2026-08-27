"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@services/auth.service";

/* ──────────────────────────────────────────────────────────────
   Recuperar contraseña — mismo layout partido que /login y /registro.
   Cuatro pasos: pedir correo → aviso de envío → código + contraseña
   nueva → listo. La lógica de red no cambió.
   ────────────────────────────────────────────────────────────── */

type Role = "buyer" | "artist";

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
  .fdm-rec a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-rec-link:hover { color: var(--acc); }
  .fdm-rec-dark a:hover { color: var(--acc); }
  .fdm-rec-dark { padding: clamp(24px,2.8vw,44px); }
  .fdm-rec-field {
    margin-top: 8px; width: 100%; padding: 11px 0;
    background: transparent; color: inherit;
    border: 0; border-bottom: 1px solid color-mix(in srgb, var(--fg) 30%, transparent);
    font-size: 17px; font-weight: 400; outline: none;
    transition: border-color .3s ease;
    scroll-margin-top: 104px;
  }
  .fdm-rec-field:focus { border-color: var(--acc); }
  .fdm-rec-field::placeholder { color: color-mix(in srgb, var(--fg) 38%, transparent); }
  .fdm-rec-submit:hover:not(:disabled) { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }

  /* El navbar mide 80px + 1px de borde; descontarlo deja la pantalla justa. */
  .fdm-rec { min-height: calc(100dvh - 81px); }

  @media (max-width: 860px) {
    .fdm-rec { min-height: 0; }
    .fdm-rec-form { order: -1; }
    .fdm-rec-dark { min-height: 0; padding-block: clamp(22px,6vw,34px); }
    .fdm-rec-dark h1 { font-size: clamp(26px,7.5vw,40px); }
  }

  @media (max-height: 700px) and (min-width: 861px) {
    .fdm-rec { min-height: 0; }
  }
`;

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

const STEP_META: Record<string, { n: string; eyebrow: string }> = {
  email: { n: "01", eyebrow: "Paso 1 de 3" },
  sent: { n: "02", eyebrow: "Paso 2 de 3" },
  token: { n: "03", eyebrow: "Paso 3 de 3" },
  done: { n: "04", eyebrow: "Listo" },
};

function RecuperarContent() {
  const search = useSearchParams();
  const tokenParam = search.get("token") || "";

  // La pantalla la comparten compradores y artistas. Sin esto, un comprador
  // que restablece su clave terminaba en el login de artista camino a la
  // convocatoria.
  const role: Role = search.get("role") === "buyer" ? "buyer" : "artist";
  const loginHref =
    role === "buyer"
      ? "/login?role=buyer"
      : "/login?role=artist&redirect=/convocatoria/aplicar";

  const [step, setStep] = useState<"email" | "sent" | "token" | "done">(
    tokenParam ? "token" : "email"
  );
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const firstRef = useRef<HTMLInputElement | null>(null);

  // Al cambiar de paso el foco viaja al primer campo del paso nuevo.
  useEffect(() => {
    const t = window.setTimeout(() => firstRef.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(t);
  }, [step]);

  const strength = useMemo(() => strengthOf(newPassword), [newPassword]);

  const onPassKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const on = e.getModifierState?.("CapsLock");
    if (typeof on === "boolean" && on !== capsOn) setCapsOn(on);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Ingresa tu correo electrónico");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep("sent");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Ingresa el código de recuperación");
      return;
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setStep("done");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || "Token inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  const meta = STEP_META[step];

  const submitStyle: React.CSSProperties = {
    marginTop: 22,
    width: "100%",
    height: 54,
    borderRadius: 999,
    cursor: loading ? "wait" : "pointer",
    opacity: loading ? 0.7 : 1,
    ...EYEBROW,
    fontSize: 11,
    letterSpacing: "0.18em",
    whiteSpace: "nowrap",
    transition: "all .3s ease",
    border: "1px solid var(--fg)",
    background: "var(--fg)",
    color: "var(--bg)",
  };

  const ghostStyle: React.CSSProperties = {
    marginTop: 12,
    width: "100%",
    height: 46,
    borderRadius: 999,
    cursor: "pointer",
    background: "transparent",
    color: mix(65),
    border: `1px solid ${mix(22)}`,
    ...EYEBROW,
    fontSize: 10.5,
    letterSpacing: "0.12em",
  };

  const labelStyle: React.CSSProperties = { ...EYEBROW, fontSize: 9.5, color: mix(66) };

  return (
    <div className="fdm-rec" style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>

      {/* ══ Panel oscuro ═══════════════════════════════════ */}
      <div
        className="fdm-rec-dark"
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
            <span style={{ display: "block" }}>Recuperá</span>
            <span style={{ display: "block" }}>tu</span>
            <span style={{ display: "block", color: "var(--acc)" }}>acceso</span>
          </h1>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { n: "01", t: "Escribí el correo de tu cuenta" },
              { n: "02", t: "Abrí el correo que te enviamos" },
              { n: "03", t: "Elegí una contraseña nueva" },
            ].map((s, i, arr) => {
              const active = meta.n === s.n;
              const doneStep = Number(meta.n) > Number(s.n);
              return (
                <span
                  key={s.n}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    padding: "9px 0",
                    borderTop: "1px solid rgba(245,244,239,0.16)",
                    borderBottom: i === arr.length - 1 ? "1px solid rgba(245,244,239,0.16)" : undefined,
                    fontSize: 14.5,
                    color: active || doneStep ? "#F5F4EF" : "rgba(245,244,239,0.5)",
                    transition: "color .3s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      letterSpacing: "0.2em",
                      color: active || doneStep ? "var(--acc)" : "rgba(245,244,239,0.4)",
                    }}
                  >
                    {doneStep ? "✓" : s.n}
                  </span>
                  {s.t}
                </span>
              );
            })}
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
          <Link href={loginHref}>← Iniciar sesión</Link>
          <a href="mailto:info@feriadelmillon.com">Ayuda</a>
        </div>
      </div>

      {/* ══ Formulario ═════════════════════════════════════ */}
      <div
        className="fdm-rec-form"
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
          <span style={{ ...EYEBROW, color: mix(62) }}>{meta.eyebrow}</span>
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
          <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column" }}>
            {/* ── Paso: correo ─────────────────────────── */}
            {step === "email" && (
              <form onSubmit={handleRequestReset} style={{ display: "flex", flexDirection: "column" }}>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontWeight: 300,
                    fontSize: "clamp(26px,2.6vw,36px)",
                    lineHeight: 1.1,
                    letterSpacing: "0.02em",
                  }}
                >
                  Recuperar contraseña
                </h2>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(72) }}>
                  Ingresá el correo con el que te registraste. Te enviamos un código para
                  restablecerla.
                </p>

                <label htmlFor="rc-em" style={{ ...labelStyle, marginTop: 22 }}>
                  Correo electrónico
                </label>
                <input
                  id="rc-em"
                  ref={firstRef}
                  className="fdm-rec-field"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  aria-invalid={!!error}
                  required
                />

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading} className="fdm-rec-submit" style={submitStyle}>
                  {loading ? "Enviando…" : "Enviar código"}
                </button>
              </form>
            )}

            {/* ── Paso: enviado ────────────────────────── */}
            {step === "sent" && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontWeight: 300,
                    fontSize: "clamp(26px,2.6vw,36px)",
                    lineHeight: 1.1,
                    letterSpacing: "0.02em",
                  }}
                >
                  Revisá tu correo
                </h2>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(72) }}>
                  Enviamos un correo de recuperación a{" "}
                  <span style={{ color: "var(--acc)" }}>{email}</span>. Abrilo y seguí el enlace
                  para restablecer tu contraseña.
                </p>

                {error && <ErrorBox msg={error} />}

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRequestReset}
                  className="fdm-rec-submit"
                  style={submitStyle}
                >
                  {loading ? "Reenviando…" : "Reenviar correo"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("token");
                    setError("");
                  }}
                  style={ghostStyle}
                >
                  Ya tengo el código
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  style={{ ...ghostStyle, marginTop: 8, border: 0, height: 34 }}
                >
                  ← Usar otro correo
                </button>
              </div>
            )}

            {/* ── Paso: código + contraseña nueva ──────── */}
            {step === "token" && (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column" }}>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontWeight: 300,
                    fontSize: "clamp(26px,2.6vw,36px)",
                    lineHeight: 1.1,
                    letterSpacing: "0.02em",
                  }}
                >
                  Nueva contraseña
                </h2>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(72) }}>
                  {tokenParam
                    ? "Elegí tu nueva contraseña para continuar."
                    : "Pegá el código que te llegó por correo y elegí tu nueva contraseña."}
                </p>

                {!tokenParam && (
                  <>
                    <label htmlFor="rc-tok" style={{ ...labelStyle, marginTop: 22 }}>
                      Código de recuperación
                    </label>
                    <input
                      id="rc-tok"
                      ref={firstRef}
                      className="fdm-rec-field"
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Pegá el código del correo"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={!!error}
                    />
                  </>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    marginTop: 18,
                  }}
                >
                  <label htmlFor="rc-npw" style={labelStyle}>
                    Nueva contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="fdm-rec-link"
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
                  id="rc-npw"
                  ref={tokenParam ? firstRef : undefined}
                  className="fdm-rec-field"
                  type={showPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyUp={onPassKey}
                  onKeyDown={onPassKey}
                  onBlur={() => setCapsOn(false)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  aria-invalid={!!error}
                />

                {newPassword && (
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

                <label htmlFor="rc-cpw" style={{ ...labelStyle, marginTop: 18 }}>
                  Confirmar contraseña
                </label>
                <input
                  id="rc-cpw"
                  className="fdm-rec-field"
                  type={showPwd ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                  autoComplete="new-password"
                  aria-invalid={!!error}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <span
                    style={{
                      marginTop: 8,
                      ...EYEBROW,
                      fontSize: 9.5,
                      letterSpacing: "0.14em",
                      color: "#B4472A",
                    }}
                  >
                    No coinciden
                  </span>
                )}

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading} className="fdm-rec-submit" style={submitStyle}>
                  {loading ? "Restableciendo…" : "Restablecer contraseña"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(email ? "sent" : "email");
                    setError("");
                  }}
                  style={ghostStyle}
                >
                  ← Volver a pedir el código
                </button>
              </form>
            )}

            {/* ── Paso: listo ──────────────────────────── */}
            {step === "done" && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ ...EYEBROW, fontSize: 10, color: "var(--acc)", marginBottom: 10 }}>
                  Contraseña actualizada
                </span>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontWeight: 300,
                    fontSize: "clamp(26px,2.6vw,36px)",
                    lineHeight: 1.1,
                    letterSpacing: "0.02em",
                  }}
                >
                  Todo listo
                </h2>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(72) }}>
                  Tu contraseña quedó actualizada. Ya podés iniciar sesión con ella.
                </p>

                <Link
                  href={loginHref}
                  className="fdm-rec-submit"
                  style={{
                    ...submitStyle,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    opacity: 1,
                  }}
                >
                  Iniciar sesión
                </Link>
              </div>
            )}

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
              <Link href={loginHref} className="fdm-rec-link">
                Iniciar sesión
              </Link>
              <span aria-hidden style={{ color: mix(30) }}>
                ·
              </span>
              <Link
                href={role === "buyer" ? "/registro" : "/convocatoria/register"}
                className="fdm-rec-link"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
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
            <Link href="/legal" className="fdm-rec-link">
              Privacidad
            </Link>
            <Link href="/legal" className="fdm-rec-link">
              Términos
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
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
      {msg}
    </div>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense fallback={null}>
      <RecuperarContent />
    </Suspense>
  );
}
