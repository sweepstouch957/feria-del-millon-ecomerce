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

            {/* Role selector — premium cards */}
            <div className="gl-roles">
              <Link
                href="/login?role=buyer"
                className={`gl-role${role === "buyer" ? " gl-role--on" : ""}`}
                style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:11 }}
              >
                <span className="gl-role__ico"><GemSmSvg /></span>
                <span className="gl-role__body">
                  <span className="gl-role__name">Coleccionista</span>
                  <span className="gl-role__sub">Compra y descubre</span>
                </span>
              </Link>
              <Link
                href="/login?role=artist"
                className={`gl-role${role === "artist" ? " gl-role--on" : ""}`}
                style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:11 }}
              >
                <span className="gl-role__ico"><PaletteSvg /></span>
                <span className="gl-role__body">
                  <span className="gl-role__name">Artista</span>
                  <span className="gl-role__sub">Postula tu obra</span>
                </span>
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

        /* ── Role selector cards ── */
        .gl-roles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 32px;
        }
        .gl-role {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 11px;
          padding: 14px;
          border-radius: 16px;
          text-decoration: none !important;
          border: 1.5px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.025);
          transition: all .22s var(--e);
          position: relative;
          overflow: hidden;
        }
        .gl-role::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: inherit;
          background: radial-gradient(ellipse at 0% 0%, rgba(34,197,94,.08) 0%, transparent 70%);
          opacity: 0; transition: opacity .22s;
          pointer-events: none;
        }
        .gl-role--on::after { opacity: 1; }
        .gl-role:hover:not(.gl-role--on) {
          border-color: rgba(255,255,255,.13);
          background: rgba(255,255,255,.04);
          transform: translateY(-1px);
        }
        .gl-role--on {
          border-color: rgba(34,197,94,.4);
          background: rgba(34,197,94,.07);
          box-shadow: 0 0 0 1px rgba(34,197,94,.12), 0 8px 28px rgba(34,197,94,.12);
          transform: translateY(-1px);
        }

        .gl-role__ico {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.06);
          color: rgba(255,255,255,.3);
          transition: all .22s var(--e);
        }
        .gl-role--on .gl-role__ico {
          background: var(--g);
          color: #000;
          box-shadow: 0 4px 14px rgba(34,197,94,.4);
        }
        .gl-role:hover:not(.gl-role--on) .gl-role__ico {
          background: rgba(255,255,255,.09);
          color: rgba(255,255,255,.6);
        }

        .gl-role__body {
          display: flex !important; flex-direction: column !important;
          gap: 2px; flex: 1; min-width: 0;
        }
        .gl-role__name {
          font-size: 13px; font-weight: 700;
          color: rgba(255,255,255,.35);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color .22s;
          display: block !important;
          line-height: 1.2;
        }
        .gl-role__sub {
          font-size: 10.5px; color: rgba(255,255,255,.2);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color .22s;
          display: block !important;
          line-height: 1.2;
        }
        .gl-role--on .gl-role__name { color: rgba(255,255,255,.92); }
        .gl-role--on .gl-role__sub  { color: rgba(34,197,94,.65); }
        .gl-role:hover:not(.gl-role--on) .gl-role__name { color: rgba(255,255,255,.65); }

        /* ── Form head ── */
        .gl-fhead { margin-bottom: 24px; padding-top: 4px; }
        .gl-fhead__h {
          font-size: 26px; font-weight: 900; letter-spacing: -1px;
          margin: 0 0 6px; line-height: 1.08;
          color: rgba(255,255,255,.96) !important;
        }
        .gl-fhead__sub {
          font-size: 13.5px;
          color: rgba(255,255,255,.42) !important;
          margin: 0; line-height: 1.55;
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
        .gl-form { display: flex; flex-direction: column; gap: 16px; }
        .gl-field { display: flex; flex-direction: column; gap: 7px; }
        .gl-field label {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: rgba(255,255,255,.4) !important;
          letter-spacing: .08em !important;
          text-transform: uppercase !important;
          margin: 0 !important;
        }
        .gl-field__row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .gl-forgot {
          font-size: 11.5px; font-weight: 600;
          color: rgba(255,255,255,.45) !important;
          text-decoration: underline !important;
          text-underline-offset: 3px !important;
          text-decoration-color: rgba(255,255,255,.15) !important;
          transition: color .15s, text-decoration-color .15s;
          letter-spacing: 0;
          text-transform: none !important;
          cursor: pointer;
        }
        .gl-forgot:hover {
          color: var(--g) !important;
          text-decoration-color: rgba(34,197,94,.5) !important;
        }

        /* ── Input with icon ── */
        .gl-input-wrap {
          position: relative; display: flex; align-items: center;
        }
        .gl-ico {
          position: absolute; left: 14px; z-index: 1;
          color: rgba(255,255,255,.25);
          display: flex; align-items: center;
          pointer-events: none;
          transition: color .2s var(--e);
        }
        .gl-input-wrap:focus-within .gl-ico { color: var(--g); }
        .gl-input-wrap input {
          width: 100%;
          background: rgba(255,255,255,.04) !important;
          border: 1.5px solid rgba(255,255,255,.1) !important;
          border-radius: 13px;
          padding: 13px 16px 13px 42px !important;
          font-size: 14px !important;
          color: rgba(255,255,255,.92) !important;
          font-family: inherit !important;
          outline: none !important;
          box-sizing: border-box;
          box-shadow: inset 0 1px 2px rgba(0,0,0,.2) !important;
          transition: border-color .2s var(--e), background .2s var(--e), box-shadow .2s var(--e);
        }
        .gl-input-wrap input::placeholder { color: rgba(255,255,255,.18) !important; }
        .gl-input-wrap input:hover {
          border-color: rgba(255,255,255,.18) !important;
          background: rgba(255,255,255,.06) !important;
        }
        .gl-input-wrap input:focus {
          border-color: rgba(34,197,94,.6) !important;
          background: rgba(34,197,94,.04) !important;
          box-shadow: 0 0 0 4px rgba(34,197,94,.12), inset 0 1px 2px rgba(0,0,0,.2) !important;
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
          width: 100%;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #000 !important; border: none;
          border-radius: 13px; padding: 15px 20px;
          font-size: 15px; font-weight: 800;
          font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .25s var(--e);
          box-shadow: 0 4px 24px rgba(34,197,94,.28), 0 1px 2px rgba(0,0,0,.3);
          letter-spacing: -.02em;
          margin-top: 8px;
          position: relative; overflow: hidden;
        }
        .gl-cta::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 60%);
          opacity: 0; transition: opacity .25s;
          border-radius: inherit;
        }
        .gl-cta:hover:not(:disabled)::before { opacity: 1; }
        .gl-cta:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(34,197,94,.42), 0 2px 6px rgba(0,0,0,.3);
        }
        .gl-cta:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 12px rgba(34,197,94,.2); }
        .gl-cta:disabled { opacity: .22; cursor: not-allowed; box-shadow: none; transform: none; }

        /* ── Footer ── */
        .gl-foot {
          margin-top: 22px; text-align: center;
          padding-top: 18px; border-top: 1px solid rgba(255,255,255,.06);
        }
        .gl-foot__link {
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,.5) !important;
          text-decoration: underline !important;
          text-underline-offset: 3px !important;
          text-decoration-color: rgba(255,255,255,.2) !important;
          transition: color .15s, text-decoration-color .15s;
          cursor: pointer;
        }
        .gl-foot__link:hover {
          color: var(--g) !important;
          text-decoration-color: rgba(34,197,94,.5) !important;
        }

        @keyframes gl-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── SVG icons ── */
function GemSmSvg() {
  return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8 14L1 6l2-3h10l2 3-7 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M1 6h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
function PaletteSvg() {
  return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="5.5" cy="6" r="1.2" fill="currentColor"/>
    <circle cx="8"   cy="4.5" r="1.2" fill="currentColor"/>
    <circle cx="10.5" cy="6" r="1.2" fill="currentColor"/>
    <path d="M11.5 10.5c0 1-1 2-3.5 2s-4-1-4-2.5c0-.8.7-1 1.5-1h4.5c.8 0 1.5.6 1.5 1.5z" fill="currentColor" opacity=".4"/>
  </svg>;
}
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
