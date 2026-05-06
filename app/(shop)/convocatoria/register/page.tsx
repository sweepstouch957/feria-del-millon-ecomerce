"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@services/auth.service";
import { useAuth } from "@provider/authProvider";
import { useCities } from "@hooks/queries/useCities";
import type { CityDoc } from "@services/city.service";
import { LoggedInArtistGate } from "@components/views/convocatoria/LoggedInArtistGate";

function formatColPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 3) return `+57 ${digits}`;
  if (digits.length <= 6) return `+57 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+57 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export default function ConvocatoriaRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { data: allCities = [] } = useCities();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "",
    mobile: "", documentType: "CC", documentNumber: "", instagram: "",
  });
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);

  const filteredCities = allCities
    .filter(c => c.active)
    .filter(c => !cityQuery || c.name.toLowerCase().includes(cityQuery.toLowerCase()))
    .slice(0, 14);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectCity = (c: CityDoc) => { setCityQuery(c.name); setSelectedCityId(c.id); setCityOpen(false); };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/^\+57\s?/, "").replace(/\D/g, "").slice(0, 10);
    setForm(f => ({ ...f, mobile: d }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!acceptedTerms)                          { setError("Debes aceptar los términos y condiciones"); return; }
    if (form.password !== form.confirmPassword)  { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8)                { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setLoading(true);
    try {
      await register({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        mobile:         form.mobile        ? `+57${form.mobile}` : undefined,
        city:           cityQuery          || undefined,
        cityId:         selectedCityId     || undefined,
        documentType:   form.documentType,
        documentNumber: form.documentNumber || undefined,
        instagram:      form.instagram     || undefined,
        roles: { artista: true },
      });
      await login(form.email, form.password);
      router.push("/convocatoria/aplicar");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      if (err?.message?.includes("login")) {
        router.push("/login?role=artist&redirect=/convocatoria/aplicar&msg=cuenta_creada");
      } else {
        setError(err?.response?.data?.error || err?.message || "Error al registrarse");
      }
    } finally { setLoading(false); }
  };

  return (
    <LoggedInArtistGate>
    <div className="cr-root">
      {/* Background effects */}
      <div className="cr-glow cr-glow--1" />
      <div className="cr-glow cr-glow--2" />

      <div className="cr-container">
        {/* Card */}
        <div className="cr-card">
          {/* Header */}
          <div className="cr-header">
            <div className="cr-logo">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 14L1 6l2-3h10l2 3-7 8z" stroke="#22c55e" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M1 6h14M5 3l3 11M11 3l-3 11" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>Feria del Millón</span>
            </div>
            <span className="cr-badge">Convocatoria 2026</span>
          </div>

          <h1 className="cr-title">Registro de artista</h1>
          <p className="cr-subtitle">Crea tu cuenta, paga la inscripción y postula tu proyecto artístico</p>

          {error && (
            <div className="cr-error">
              <div className="cr-error__dot" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="cr-form">
            {/* Name row */}
            <div className="cr-row">
              <div className="cr-field">
                <label htmlFor="cr-fn">Nombre *</label>
                <input id="cr-fn" type="text" value={form.firstName} onChange={set("firstName")}
                  required autoComplete="given-name" placeholder="María" />
              </div>
              <div className="cr-field">
                <label htmlFor="cr-ln">Apellido *</label>
                <input id="cr-ln" type="text" value={form.lastName} onChange={set("lastName")}
                  required autoComplete="family-name" placeholder="García" />
              </div>
            </div>

            {/* Email */}
            <div className="cr-field">
              <label htmlFor="cr-em">Correo electrónico *</label>
              <input id="cr-em" type="email" value={form.email} onChange={set("email")}
                required autoComplete="email" placeholder="artista@correo.com" />
            </div>

            {/* Password row */}
            <div className="cr-row">
              <div className="cr-field">
                <label htmlFor="cr-pw">Contraseña *</label>
                <div className="cr-pwd-wrap">
                  <input id="cr-pw" type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")}
                    required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
                  <button type="button" className="cr-pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>
              <div className="cr-field">
                <label htmlFor="cr-cpw">Confirmar *</label>
                <input id="cr-cpw" type="password" value={form.confirmPassword} onChange={set("confirmPassword")}
                  required autoComplete="new-password" placeholder="Repite contraseña" />
              </div>
            </div>

            {/* Phone + City row */}
            <div className="cr-row">
              <div className="cr-field">
                <label htmlFor="cr-tel">Teléfono</label>
                <input id="cr-tel" type="tel" value={formatColPhone(form.mobile)}
                  onChange={handlePhone} autoComplete="tel" placeholder="+57 300 000 0000" />
              </div>
              <div className="cr-field">
                <label htmlFor="cr-city">Ciudad</label>
                <div className="cr-combo" ref={cityRef}>
                  <input id="cr-city" type="text" value={cityQuery}
                    onChange={e => { setCityQuery(e.target.value); setSelectedCityId(""); setCityOpen(true); }}
                    onFocus={() => setCityOpen(true)}
                    placeholder="Buscar ciudad…" autoComplete="off" />
                  {selectedCityId && <span className="cr-combo__ok">✓</span>}
                  {cityOpen && filteredCities.length > 0 && (
                    <ul className="cr-combo__drop">
                      {filteredCities.map(c => (
                        <li key={c.id}
                          className={`cr-combo__opt${c.id === selectedCityId ? " --sel" : ""}`}
                          onMouseDown={() => selectCity(c)}>{c.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Doc + Instagram row */}
            <div className="cr-row cr-row--3">
              <div className="cr-field">
                <label htmlFor="cr-dt">Tipo doc.</label>
                <select id="cr-dt" value={form.documentType} onChange={set("documentType")}>
                  {["CC","CE","NIT","PP","INE","OTRO"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="cr-field">
                <label htmlFor="cr-dn">Nro. documento</label>
                <input id="cr-dn" type="text" value={form.documentNumber}
                  onChange={set("documentNumber")} placeholder="12345678" />
              </div>
              <div className="cr-field">
                <label htmlFor="cr-ig">Instagram</label>
                <input id="cr-ig" type="text" value={form.instagram}
                  onChange={set("instagram")} placeholder="@usuario" />
              </div>
            </div>

            {/* Terms */}
            <label className="cr-terms" htmlFor="cr-terms">
              <input id="cr-terms" type="checkbox" checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)} className="cr-sr" />
              <span className="cr-terms__box">{acceptedTerms && <CheckSvg />}</span>
              <span className="cr-terms__txt">
                Acepto el tratamiento de mis datos personales para los fines relacionados con
                la Feria del Millón.
              </span>
            </label>

            {/* Submit */}
            <button type="submit" className="cr-cta" disabled={loading || !acceptedTerms}>
              {loading
                ? <><SpinSvg /> Creando cuenta…</>
                : <>Crear cuenta y continuar <ArrowSvg /></>
              }
            </button>
          </form>

          {/* Footer */}
          <div className="cr-footer">
            <p>
              ¿Ya tienes cuenta?{" "}
              <Link href="/login?role=artist&redirect=/convocatoria/aplicar">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Side info — Steps timeline (desktop only) */}
        <div className="cr-side">
          <h2 className="cr-side__title">¿Cómo funciona?</h2>
          <div className="cr-timeline">
            {[
              { n: "01", label: "Crea tu cuenta", desc: "Datos personales", active: true },
              { n: "02", label: "Paga inscripción", desc: "$40,000 COP" },
              { n: "03", label: "Sube tus obras", desc: "Portafolio artístico" },
              { n: "04", label: "Resolución", desc: "Decisión del curador" },
            ].map((s, i) => (
              <div key={i} className={`cr-tl-item ${s.active ? "cr-tl-item--on" : ""}`}>
                <div className="cr-tl-item__n">{s.active ? <CheckSvg /> : s.n}</div>
                <div className="cr-tl-item__line" />
                <div>
                  <span className="cr-tl-item__label">{s.label}</span>
                  <span className="cr-tl-item__sub">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="cr-side__stat">
            <span className="cr-side__stat-num">500+</span>
            <span>Artistas participantes</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cr-root {
          --g: #22c55e; --g-dim: rgba(34,197,94,.08); --g-ring: rgba(34,197,94,.2);
          --s1: #0a0a0a; --s2: #111; --bd: rgba(255,255,255,.08); --bd2: rgba(255,255,255,.12);
          --tx: rgba(255,255,255,.93); --tx2: rgba(255,255,255,.5); --tx3: rgba(255,255,255,.25);
          font-family: 'Inter', system-ui, sans-serif;
          background: #000; color: var(--tx);
          min-height: calc(100vh - 64px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px; position: relative; overflow: hidden;
        }
        .cr-glow { position: absolute; border-radius: 50%; filter: blur(140px); opacity: .08; pointer-events: none; }
        .cr-glow--1 { width: 500px; height: 500px; top: -120px; right: -80px; background: var(--g); }
        .cr-glow--2 { width: 400px; height: 400px; bottom: -120px; left: -80px; background: #4ade80; }

        .cr-container {
          display: grid; grid-template-columns: 1fr 260px;
          max-width: 880px; width: 100%; gap: 0;
          border-radius: 24px; border: 1px solid var(--bd2); overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,.03) inset, 0 40px 100px rgba(0,0,0,.7);
          animation: cr-in .5s cubic-bezier(.16,1,.3,1);
          position: relative; z-index: 1;
        }
        @keyframes cr-in { from{opacity:0;transform:translateY(16px) scale(.98)} to{opacity:1;transform:none} }
        @media (max-width: 800px) {
          .cr-container { grid-template-columns: 1fr; }
          .cr-side { display: none; }
        }

        /* Card */
        .cr-card { background: var(--s1); padding: 32px 36px 24px; }
        @media (max-width: 560px) { .cr-card { padding: 24px 18px 20px; } }

        .cr-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .cr-logo { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--tx2); }
        .cr-badge {
          font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--g); background: var(--g-dim); border: 1px solid var(--g-ring);
          padding: 3px 10px; border-radius: 100px;
        }
        .cr-title { font-size: 24px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 4px; }
        .cr-subtitle { font-size: 13px; color: var(--tx2); margin: 0 0 20px; line-height: 1.5; }

        /* Error */
        .cr-error {
          display: flex; align-items: center; gap: 10px;
          background: rgba(248,113,113,.06); border: 1px solid rgba(248,113,113,.2);
          border-radius: 10px; padding: 10px 14px; color: #f87171;
          font-size: 13px; margin-bottom: 16px;
        }
        .cr-error__dot { width: 6px; height: 6px; border-radius: 50%; background: #f87171; flex-shrink: 0; }

        /* Form */
        .cr-form { display: flex; flex-direction: column; gap: 14px; }
        .cr-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cr-row--3 { grid-template-columns: 100px 1fr 1fr; }
        @media (max-width: 520px) { .cr-row, .cr-row--3 { grid-template-columns: 1fr; } }

        .cr-field { display: flex; flex-direction: column; gap: 4px; }
        .cr-field label { font-size: 11.5px; font-weight: 600; color: var(--tx3); }

        .cr-form input[type=text], .cr-form input[type=email],
        .cr-form input[type=password], .cr-form input[type=tel], .cr-form select {
          width: 100%; background: var(--s2); border: 1.5px solid var(--bd2);
          border-radius: 10px; padding: 10px 12px; font-size: 13.5px;
          color: var(--tx); font-family: inherit; outline: none;
          transition: border-color .15s, background .15s, box-shadow .15s;
          box-sizing: border-box; -webkit-appearance: none; appearance: none;
        }
        .cr-form input::placeholder { color: var(--tx3); }
        .cr-form input:hover, .cr-form select:hover { border-color: rgba(255,255,255,.2); background: #151515; }
        .cr-form input:focus, .cr-form select:focus {
          border-color: var(--g); background: #151515; box-shadow: 0 0 0 3px var(--g-ring);
        }
        .cr-form select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer;
        }
        .cr-form select option { background: #1a1a1a; }

        /* Password toggle */
        .cr-pwd-wrap { position: relative; }
        .cr-pwd-wrap input { padding-right: 54px; }
        .cr-pwd-toggle {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          font-size: 11px; font-weight: 700; color: var(--tx3);
          background: rgba(255,255,255,.05); border: 1px solid var(--bd);
          padding: 3px 8px; border-radius: 6px; cursor: pointer;
          transition: color .15s, border-color .15s;
        }
        .cr-pwd-toggle:hover { color: #fff; border-color: rgba(255,255,255,.2); }

        /* Combo */
        .cr-combo { position: relative; }
        .cr-combo__ok { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--g); font-size: 14px; pointer-events: none; }
        .cr-combo__drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #111; border: 1.5px solid var(--bd2); border-radius: 10px;
          list-style: none; margin: 0; padding: 4px; max-height: 180px; overflow-y: auto;
          z-index: 60; box-shadow: 0 16px 40px rgba(0,0,0,.7);
        }
        .cr-combo__drop::-webkit-scrollbar { width: 3px; }
        .cr-combo__drop::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }
        .cr-combo__opt {
          padding: 8px 10px; font-size: 13px; color: var(--tx2);
          border-radius: 6px; cursor: pointer; transition: all .1s;
        }
        .cr-combo__opt:hover { background: rgba(255,255,255,.05); color: var(--tx); }
        .cr-combo__opt.--sel { background: var(--g-dim); color: var(--g); font-weight: 600; }

        /* Terms */
        .cr-sr { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
        .cr-terms {
          display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
          background: var(--s2); border: 1.5px solid var(--bd2); border-radius: 10px;
          padding: 12px 14px; transition: border-color .15s, background .15s;
        }
        .cr-terms:hover { border-color: rgba(255,255,255,.18); }
        .cr-terms:has(.cr-sr:checked) { border-color: var(--g-ring); background: var(--g-dim); }
        .cr-terms__box {
          width: 18px; height: 18px; min-width: 18px; border-radius: 5px;
          border: 2px solid var(--bd2); background: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s; margin-top: 1px;
        }
        .cr-terms:has(.cr-sr:checked) .cr-terms__box { background: var(--g); border-color: var(--g); color: #000; }
        .cr-terms__txt { font-size: 11.5px; color: var(--tx2); line-height: 1.5; }

        /* CTA */
        .cr-cta {
          width: 100%; background: var(--g); color: #000; border: none;
          border-radius: 12px; padding: 13px 20px; font-size: 14px; font-weight: 700;
          font-family: inherit; cursor: pointer; display: flex;
          align-items: center; justify-content: center; gap: 8px;
          transition: all .2s; box-shadow: 0 4px 20px rgba(34,197,94,.2);
          margin-top: 4px;
        }
        .cr-cta:hover:not(:disabled) { background: #4ade80; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(34,197,94,.35); }
        .cr-cta:disabled { opacity: .3; cursor: not-allowed; box-shadow: none; }

        /* Footer */
        .cr-footer {
          text-align: center; padding-top: 16px; margin-top: 8px;
          border-top: 1px solid var(--bd);
        }
        .cr-footer p { font-size: 13px; color: var(--tx3); margin: 0; }
        .cr-footer a { color: var(--g); font-weight: 700; text-decoration: none; }
        .cr-footer a:hover { text-decoration: underline; }

        /* Side panel */
        .cr-side {
          background: #000; border-left: 1px solid var(--bd2);
          padding: 36px 24px; display: flex; flex-direction: column;
        }
        .cr-side__title {
          font-size: 14px; font-weight: 800; color: var(--tx2);
          letter-spacing: -.3px; margin: 0 0 24px;
        }

        /* Timeline */
        .cr-timeline { flex: 1; display: flex; flex-direction: column; gap: 0; }
        .cr-tl-item { display: flex; align-items: flex-start; gap: 12px; position: relative; padding-bottom: 20px; }
        .cr-tl-item__n {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          border: 1.5px solid var(--bd2); background: var(--s2);
          font-size: 10px; font-weight: 800; color: var(--tx3);
          display: flex; align-items: center; justify-content: center;
        }
        .cr-tl-item--on .cr-tl-item__n { background: var(--g); border-color: var(--g); color: #000; }
        .cr-tl-item__line {
          position: absolute; left: 13px; top: 30px; bottom: 0; width: 1.5px;
          background: var(--bd); pointer-events: none;
        }
        .cr-tl-item:last-child .cr-tl-item__line { display: none; }
        .cr-tl-item__label { display: block; font-size: 12.5px; font-weight: 600; color: var(--tx3); }
        .cr-tl-item--on .cr-tl-item__label { color: var(--tx); }
        .cr-tl-item__sub { font-size: 11px; color: var(--tx3); }
        .cr-tl-item--on .cr-tl-item__sub { color: rgba(34,197,94,.6); }

        .cr-side__stat {
          margin-top: auto; padding-top: 20px; border-top: 1px solid var(--bd);
          display: flex; flex-direction: column; gap: 2px;
          font-size: 11px; color: var(--tx3);
        }
        .cr-side__stat-num { font-size: 28px; font-weight: 900; color: var(--tx); line-height: 1; }

        @keyframes cr-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
    </LoggedInArtistGate>
  );
}

/* ── SVG Icons ─────────────── */
function CheckSvg() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function ArrowSvg() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function SpinSvg() {
  return <span style={{ animation: "cr-spin .7s linear infinite", display: "flex" }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity=".2"/>
      <path d="M14 8a6 6 0 01-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </span>;
}
