"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@services/auth.service";
import { useAuth } from "@provider/authProvider";
import { Suspense } from "react";

function RecuperarContent() {
  const search = useSearchParams();
  const { login } = useAuth();
  const tokenParam = search.get("token") || "";

  const [step, setStep] = useState<"email" | "token" | "done">(tokenParam ? "token" : "email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Ingresa tu correo electrónico"); return; }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep("token");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al enviar el correo");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) { setError("Ingresa el código de recuperación"); return; }
    if (newPassword.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setStep("done");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Token inválido o expirado");
    } finally { setLoading(false); }
  };

  return (
    <div className="rec-root">
      <div className="rec-glow rec-glow--1" />
      <div className="rec-glow rec-glow--2" />

      <div className="rec-card">
        {/* Logo */}
        <div className="rec-logo">
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
            <path d="M8 14L1 6l2-3h10l2 3-7 8z" stroke="#22c55e" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M1 6h14M5 3l3 11M11 3l-3 11" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span>Feria del Millón</span>
        </div>

        {step === "email" && (
          <>
            <div className="rec-icon">🔐</div>
            <h1 className="rec-title">Recuperar contraseña</h1>
            <p className="rec-subtitle">Ingresa el correo con el que te registraste. Te enviaremos un código para restablecer tu contraseña.</p>

            {error && <div className="rec-error"><span className="rec-error__dot" />{error}</div>}

            <form onSubmit={handleRequestReset} className="rec-form">
              <div className="rec-field">
                <label htmlFor="rec-email">Correo electrónico</label>
                <input id="rec-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" placeholder="artista@correo.com" autoFocus />
              </div>
              <button type="submit" className="rec-cta" disabled={loading}>
                {loading ? <><SpinSvg /> Enviando…</> : <>Enviar código de recuperación</>}
              </button>
            </form>
          </>
        )}

        {step === "token" && (
          <>
            <div className="rec-icon">📬</div>
            <h1 className="rec-title">Ingresa el código</h1>
            <p className="rec-subtitle">
              Revisa tu correo electrónico{email ? ` (${email})` : ""}. Pega el código de recuperación y establece tu nueva contraseña.
            </p>

            {error && <div className="rec-error"><span className="rec-error__dot" />{error}</div>}

            <form onSubmit={handleResetPassword} className="rec-form">
              <div className="rec-field">
                <label htmlFor="rec-token">Código de recuperación</label>
                <input id="rec-token" type="text" value={token} onChange={e => setToken(e.target.value)}
                  placeholder="Pega el código del correo" autoComplete="off" autoFocus />
              </div>
              <div className="rec-field">
                <label htmlFor="rec-newpw">Nueva contraseña</label>
                <div className="rec-pwd-wrap">
                  <input id="rec-newpw" type={showPwd ? "text" : "password"} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                  <button type="button" className="rec-pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>
              <div className="rec-field">
                <label htmlFor="rec-confirmpw">Confirmar contraseña</label>
                <input id="rec-confirmpw" type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña" autoComplete="new-password" />
              </div>
              <button type="submit" className="rec-cta" disabled={loading}>
                {loading ? <><SpinSvg /> Restableciendo…</> : <>Restablecer contraseña</>}
              </button>
              <button type="button" className="rec-ghost" onClick={() => { setStep("email"); setError(""); }}>
                ← Volver a enviar código
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <>
            <div className="rec-icon rec-icon--success">✅</div>
            <h1 className="rec-title">¡Contraseña restablecida!</h1>
            <p className="rec-subtitle">Tu contraseña fue actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <Link href="/login?role=artist&redirect=/convocatoria/aplicar" className="rec-cta" style={{ textDecoration: "none", textAlign: "center" }}>
              Iniciar sesión →
            </Link>
          </>
        )}

        <div className="rec-footer">
          <p>
            <Link href="/login?role=artist&redirect=/convocatoria/aplicar">Iniciar sesión</Link>
            {" · "}
            <Link href="/convocatoria/register">Crear cuenta</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .rec-root {
          --g: #22c55e; --g-dim: rgba(34,197,94,.08); --g-ring: rgba(34,197,94,.2);
          font-family: 'Inter', system-ui, sans-serif;
          background: #000; color: rgba(255,255,255,.93);
          min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center;
          padding: 32px 16px; position: relative; overflow: hidden;
        }
        .rec-glow { position: absolute; border-radius: 50%; filter: blur(140px); opacity: .08; pointer-events: none; }
        .rec-glow--1 { width: 400px; height: 400px; top: -100px; left: -60px; background: var(--g); }
        .rec-glow--2 { width: 300px; height: 300px; bottom: -100px; right: -60px; background: #4ade80; }

        .rec-card {
          position: relative; z-index: 1;
          background: linear-gradient(180deg, #111 0%, #0a0a0a 100%);
          border: 1px solid rgba(255,255,255,.08); border-radius: 24px;
          padding: 40px 36px 28px; max-width: 440px; width: 100%; text-align: center;
          box-shadow: 0 0 0 1px rgba(255,255,255,.03) inset, 0 24px 80px rgba(0,0,0,.6);
          animation: rec-in .5s cubic-bezier(.16,1,.3,1);
        }
        @keyframes rec-in { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }

        .rec-logo { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: rgba(255,255,255,.5); margin-bottom: 20px; }

        .rec-icon { font-size: 40px; margin-bottom: 12px; }
        .rec-icon--success { animation: rec-bounce .5s ease; }
        @keyframes rec-bounce { 0%{transform:scale(0)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }

        .rec-title { font-size: 24px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 8px; }
        .rec-subtitle { font-size: 13.5px; color: rgba(255,255,255,.5); margin: 0 0 24px; line-height: 1.6; }

        .rec-error {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(248,113,113,.06); border: 1px solid rgba(248,113,113,.2);
          border-radius: 10px; padding: 10px 14px; color: #f87171;
          font-size: 13px; margin-bottom: 16px;
        }
        .rec-error__dot { width: 6px; height: 6px; border-radius: 50%; background: #f87171; flex-shrink: 0; }

        .rec-form { display: flex; flex-direction: column; gap: 14px; text-align: left; }
        .rec-field { display: flex; flex-direction: column; gap: 4px; }
        .rec-field label { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.25); }
        .rec-form input {
          width: 100%; background: #111; border: 1.5px solid rgba(255,255,255,.12);
          border-radius: 10px; padding: 11px 14px; font-size: 14px;
          color: rgba(255,255,255,.93); font-family: inherit; outline: none;
          transition: border-color .15s, background .15s, box-shadow .15s;
          box-sizing: border-box;
        }
        .rec-form input::placeholder { color: rgba(255,255,255,.25); }
        .rec-form input:focus { border-color: var(--g); background: #151515; box-shadow: 0 0 0 3px var(--g-ring); }

        .rec-pwd-wrap { position: relative; }
        .rec-pwd-wrap input { padding-right: 60px; }
        .rec-pwd-toggle {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,.25);
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
          padding: 3px 8px; border-radius: 6px; cursor: pointer;
        }
        .rec-pwd-toggle:hover { color: #fff; }

        .rec-cta {
          width: 100%; background: var(--g); color: #000; border: none;
          border-radius: 12px; padding: 13px 20px; font-size: 14px; font-weight: 700;
          font-family: inherit; cursor: pointer; display: flex;
          align-items: center; justify-content: center; gap: 8px;
          transition: all .2s; box-shadow: 0 4px 20px rgba(34,197,94,.2);
        }
        .rec-cta:hover:not(:disabled) { background: #4ade80; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(34,197,94,.35); }
        .rec-cta:disabled { opacity: .3; cursor: not-allowed; }

        .rec-ghost {
          width: 100%; background: rgba(255,255,255,.04); color: rgba(255,255,255,.5);
          border: 1px solid rgba(255,255,255,.08); border-radius: 10px;
          padding: 10px; font-size: 13px; font-weight: 600; font-family: inherit;
          cursor: pointer; transition: all .15s;
        }
        .rec-ghost:hover { background: rgba(255,255,255,.08); color: #fff; }

        .rec-footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.08); }
        .rec-footer p { font-size: 13px; color: rgba(255,255,255,.25); margin: 0; }
        .rec-footer a { color: var(--g); font-weight: 700; text-decoration: none; }
        .rec-footer a:hover { text-decoration: underline; }

        @keyframes rec-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function SpinSvg() {
  return <span style={{ animation: "rec-spin .7s linear infinite", display: "flex" }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity=".2"/>
      <path d="M14 8a6 6 0 01-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </span>;
}

export default function RecuperarPage() {
  return (
    <Suspense fallback={<div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Cargando…</div>}>
      <RecuperarContent />
    </Suspense>
  );
}
