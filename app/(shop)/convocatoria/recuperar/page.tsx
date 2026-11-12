"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@services/auth.service";
import { AuthShell, PasswordInput } from "@components/views/auth/authUi";

/* ──────────────────────────────────────────────────────────────
   Recuperar contraseña — mismo sistema que /login (Acceso artistas).
   Pasos: pedir correo → aviso de envío → código + contraseña nueva →
   listo. La lógica de red no cambió.
   ────────────────────────────────────────────────────────────── */

type Role = "buyer" | "artist";
type Step = "email" | "sent" | "token" | "done";

/** Fuerza de contraseña por longitud y variedad, no por reglas arbitrarias. */
function strengthOf(pwd: string) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^\w\s]/.test(pwd)) score++;

  if (score <= 2) return { score: 1, label: "Débil", color: "var(--heart)" };
  if (score === 3) return { score: 2, label: "Aceptable", color: "#B58A1B" };
  if (score === 4) return { score: 3, label: "Buena", color: "var(--green)" };
  return { score: 4, label: "Fuerte", color: "var(--green)" };
}

const STEP_N: Record<Step, number> = { email: 1, sent: 2, token: 3, done: 3 };

const COPY: Record<Step, { title: string; lead: string }> = {
  email: { title: "Recupera tu contraseña", lead: "Escribe el correo con el que te registraste. Te enviamos un enlace para elegir una contraseña nueva." },
  sent: { title: "Revisa tu correo", lead: "" },
  token: { title: "Elige una contraseña nueva", lead: "" },
  done: { title: "Todo listo", lead: "Tu contraseña quedó actualizada. Ya puedes entrar con ella." },
};

function RecuperarContent() {
  const search = useSearchParams();
  const tokenParam = search.get("token") || "";

  // La pantalla la comparten compradores y artistas.
  const role: Role = search.get("role") === "buyer" ? "buyer" : "artist";
  const loginHref = role === "buyer" ? "/login?role=buyer" : "/login?role=artist&redirect=/convocatoria/aplicar";

  const [step, setStep] = useState<Step>(tokenParam ? "token" : "email");
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
    const t = window.setTimeout(() => firstRef.current?.focus({ preventScroll: true }), 80);
    return () => window.clearTimeout(t);
  }, [step]);

  const strength = useMemo(() => strengthOf(newPassword), [newPassword]);

  const go = (s: Step) => {
    setStep(s);
    setError("");
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setStep("sent");
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(e2?.response?.data?.error || "No pudimos enviar el correo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) return setError("Pega el código que te llegó por correo.");
    if (newPassword.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (newPassword !== confirmPassword) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setStep("done");
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(e2?.response?.data?.error || "El código no es válido o ya venció. Pide uno nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const lead =
    step === "sent" ? (
      <>Enviamos un correo de recuperación a <b>{email.trim()}</b>. Ábrelo y sigue el enlace para elegir tu contraseña nueva.</>
    ) : step === "token" ? (
      tokenParam ? "Escríbela dos veces para confirmar." : "Pega el código que te llegó por correo y elige tu contraseña nueva."
    ) : (
      COPY[step].lead
    );

  return (
    <AuthShell
      eyebrow={step === "done" ? "Contraseña actualizada" : "Recuperar acceso"}
      title={COPY[step].title}
      lead={lead}
      foot={
        step === "done" ? undefined : (
          <>
            ¿La recordaste? <Link href={loginHref}>Volver a entrar</Link>
          </>
        )
      }
    >
      <div className="fdm-au-card">
        <div className="fdm-au-steps" role="img" aria-label={`Paso ${STEP_N[step]} de 3`}>
          {[1, 2, 3].map((n) => <i key={n} className={n <= STEP_N[step] ? "is-on" : ""} />)}
        </div>

        {/* ── Paso 1: correo ───────────────────────── */}
        {step === "email" && (
          <form onSubmit={handleRequestReset} noValidate style={{ display: "contents" }}>
            <div className="fdm-au-field">
              <label htmlFor="rc-em">Correo electrónico</label>
              <input
                id="rc-em"
                ref={firstRef}
                className="fdm-au-input"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="username"
                placeholder="nombre@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error || undefined}
              />
            </div>
            {error && <div className="fdm-au-err" role="alert">{error}</div>}
            <button type="submit" className="fdm-au-submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviarme el enlace"}
            </button>
          </form>
        )}

        {/* ── Paso 2: enviado ──────────────────────── */}
        {step === "sent" && (
          <>
            <div className="fdm-au-ok" role="status">
              <span className="t">Correo enviado</span>
              <span className="s">Puede tardar un par de minutos. Mira también la carpeta de spam o promociones. El enlace vence en 1 hora.</span>
            </div>
            {error && <div className="fdm-au-err" role="alert">{error}</div>}
            <button type="button" className="fdm-au-submit" disabled={loading} onClick={handleRequestReset}>
              {loading ? "Reenviando…" : "Reenviar correo"}
            </button>
            <button type="button" className="fdm-au-ghost" onClick={() => go("token")}>Ya tengo el código</button>
            <button type="button" className="fdm-au-link" onClick={() => go("email")}>Usar otro correo</button>
          </>
        )}

        {/* ── Paso 3: código + contraseña nueva ────── */}
        {step === "token" && (
          <form onSubmit={handleResetPassword} noValidate style={{ display: "contents" }}>
            {!tokenParam && (
              <div className="fdm-au-field">
                <label htmlFor="rc-tok">Código de recuperación</label>
                <input
                  id="rc-tok"
                  ref={firstRef}
                  className="fdm-au-input"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.trim())}
                  placeholder="Pega el código del correo"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            <div className="fdm-au-field">
              <label htmlFor="rc-npw">Contraseña nueva</label>
              <PasswordInput
                id="rc-npw"
                inputRef={tokenParam ? firstRef : undefined}
                value={newPassword}
                onChange={setNewPassword}
                show={showPwd}
                onToggle={() => setShowPwd((v) => !v)}
                onCaps={setCapsOn}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
              {newPassword && (
                <span className="fdm-au-meter">
                  <span className="bars">
                    {[1, 2, 3, 4].map((n) => <i key={n} style={n <= strength.score ? { background: strength.color } : undefined} />)}
                  </span>
                  <span style={{ color: strength.color }}>{strength.label}</span>
                </span>
              )}
              {capsOn && <span className="fdm-au-hint is-warn" role="status">Bloq Mayús está activado.</span>}
            </div>

            <div className="fdm-au-field">
              <label htmlFor="rc-cpw">Repite la contraseña</label>
              <input
                id="rc-cpw"
                className="fdm-au-input"
                type={showPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={(!!confirmPassword && confirmPassword !== newPassword) || undefined}
              />
              {confirmPassword && confirmPassword !== newPassword && <span className="fdm-au-hint is-warn">Todavía no coinciden.</span>}
            </div>

            {error && <div className="fdm-au-err" role="alert">{error}</div>}
            <button type="submit" className="fdm-au-submit" disabled={loading}>
              {loading ? "Guardando…" : "Guardar contraseña nueva"}
            </button>
            <button type="button" className="fdm-au-link" onClick={() => go(email ? "sent" : "email")}>Volver a pedir el código</button>
          </form>
        )}

        {/* ── Listo ────────────────────────────────── */}
        {step === "done" && (
          <>
            <div className="fdm-au-ok" role="status">
              <span className="t">Contraseña actualizada</span>
              <span className="s">Úsala la próxima vez que entres a tu estudio.</span>
            </div>
            <Link href={loginHref} className="fdm-au-submit">Entrar a mi estudio</Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <RecuperarContent />
    </Suspense>
  );
}
