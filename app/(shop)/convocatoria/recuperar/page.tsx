"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@services/auth.service";

function RecuperarContent() {
  const search    = useSearchParams();
  const tokenParam = search.get("token") || "";

  const [step,            setStep]            = useState<"email"|"sent"|"token"|"done">(tokenParam ? "token" : "email");
  const [email,           setEmail]           = useState("");
  const [token,           setToken]           = useState(tokenParam);
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [showPwd,         setShowPwd]         = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Ingresa tu correo electrónico"); return; }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep("sent");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || "Error al enviar el correo");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token)                          { setError("Ingresa el código de recuperación"); return; }
    if (newPassword.length < 8)          { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setStep("done");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || "Token inválido o expirado");
    } finally { setLoading(false); }
  };

  return (
    <div className="rc-root">
      <div className="rc-glow rc-glow--1" aria-hidden />
      <div className="rc-glow rc-glow--2" aria-hidden />

      <div className="rc-card">

        {/* Wordmark */}
        <div className="rc-wordmark">
          <GemSvg /> <span>Feria del Millón</span>
        </div>

        {/* ── Step: email ── */}
        {step === "email" && (
          <>
            <div className="rc-icon-wrap">
              <MailLockSvg />
            </div>
            <h1 className="rc-title">Recuperar contraseña</h1>
            <p className="rc-sub">
              Ingresa el correo con el que te registraste. Te enviaremos un código
              para restablecer tu contraseña.
            </p>

            {error && <Err msg={error} />}

            <form onSubmit={handleRequestReset} className="rc-form">
              <Fld label="Correo electrónico" htmlFor="rc-em">
                <input id="rc-em" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email" placeholder="artista@correo.com" autoFocus />
              </Fld>
              <button type="submit" className="rc-cta" disabled={loading}>
                {loading ? <><Spin /> Enviando…</> : <>Enviar código de recuperación <ArrowSvg /></>}
              </button>
            </form>
          </>
        )}

        {/* ── Step: sent ── */}
        {step === "sent" && (
          <>
            <div className="rc-icon-wrap">
              <InboxSvg />
            </div>
            <h1 className="rc-title">Revisa tu correo</h1>
            <p className="rc-sub">
              Te enviamos un correo de recuperación a <strong>{email}</strong>.
              Ábrelo y haz clic en el botón de <strong>restablecer contraseña</strong> para continuar.
            </p>

            {error && <Err msg={error} />}

            <button type="button" className="rc-cta" disabled={loading} onClick={handleRequestReset}>
              {loading ? <><Spin /> Reenviando…</> : <>Reenviar correo <ArrowSvg /></>}
            </button>
            <button type="button" className="rc-ghost"
              onClick={() => { setStep("email"); setError(""); }}>
              ← Usar otro correo
            </button>
          </>
        )}

        {/* ── Step: token ── */}
        {step === "token" && (
          <>
            <div className="rc-icon-wrap">
              <InboxSvg />
            </div>
            <h1 className="rc-title">Nueva contraseña</h1>
            <p className="rc-sub">
              {tokenParam
                ? "Establece tu nueva contraseña para continuar."
                : <>Revisa tu correo{email && <> (<strong>{email}</strong>)</>}. Pega el código y establece tu nueva contraseña.</>}
            </p>

            {error && <Err msg={error} />}

            <form onSubmit={handleResetPassword} className="rc-form">
              {!tokenParam && (
                <Fld label="Código de recuperación" htmlFor="rc-tok">
                  <input id="rc-tok" type="text" value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Pega el código del correo"
                    autoComplete="off" autoFocus />
                </Fld>
              )}
              <Fld label="Nueva contraseña" htmlFor="rc-npw">
                <div className="rc-pw-wrap">
                  <input id="rc-npw" type={showPwd ? "text" : "password"}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                    autoFocus={!!tokenParam} />
                  <button type="button" className="rc-pw-btn" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </Fld>
              <Fld label="Confirmar contraseña" htmlFor="rc-cpw">
                <input id="rc-cpw" type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña" autoComplete="new-password" />
              </Fld>
              <button type="submit" className="rc-cta" disabled={loading}>
                {loading ? <><Spin /> Restableciendo…</> : <>Restablecer contraseña <ArrowSvg /></>}
              </button>
              <button type="button" className="rc-ghost"
                onClick={() => { setStep(email ? "sent" : "email"); setError(""); }}>
                ← Volver a enviar código
              </button>
            </form>
          </>
        )}

        {/* ── Step: done ── */}
        {step === "done" && (
          <>
            <div className="rc-icon-wrap rc-icon-wrap--ok">
              <CheckCircleSvg />
            </div>
            <h1 className="rc-title">¡Contraseña restablecida!</h1>
            <p className="rc-sub">
              Tu contraseña fue actualizada exitosamente. Ya puedes iniciar sesión.
            </p>
            <Link href="/login?role=artist&redirect=/convocatoria/aplicar" className="rc-cta" style={{ textDecoration:"none", textAlign:"center" }}>
              Iniciar sesión <ArrowSvg />
            </Link>
          </>
        )}

        <div className="rc-foot">
          <Link href="/login?role=artist&redirect=/convocatoria/aplicar">Iniciar sesión</Link>
          <span className="rc-foot__dot" aria-hidden>·</span>
          <Link href="/convocatoria/register">Crear cuenta</Link>
        </div>
      </div>

      <style jsx>{`
        .rc-root {
          --g:      #22c55e;
          --g-dim:  rgba(34,197,94,.09);
          --g-ring: rgba(34,197,94,.2);
          --g-bd:   rgba(34,197,94,.3);
          --s1:     #0a0a0a;
          --s2:     #111;
          --s3:     #181818;
          --bd:     rgba(255,255,255,.08);
          --bd2:    rgba(255,255,255,.14);
          --tx:     rgba(255,255,255,.93);
          --tx2:    rgba(255,255,255,.62);
          --tx3:    rgba(255,255,255,.32);
          --er:     #f87171;
          --e:      cubic-bezier(.16,1,.3,1);
          font-family: 'Inter', system-ui, sans-serif;
          background: #000; color: var(--tx);
          min-height: calc(100vh - 64px);
          display: flex; align-items: center; justify-content: center;
          padding: 32px 16px; position: relative; overflow: hidden;
        }

        /* Glows */
        .rc-glow { position: absolute; border-radius: 50%; filter: blur(160px); opacity: .07; pointer-events: none; }
        .rc-glow--1 { width: 400px; height: 400px; top: -120px; left: -80px; background: var(--g); }
        .rc-glow--2 { width: 300px; height: 300px; bottom: -100px; right: -60px; background: #4ade80; }

        /* Card */
        .rc-card {
          position: relative; z-index: 1;
          background: linear-gradient(160deg, var(--s2) 0%, var(--s1) 100%);
          border: 1px solid var(--bd2); border-radius: 22px;
          padding: 44px 40px 32px; max-width: 440px; width: 100%;
          text-align: center;
          box-shadow: 0 0 0 1px rgba(255,255,255,.03) inset, 0 32px 80px rgba(0,0,0,.65);
          animation: rc-in .5s var(--e) both;
        }
        @keyframes rc-in { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }

        /* Wordmark */
        .rc-wordmark {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12.5px; font-weight: 700; color: var(--tx3);
          margin-bottom: 28px;
        }
        .rc-wordmark svg { color: var(--g); }

        /* Icon */
        .rc-icon-wrap {
          width: 64px; height: 64px; border-radius: 16px;
          background: var(--g-dim); border: 1px solid var(--g-bd);
          color: var(--g);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          transition: background .3s;
        }
        .rc-icon-wrap--ok { background: rgba(34,197,94,.15); animation: rc-pop .4s var(--e); }
        @keyframes rc-pop { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }

        .rc-title { font-size: 22px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 8px; }
        .rc-sub { font-size: 13.5px; color: var(--tx2); margin: 0 0 24px; line-height: 1.6; }
        .rc-sub strong { color: var(--tx); font-weight: 600; }

        /* Error */
        .rc-err {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(248,113,113,.06); border: 1px solid rgba(248,113,113,.2);
          border-radius: 10px; padding: 10px 14px; color: var(--er);
          font-size: 13px; margin-bottom: 16px;
        }
        .rc-err__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--er); flex-shrink: 0; }

        /* Form */
        .rc-form { display: flex; flex-direction: column; gap: 14px; text-align: left; }

        .rc-form input {
          width: 100%; background: var(--s2); border: 1.5px solid var(--bd2);
          border-radius: 10px; padding: 11px 14px; font-size: 14px;
          color: var(--tx); font-family: inherit; outline: none;
          box-sizing: border-box;
          transition: border-color .15s var(--e), background .15s var(--e), box-shadow .15s var(--e);
        }
        .rc-form input::placeholder { color: var(--tx3); }
        .rc-form input:hover { border-color: rgba(255,255,255,.22); background: var(--s3); }
        .rc-form input:focus { border-color: var(--g); background: var(--s3); box-shadow: 0 0 0 3px var(--g-ring); }

        /* Pw wrap */
        .rc-pw-wrap { position: relative; }
        .rc-pw-wrap input { padding-right: 62px; }
        .rc-pw-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          font-size: 11px; font-weight: 700; color: var(--tx3);
          background: rgba(255,255,255,.06); border: 1px solid var(--bd2);
          padding: 3px 8px; border-radius: 6px; cursor: pointer;
          transition: color .15s, border-color .15s;
        }
        .rc-pw-btn:hover { color: var(--tx); border-color: rgba(255,255,255,.22); }

        /* CTA */
        .rc-cta {
          width: 100%; background: var(--g); color: #000; border: none;
          border-radius: 11px; padding: 13px 20px; font-size: 14.5px; font-weight: 700;
          font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .2s var(--e); box-shadow: 0 4px 22px rgba(34,197,94,.22);
        }
        .rc-cta:hover:not(:disabled) {
          background: #4ade80; transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(34,197,94,.38);
        }
        .rc-cta:active:not(:disabled) { transform: translateY(0); }
        .rc-cta:disabled { opacity: .28; cursor: not-allowed; box-shadow: none; }

        /* Ghost */
        .rc-ghost {
          width: 100%; background: rgba(255,255,255,.04); color: var(--tx3);
          border: 1px solid var(--bd2); border-radius: 10px;
          padding: 10px; font-size: 13px; font-weight: 600; font-family: inherit;
          cursor: pointer; transition: all .15s var(--e);
        }
        .rc-ghost:hover { background: rgba(255,255,255,.08); color: var(--tx2); border-color: rgba(255,255,255,.2); }

        /* Footer */
        .rc-foot {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--bd);
        }
        .rc-foot a { font-size: 13px; font-weight: 600; color: var(--g); text-decoration: none; }
        .rc-foot a:hover { text-decoration: underline; }
        .rc-foot__dot { color: var(--tx3); font-size: 13px; }

        @keyframes rc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Small helpers ── */
function Fld({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label htmlFor={htmlFor} style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.62)" }}>{label}</label>
      {children}
    </div>
  );
}
function Err({ msg }: { msg: string }) {
  return (
    <div role="alert" className="rc-err">
      <span className="rc-err__dot" aria-hidden />
      {msg}
    </div>
  );
}
function Spin() {
  return <span style={{ animation:"rc-spin .7s linear infinite", display:"flex" }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity=".2"/>
      <path d="M14 8a6 6 0 01-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </span>;
}

/* ── SVG icons ── */
function GemSvg() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8 14L1 6l2-3h10l2 3-7 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M1 6h14M5 3l3 11M11 3l-3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
}
function ArrowSvg() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function MailLockSvg() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 8l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="16" y="11" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M17.5 11V9.5a1.5 1.5 0 013 0V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function InboxSvg() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 14h4l2 3h8l2-3h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function CheckCircleSvg() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 12l3.5 3.5L17 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export default function RecuperarPage() {
  return (
    <Suspense fallback={
      <div style={{ background:"#000", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#333" }}>
        Cargando…
      </div>
    }>
      <RecuperarContent />
    </Suspense>
  );
}
