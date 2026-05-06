"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@provider/authProvider";

type Role = "buyer" | "artist";

const ARTIST_STEPS = [
  { n: "01", lbl: "Crear cuenta",    sub: "Registro artista"      },
  { n: "02", lbl: "Pagar",           sub: "$40,000 COP"           },
  { n: "03", lbl: "Subir obras",     sub: "Portafolio artístico"  },
  { n: "04", lbl: "Resolución",      sub: "Decisión del curador"  },
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

  const ui = useMemo(() => {
    if (role === "artist") {
      return {
        title: "Portal de artistas",
        subtitle: "Accede para gestionar tu participación en la convocatoria.",
        submitText: "Acceder al portal",
        next: "/artist",
        registerHref: "/convocatoria/register",
        registerText: "¿No tienes cuenta? Regístrate gratis",
      };
    }
    return {
      title: "Acceso coleccionistas",
      subtitle: "Ingresa para gestionar tu carrito, favoritos y pedidos.",
      submitText: "Iniciar sesión",
      next: "/",
      registerHref: "/registro",
      registerText: "¿Nuevo en la feria? Crea tu cuenta",
    };
  }, [role]);

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErrorMsg("Ingresa un correo electrónico válido."); return; }
    if (!password || password.length < 6)        { setErrorMsg("La contraseña debe tener al menos 6 caracteres."); return; }
    try {
      setSubmitting(true);
      try {
        const customRedirect = search.get("redirect");
        window.sessionStorage.setItem("LOGIN_NEXT", customRedirect || ui.next);
      } catch {}
      await login(email, password);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(e?.response?.data?.error || e?.message || "Credenciales incorrectas. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <div className="gl-root">
      <div className="gl-glow gl-glow--1" aria-hidden />
      <div className="gl-glow gl-glow--2" aria-hidden />

      <div className="gl-shell">

        {/* ══ LEFT — Brand ════════════════════════════ */}
        <aside className="gl-side">
          <div className="gl-side__top">
            <div className="gl-wordmark">
              <GemSvg /> <span>Feria del Millón</span>
            </div>
          </div>

          {role === "artist" ? (
            <>
              <div className="gl-hero">
                <h2 className="gl-hero__h">
                  Tu arte<br />
                  en el<br />
                  <span>millón.</span>
                </h2>
                <p className="gl-hero__p">
                  Inicia sesión para continuar con tu postulación a la convocatoria 2026.
                </p>
              </div>

              <ol className="gl-steps">
                {ARTIST_STEPS.map((s, i) => (
                  <li key={s.n} className="gl-step">
                    <div className="gl-step__dot">
                      <span>{s.n}</span>
                    </div>
                    {i < ARTIST_STEPS.length - 1 && <div className="gl-step__line" aria-hidden />}
                    <div className="gl-step__text">
                      <span className="gl-step__lbl">{s.lbl}</span>
                      <span className="gl-step__sub">{s.sub}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <div className="gl-hero">
                <h2 className="gl-hero__h">
                  Colecciona<br />
                  arte<br />
                  <span>emergente.</span>
                </h2>
                <p className="gl-hero__p">
                  Accede a obras únicas de artistas colombianos seleccionados por nuestro curador.
                </p>
              </div>

              <div className="gl-perks">
                {[
                  { ico: <HeartSvg />, txt: "Favoritos y seguimiento" },
                  { ico: <CartSvg />,  txt: "Carrito y pedidos"       },
                  { ico: <StarSvg />,  txt: "Acceso a preventa"       },
                ].map(p => (
                  <div key={p.txt} className="gl-perk">
                    <span className="gl-perk__ico">{p.ico}</span>
                    <span className="gl-perk__txt">{p.txt}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="gl-side__stat">
            <span className="gl-stat__n">500+</span>
            <span className="gl-stat__l">Artistas en la plataforma</span>
          </div>
        </aside>

        {/* ══ RIGHT — Form ════════════════════════════ */}
        <section className="gl-form-col">
          <div className="gl-form-inner">

            {/* Role toggle */}
            <div className="gl-toggle">
              <Link
                href="/login?role=buyer"
                className={`gl-toggle__btn${role === "buyer" ? " gl-toggle__btn--on" : ""}`}
              >
                Coleccionista
              </Link>
              <Link
                href="/login?role=artist"
                className={`gl-toggle__btn${role === "artist" ? " gl-toggle__btn--on" : ""}`}
              >
                Artista
              </Link>
            </div>

            <header className="gl-fhead">
              <h1 className="gl-fhead__h">{ui.title}</h1>
              <p className="gl-fhead__sub">{ui.subtitle}</p>
            </header>

            {errorMsg && (
              <div role="alert" className="gl-error">
                <span className="gl-error__dot" aria-hidden />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="gl-form">

              <div className="gl-field">
                <label htmlFor="gl-em">Correo electrónico</label>
                <div className="gl-input-wrap">
                  <span className="gl-ico" aria-hidden><MailSvg /></span>
                  <input
                    id="gl-em" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email" placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <div className="gl-field">
                <div className="gl-field__row">
                  <label htmlFor="gl-pw">Contraseña</label>
                  <Link href="/convocatoria/recuperar" className="gl-forgot">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="gl-input-wrap">
                  <span className="gl-ico" aria-hidden><LockSvg /></span>
                  <input
                    id="gl-pw" type={showPwd ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" placeholder="••••••••"
                    style={{ paddingRight: 64 }}
                  />
                  <button type="button" className="gl-pw-btn" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="gl-cta">
                {submitting
                  ? <><SpinSvg /> Iniciando acceso…</>
                  : <>{ui.submitText} <ArrowSvg /></>
                }
              </button>

            </form>

            <div className="gl-foot">
              <Link href={ui.registerHref} className="gl-foot__link">
                {ui.registerText}
              </Link>
            </div>

          </div>
        </section>
      </div>

      <style jsx>{`
        /* ── Tokens ── */
        .gl-root {
          --g:      #22c55e;
          --g-dim:  rgba(34,197,94,.09);
          --g-ring: rgba(34,197,94,.2);
          --g-bd:   rgba(34,197,94,.3);
          --blk:    #000;
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
          background: var(--blk);
          color: var(--tx);
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          position: relative;
          overflow: hidden;
        }

        /* Glows */
        .gl-glow {
          position: absolute; border-radius: 50%;
          filter: blur(160px); opacity: .07; pointer-events: none;
        }
        .gl-glow--1 { width: 460px; height: 460px; top: -120px; left: -80px;  background: var(--g); }
        .gl-glow--2 { width: 340px; height: 340px; bottom: -120px; right: -60px; background: #4ade80; }

        /* Shell */
        .gl-shell {
          position: relative; z-index: 1;
          width: 100%; max-width: 880px;
          display: grid;
          grid-template-columns: 320px 1fr;
          min-height: 580px;
          border-radius: 22px;
          border: 1px solid var(--bd2);
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,.03) inset, 0 48px 96px rgba(0,0,0,.75);
          animation: gl-in .5s var(--e) both;
        }
        @keyframes gl-in { from{opacity:0;transform:translateY(18px) scale(.98)} to{opacity:1;transform:none} }
        @media (max-width: 780px) {
          .gl-shell {
            grid-template-columns: 1fr;
            max-width: 480px;
            min-height: unset;
            border-radius: 18px;
          }
          .gl-side { display: none; }
        }

        /* ══ LEFT SIDE ═══════════════════════════════ */
        .gl-side {
          background: var(--blk);
          border-right: 1px solid var(--bd2);
          padding: 44px 36px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .gl-side::before {
          content: '';
          position: absolute; bottom: -60px; left: -60px;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(34,197,94,.11) 0%, transparent 70%);
          pointer-events: none;
        }
        .gl-side__top { margin-bottom: 48px; }
        .gl-wordmark {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: var(--tx3);
        }
        .gl-wordmark svg { color: var(--g); }

        /* Hero text */
        .gl-hero { flex: 1; }
        .gl-hero__h {
          font-size: 44px; font-weight: 900;
          line-height: .92; letter-spacing: -2.5px;
          margin: 0 0 16px; color: rgba(255,255,255,.88);
        }
        .gl-hero__h span { color: var(--g); display: block; }
        .gl-hero__p { font-size: 13px; color: var(--tx3); line-height: 1.7; margin: 0 0 36px; max-width: 230px; }

        /* Artist steps */
        .gl-steps { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 0; }
        .gl-step {
          display: flex; align-items: flex-start; gap: 12px;
          position: relative; padding-bottom: 16px;
        }
        .gl-step__dot {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          border: 1.5px solid var(--bd2); background: var(--s2);
          font-size: 10px; font-weight: 800; color: var(--tx3);
          display: flex; align-items: center; justify-content: center;
        }
        .gl-step__line {
          position: absolute; left: 13px; top: 30px; bottom: 0;
          width: 1.5px; background: var(--bd);
        }
        .gl-step__text { display: flex; flex-direction: column; gap: 1px; padding-top: 4px; }
        .gl-step__lbl { font-size: 12.5px; font-weight: 600; color: var(--tx3); }
        .gl-step__sub { font-size: 11px; color: var(--tx3); }

        /* Buyer perks */
        .gl-perks { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; flex: 1; }
        .gl-perk { display: flex; align-items: center; gap: 12px; }
        .gl-perk__ico {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--g-dim); border: 1px solid var(--g-bd);
          color: var(--g); display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .gl-perk__txt { font-size: 13px; color: var(--tx2); font-weight: 500; }

        /* Bottom stat */
        .gl-side__stat {
          display: flex; flex-direction: column; gap: 2px;
          padding-top: 20px; border-top: 1px solid var(--bd);
          margin-top: auto;
        }
        .gl-stat__n { font-size: 28px; font-weight: 900; color: var(--tx); line-height: 1; letter-spacing: -1px; }
        .gl-stat__l { font-size: 11px; color: var(--tx3); }

        /* ══ RIGHT FORM ══════════════════════════════ */
        .gl-form-col {
          background: var(--s1);
          display: flex; align-items: center; justify-content: center;
        }
        .gl-form-inner {
          width: 100%; max-width: 400px;
          padding: 48px 44px;
        }
        @media (max-width: 780px) {
          .gl-form-inner { padding: 40px 32px; max-width: 460px; }
        }
        @media (max-width: 480px) {
          .gl-form-inner { padding: 32px 22px; }
        }

        /* ── Role toggle (segmented control) ── */
        .gl-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--s2);
          border: 1px solid var(--bd2);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 3px;
        }
        .gl-toggle__btn {
          text-align: center;
          padding: 9px 14px;
          border-radius: 9px;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(255,255,255,.38);
          text-decoration: none;
          letter-spacing: .01em;
          transition: background .18s var(--e), color .18s var(--e), box-shadow .18s var(--e);
        }
        .gl-toggle__btn:hover:not(.gl-toggle__btn--on) {
          color: var(--g);
          background: rgba(34,197,94,.07);
        }
        .gl-toggle__btn--on {
          background: var(--g);
          color: #000 !important;
          font-weight: 700;
          box-shadow: 0 2px 14px rgba(34,197,94,.35), 0 1px 3px rgba(0,0,0,.3);
        }

        /* ── Form head ── */
        .gl-fhead { margin-bottom: 22px; }
        .gl-fhead__h {
          font-size: 23px; font-weight: 900; letter-spacing: -.7px;
          margin: 0 0 5px;
          color: rgba(255,255,255,.95) !important;
        }
        .gl-fhead__sub {
          font-size: 13px;
          color: rgba(255,255,255,.5) !important;
          margin: 0; line-height: 1.5;
        }

        /* ── Error ── */
        .gl-error {
          display: flex; align-items: center; gap: 10px;
          background: rgba(248,113,113,.06); border: 1px solid rgba(248,113,113,.2);
          border-radius: 10px; padding: 10px 14px; color: #f87171 !important;
          font-size: 13px; margin-bottom: 18px;
        }
        .gl-error__dot { width: 6px; height: 6px; border-radius: 50%; background: #f87171; flex-shrink: 0; }

        /* ── Form fields ── */
        .gl-form { display: flex; flex-direction: column; gap: 14px; }
        .gl-field { display: flex; flex-direction: column; gap: 6px; }
        .gl-field label {
          font-size: 11.5px !important;
          font-weight: 700 !important;
          color: rgba(255,255,255,.55) !important;
          letter-spacing: .04em !important;
          text-transform: uppercase !important;
          margin: 0 !important;
        }
        .gl-field__row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .gl-forgot {
          font-size: 11.5px; font-weight: 600;
          color: rgba(255,255,255,.3) !important;
          text-decoration: none;
          transition: color .15s;
          letter-spacing: 0;
          text-transform: none !important;
        }
        .gl-forgot:hover { color: var(--g) !important; }

        /* ── Input with icon ── */
        .gl-input-wrap {
          position: relative; display: flex; align-items: center;
        }
        .gl-ico {
          position: absolute; left: 13px; z-index: 1;
          color: rgba(255,255,255,.3);
          display: flex; align-items: center;
          pointer-events: none;
          transition: color .15s;
        }
        .gl-input-wrap:focus-within .gl-ico { color: var(--g); }
        .gl-input-wrap input {
          width: 100%;
          background: #111 !important;
          border: 1.5px solid rgba(255,255,255,.12) !important;
          border-radius: 11px;
          padding: 12px 14px 12px 40px !important;
          font-size: 14px !important;
          color: rgba(255,255,255,.9) !important;
          font-family: inherit !important;
          outline: none !important;
          box-sizing: border-box;
          box-shadow: none !important;
          transition: border-color .15s var(--e), background .15s var(--e), box-shadow .15s var(--e);
        }
        .gl-input-wrap input::placeholder { color: rgba(255,255,255,.22) !important; }
        .gl-input-wrap input:hover {
          border-color: rgba(255,255,255,.2) !important;
          background: #181818 !important;
        }
        .gl-input-wrap input:focus {
          border-color: var(--g) !important;
          background: #181818 !important;
          box-shadow: 0 0 0 3px rgba(34,197,94,.18) !important;
        }

        /* ── Pw toggle ── */
        .gl-pw-btn {
          position: absolute; right: 10px;
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,.3) !important;
          background: rgba(255,255,255,.05) !important;
          border: 1px solid rgba(255,255,255,.1) !important;
          padding: 3px 8px; border-radius: 6px; cursor: pointer;
          transition: color .15s, border-color .15s;
        }
        .gl-pw-btn:hover { color: rgba(255,255,255,.8) !important; border-color: rgba(255,255,255,.2) !important; }

        /* ── CTA ── */
        .gl-cta {
          width: 100%; background: var(--g); color: #000 !important; border: none;
          border-radius: 12px; padding: 14px 20px; font-size: 15px; font-weight: 800;
          font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .22s var(--e);
          box-shadow: 0 4px 24px rgba(34,197,94,.25);
          letter-spacing: -.01em;
          margin-top: 6px;
        }
        .gl-cta:hover:not(:disabled) {
          background: #4ade80;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(34,197,94,.4);
        }
        .gl-cta:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 12px rgba(34,197,94,.2); }
        .gl-cta:disabled { opacity: .25; cursor: not-allowed; box-shadow: none; transform: none; }

        /* ── Footer ── */
        .gl-foot {
          margin-top: 22px; text-align: center;
          padding-top: 18px; border-top: 1px solid rgba(255,255,255,.06);
        }
        .gl-foot__link {
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,.38) !important;
          text-decoration: none; transition: color .15s;
        }
        .gl-foot__link:hover { color: var(--g) !important; }

        @keyframes gl-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── SVG icons ── */
function GemSvg() {
  return <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8 14L1 6l2-3h10l2 3-7 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M1 6h14M5 3l3 11M11 3l-3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
}
function MailSvg() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function LockSvg() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function ArrowSvg() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function SpinSvg() {
  return <span style={{ animation:"gl-spin .7s linear infinite", display:"flex" }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity=".2"/>
      <path d="M14 8a6 6 0 01-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </span>;
}
function HeartSvg() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8 13.5S1.5 9.5 1.5 5.5a3.5 3.5 0 017 0 3.5 3.5 0 017 0c0 4-6.5 8-6.5 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>;
}
function CartSvg() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M1 1h2l2.5 8h7l1.5-5H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6.5" cy="13" r="1" fill="currentColor"/>
    <circle cx="11.5" cy="13" r="1" fill="currentColor"/>
  </svg>;
}
function StarSvg() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8 1l1.8 5H15l-4.4 3.2 1.7 5.2L8 11.2l-4.3 3.2 1.7-5.2L1 6h5.2L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>;
}
