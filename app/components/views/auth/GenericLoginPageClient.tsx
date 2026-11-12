"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@provider/authProvider";
import { exchangeLoginLink, requestLoginLink } from "@services/auth.service";
import { AuthShell, PasswordInput } from "./authUi";

/* ──────────────────────────────────────────────────────────────
   Acceso artistas — port de "Acceso artistas" (Claude Design).
   Dos formas de entrar: con contraseña, o con un enlace de un solo
   uso que llega al correo (#acceso=… vuelve a esta misma página y se
   canjea por la sesión). El login de compradores sigue apagado.
   ────────────────────────────────────────────────────────────── */

const REMEMBER_KEY = "fdm-remember";
const LAST_EMAIL_KEY = "fdm-last-email";
const ARTIST_HOME = "/admin/artist";

type Mode = "pass" | "link";

export default function GenericLoginPageClient() {
  const search = useSearchParams();
  const { login } = useAuth();

  // /convocatoria/register redirige acá con ?msg=cuenta_creada.
  const justRegistered = search.get("msg") === "cuenta_creada";

  const [mode, setMode] = useState<Mode>("pass");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  // Llegó desde el correo: se está canjeando el enlace.
  const [entering, setEntering] = useState(false);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passRef = useRef<HTMLInputElement | null>(null);

  // Enlace del correo: /login#acceso=<token>. El token va en el # para que no
  // quede en logs ni viaje como Referer; se borra de la URL apenas se lee.
  useEffect(() => {
    const m = window.location.hash.match(/acceso=([a-f0-9]{32,128})/i);
    if (!m) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setEntering(true);
    exchangeLoginLink(m[1])
      // Recarga completa: el proveedor de sesión arranca ya con la cookie.
      .then(() => window.location.replace(search.get("redirect") || ARTIST_HOME))
      .catch((err) => {
        setEntering(false);
        setMode("link");
        setErrorMsg(err?.response?.data?.error ? "Este enlace ya se usó o venció. Pide uno nuevo." : "No pudimos validar el enlace. Revisa tu conexión y pide uno nuevo.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Recordarme" se recuerda a sí mismo y el último correo vuelve precargado.
  useEffect(() => {
    try {
      const savedRemember = window.localStorage.getItem(REMEMBER_KEY);
      if (savedRemember !== null) setRemember(savedRemember === "1");
      const savedEmail = window.localStorage.getItem(LAST_EMAIL_KEY);
      if (savedEmail) setEmail(savedEmail);
    } catch {}
  }, []);

  // Foco en el primer campo vacío (solo al montar).
  useEffect(() => {
    const t = window.setTimeout(() => {
      (emailRef.current?.value ? passRef.current : emailRef.current)?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  const pick = (m: Mode) => {
    setMode(m);
    setErrorMsg(null);
    setLinkSent(false);
  };

  const validEmail = () => {
    if (/\S+@\S+\.\S+/.test(email)) return true;
    setErrorMsg("Ingresa un correo electrónico válido.");
    emailRef.current?.focus();
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!validEmail()) return;

    if (mode === "link") {
      setSubmitting(true);
      try {
        await requestLoginLink(email.trim());
        setLinkSent(true);
      } catch {
        setErrorMsg("No pudimos enviar el enlace. Inténtalo de nuevo en un momento o entra con tu contraseña.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      passRef.current?.focus();
      return;
    }
    try {
      setSubmitting(true);
      try {
        window.sessionStorage.setItem("LOGIN_NEXT", search.get("redirect") || ARTIST_HOME);
        window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
        // El correo solo se recuerda si el usuario pidió ser recordado.
        if (remember) window.localStorage.setItem(LAST_EMAIL_KEY, email.trim());
        else window.localStorage.removeItem(LAST_EMAIL_KEY);
      } catch {}
      await login(email.trim(), password, remember);
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setErrorMsg(
        e2?.response?.data?.error ||
          (e2?.response
            ? "No pudimos iniciar sesión. Inténtalo de nuevo en un momento."
            : "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.")
      );
      setSubmitting(false);
    }
  };

  if (entering) {
    return (
      <AuthShell eyebrow="Acceso artistas" title="Entrando a tu estudio…" lead="Estamos validando tu enlace. No cierres esta página.">
        <div className="fdm-au-card" aria-busy="true">
          <div className="fdm-au-steps"><i className="is-on" /><i className="is-on" /><i /></div>
        </div>
      </AuthShell>
    );
  }

  const sent = mode === "link" && linkSent;

  return (
    <AuthShell
      eyebrow="Acceso artistas"
      title="Entra a tu estudio"
      lead="Gestiona tus obras, tus códigos QR y las entregas de lo que vendas en la feria."
      foot={<>¿Aún no expones en la feria? <Link href="/convocatoria">Postula en la convocatoria</Link></>}
    >
      <form className="fdm-au-card" onSubmit={handleSubmit} noValidate>
        <div className="fdm-au-seg" role="group" aria-label="Forma de entrar">
          <button type="button" aria-pressed={mode === "pass"} onClick={() => pick("pass")}>Con contraseña</button>
          <button type="button" aria-pressed={mode === "link"} onClick={() => pick("link")}>Enlace por correo</button>
        </div>

        {justRegistered && !errorMsg && !sent && (
          <div className="fdm-au-info" role="status">Cuenta creada. Entra con tu correo y tu contraseña para continuar.</div>
        )}

        {sent ? (
          <div className="fdm-au-ok" role="status">
            <span className="t">Revisa tu correo</span>
            <span className="s">
              Si <b>{email.trim()}</b> tiene una cuenta de artista, le enviamos un enlace para entrar sin contraseña. Ábrelo en este mismo dispositivo. Sirve una sola vez y vence en 30 minutos.
            </span>
            <button type="button" onClick={() => setLinkSent(false)}>Usar otro correo o reenviar</button>
          </div>
        ) : (
          <>
            <div className="fdm-au-field">
              <label htmlFor="lg-mail">Correo electrónico</label>
              <input
                id="lg-mail"
                ref={emailRef}
                className="fdm-au-input"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="username"
                placeholder="nombre@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode === "pass" && (
              <div className="fdm-au-field">
                <div className="fdm-au-row">
                  <label htmlFor="lg-pass">Contraseña</label>
                  <Link href="/convocatoria/recuperar?role=artist">Olvidé mi contraseña</Link>
                </div>
                <PasswordInput
                  id="lg-pass"
                  inputRef={passRef}
                  value={password}
                  onChange={setPassword}
                  show={showPwd}
                  onToggle={() => setShowPwd((v) => !v)}
                  onCaps={setCapsOn}
                  autoComplete="current-password"
                />
                {capsOn && <span className="fdm-au-hint is-warn" role="status">Bloq Mayús está activado.</span>}
              </div>
            )}

            {mode === "pass" && (
              <label className="fdm-au-check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Recordarme en este dispositivo
              </label>
            )}

            {mode === "link" && (
              <span className="fdm-au-hint">Te enviamos un enlace de un solo uso. No necesitas recordar la contraseña.</span>
            )}

            {errorMsg && <div className="fdm-au-err" role="alert">{errorMsg}</div>}

            <button type="submit" className="fdm-au-submit" disabled={submitting}>
              {mode === "pass" ? (submitting ? "Entrando…" : "Entrar a mi estudio") : submitting ? "Enviando…" : "Enviarme el enlace"}
            </button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
