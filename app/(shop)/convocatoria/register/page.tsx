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

const STEPS = [
  { n: "01", label: "Crear cuenta",      sub: "Datos personales"      },
  { n: "02", label: "Pagar inscripción", sub: "$40.000 COP"           },
  { n: "03", label: "Subir obras",       sub: "Portafolio artístico"  },
  { n: "04", label: "Resolución",        sub: "Decisión del curador"  },
];

export default function ConvocatoriaRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { data: allCities = [] } = useCities();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "",
    mobile: "", documentType: "CC", documentNumber: "", instagram: "",
  });
  const [cityQuery,       setCityQuery]       = useState("");
  const [selectedCityId,  setSelectedCityId]  = useState("");
  const [cityOpen,        setCityOpen]        = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [acceptedTerms,   setAcceptedTerms]   = useState(false);

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
    if (!acceptedTerms)                               { setError("Debes aceptar los términos y condiciones"); return; }
    if (form.password !== form.confirmPassword)       { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8)                     { setError("La contraseña debe tener al menos 8 caracteres"); return; }
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
    <div className="r-root">
      <div className="r-shell">

        {/* ═══ SIDE ═══════════════════════════════════ */}
        <aside className="r-side">
          <div className="r-side__blob" aria-hidden />

          <div className="r-side__body">
            <div className="r-side__top">
              <div className="r-wordmark">
                <IcoGem /> <span>Feria del Millón</span>
              </div>
              <span className="r-badge">Convocatoria 2026</span>
            </div>

            <div className="r-hero">
              <h1 className="r-hero__h">
                Tu arte<br />
                en el<br />
                <span>millón.</span>
              </h1>
              <p className="r-hero__p">
                Postula tu proyecto, paga la inscripción y deja que el curador
                decida. 100 artistas seleccionados cada edición.
              </p>
            </div>

            <ol className="r-steps">
              {STEPS.map((s, i) => (
                <li key={s.n} className={`r-step ${i === 0 ? "r-step--on" : ""}`}>
                  <div className="r-step__n">{i === 0 ? <IcoCheck /> : s.n}</div>
                  <div className="r-step__info">
                    <span className="r-step__lbl">{s.label}</span>
                    <span className="r-step__sub">{s.sub}</span>
                  </div>
                </li>
              ))}
            </ol>

            <p className="r-already">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login?redirect=/convocatoria/aplicar">Inicia sesión</Link>
            </p>
          </div>
        </aside>

        {/* ═══ FORM ════════════════════════════════════ */}
        <section className="r-form-col">
          <div className="r-form-scroll">

            <header className="r-fhead">
              <p className="r-fhead__step">Paso 1 de 4</p>
              <h2 className="r-fhead__h">Registro de artista</h2>
              <p className="r-fhead__sub">Completa tus datos para crear la cuenta</p>
            </header>

            {error && (
              <div role="alert" className="r-err">
                <IcoAlert />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="r-form">

              {/* ── Personal ── */}
              <div className="r-group">
                <div className="r-group__hd"><IcoPerson /> Información personal</div>
                <div className="r-cols2">
                  <Field label="Nombre" req id="r-fn">
                    <input id="r-fn" type="text" value={form.firstName} onChange={set("firstName")}
                      required autoComplete="given-name" placeholder="María" />
                  </Field>
                  <Field label="Apellido" req id="r-ln">
                    <input id="r-ln" type="text" value={form.lastName} onChange={set("lastName")}
                      required autoComplete="family-name" placeholder="García" />
                  </Field>
                </div>
                <Field label="Correo electrónico" req id="r-em">
                  <input id="r-em" type="email" value={form.email} onChange={set("email")}
                    required autoComplete="email" placeholder="artista@correo.com" />
                </Field>
              </div>

              {/* ── Password ── */}
              <div className="r-group">
                <div className="r-group__hd"><IcoLock /> Contraseña</div>
                <div className="r-cols2">
                  <Field label="Contraseña" req id="r-pw">
                    <input id="r-pw" type="password" value={form.password} onChange={set("password")}
                      required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
                  </Field>
                  <Field label="Confirmar contraseña" req id="r-cpw">
                    <input id="r-cpw" type="password" value={form.confirmPassword} onChange={set("confirmPassword")}
                      required autoComplete="new-password" placeholder="Repite la contraseña" />
                  </Field>
                </div>
              </div>

              {/* ── Contact ── */}
              <div className="r-group">
                <div className="r-group__hd"><IcoPhone /> Contacto y ubicación</div>
                <div className="r-cols2">
                  <Field label="Teléfono" id="r-tel" hint="Colombia · 10 dígitos">
                    <input id="r-tel" type="tel" value={formatColPhone(form.mobile)}
                      onChange={handlePhone} autoComplete="tel" placeholder="+57 300 000 0000" />
                  </Field>
                  <Field label="Ciudad" id="r-city">
                    <div className="r-combo" ref={cityRef}>
                      <input
                        id="r-city" type="text" value={cityQuery}
                        onChange={e => { setCityQuery(e.target.value); setSelectedCityId(""); setCityOpen(true); }}
                        onFocus={() => setCityOpen(true)}
                        placeholder="Buscar ciudad…"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={cityOpen}
                        aria-autocomplete="list"
                        aria-controls="city-lb"
                      />
                      {selectedCityId && <span className="r-combo__ok" aria-hidden><IcoCheck /></span>}
                      {cityOpen && filteredCities.length > 0 && (
                        <ul id="city-lb" role="listbox" className="r-combo__drop">
                          {filteredCities.map(c => (
                            <li
                              key={c.id} role="option"
                              aria-selected={c.id === selectedCityId}
                              className={`r-combo__opt${c.id === selectedCityId ? " --sel" : ""}`}
                              onMouseDown={() => selectCity(c)}
                            >
                              {c.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              {/* ── Document ── */}
              <div className="r-group">
                <div className="r-group__hd"><IcoDoc /> Documento e Instagram</div>
                <div className="r-cols2">
                  <Field label="Tipo de documento" id="r-dt">
                    <select id="r-dt" value={form.documentType} onChange={set("documentType")}>
                      {["CC","CE","NIT","PP","INE","OTRO"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Número de documento" id="r-dn">
                    <input id="r-dn" type="text" value={form.documentNumber}
                      onChange={set("documentNumber")} placeholder="12345678" />
                  </Field>
                </div>
                <Field label="Instagram (opcional)" id="r-ig">
                  <input id="r-ig" type="text" value={form.instagram}
                    onChange={set("instagram")} placeholder="@tuusuario" />
                </Field>
              </div>

              {/* ── Terms ── */}
              <label className="r-terms" htmlFor="r-terms">
                <input id="r-terms" type="checkbox" checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)} className="r-sr" />
                <span className="r-terms__box" aria-hidden>{acceptedTerms && <IcoCheck />}</span>
                <span className="r-terms__txt">
                  Acepto el tratamiento de mis datos personales para los fines relacionados con
                  la Feria del Millón, incluyendo la publicación de mi nombre en caso de ser
                  seleccionado.
                </span>
              </label>

              <button type="submit" className="r-cta" disabled={loading || !acceptedTerms}>
                {loading
                  ? <><IcoSpin /> Creando cuenta…</>
                  : <>Crear cuenta y continuar <IcoArrow /></>
                }
              </button>

            </form>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ── TOKENS ─────────────────────────────── */
        .r-root {
          --g:      #22c55e;
          --g-dim:  rgba(34,197,94,.1);
          --g-ring: rgba(34,197,94,.22);
          --g-bd:   rgba(34,197,94,.3);
          --blk:    #000000;
          --s1:     #0a0a0a;
          --s2:     #111111;
          --s3:     #1a1a1a;
          --bd:     rgba(255,255,255,.07);
          --bd2:    rgba(255,255,255,.12);
          --tx:     rgba(255,255,255,.93);
          --tx2:    rgba(255,255,255,.5);
          --tx3:    rgba(255,255,255,.25);
          --er:     #f87171;
          --er-bg:  rgba(248,113,113,.07);
          --r:      10px;
          --e:      cubic-bezier(.16,1,.3,1);
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--blk);
          color: var(--tx);
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
        }

        /* ── SHELL ──────────────────────────────── */
        .r-shell {
          width: 100%;
          max-width: 1140px;
          display: grid;
          grid-template-columns: 380px 1fr;
          min-height: min(780px, 90vh);
          border-radius: 20px;
          border: 1px solid var(--bd2);
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,.03) inset,
            0 60px 120px rgba(0,0,0,.8);
        }
        @media (max-width: 860px) {
          .r-shell { grid-template-columns: 1fr; }
          .r-side  { display: none; }
        }

        /* ── SIDE ───────────────────────────────── */
        .r-side {
          background: var(--blk);
          border-right: 1px solid var(--bd2);
          position: relative;
          overflow: hidden;
        }
        .r-side__blob {
          position: absolute;
          bottom: -120px; left: -120px;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(34,197,94,.1) 0%, transparent 65%);
          pointer-events: none;
        }
        .r-side__body {
          position: relative;
          height: 100%;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
        }
        .r-side__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 56px;
        }
        .r-wordmark {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--tx2);
          letter-spacing: .02em;
        }
        .r-wordmark svg { color: var(--g); }
        .r-badge {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--g);
          background: var(--g-dim);
          border: 1px solid var(--g-bd);
          padding: 4px 10px;
          border-radius: 100px;
        }

        /* Hero text */
        .r-hero { flex: 1; }
        .r-hero__h {
          font-size: 52px;
          font-weight: 900;
          line-height: .95;
          letter-spacing: -3px;
          margin: 0 0 20px;
          color: rgba(255,255,255,.88);
        }
        .r-hero__h span {
          color: var(--g);
          display: block;
        }
        .r-hero__p {
          font-size: 13.5px;
          color: var(--tx2);
          line-height: 1.65;
          margin: 0 0 44px;
          max-width: 260px;
        }

        /* Steps */
        .r-steps {
          list-style: none;
          padding: 0;
          margin: 0 0 36px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .r-step {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 12px;
          border-radius: 8px;
          transition: background .15s;
        }
        .r-step--on { background: var(--g-dim); }
        .r-step__n {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1px solid var(--bd2);
          background: var(--s2);
          font-size: 11px;
          font-weight: 800;
          color: var(--tx3);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
          letter-spacing: .02em;
          transition: all .2s var(--e);
        }
        .r-step--on .r-step__n {
          background: var(--g);
          border-color: var(--g);
          color: #000;
        }
        .r-step__info { display: flex; flex-direction: column; gap: 2px; }
        .r-step__lbl {
          font-size: 13px; font-weight: 600;
          color: var(--tx3);
          transition: color .15s;
        }
        .r-step--on .r-step__lbl { color: var(--tx); }
        .r-step__sub { font-size: 11.5px; color: var(--tx3); }
        .r-step--on .r-step__sub { color: rgba(34,197,94,.6); }

        .r-already {
          font-size: 12.5px;
          color: var(--tx3);
          margin: 0;
        }
        .r-already a { color: var(--g); font-weight: 600; text-decoration: none; }
        .r-already a:hover { text-decoration: underline; }

        /* ── FORM COL ───────────────────────────── */
        .r-form-col {
          background: var(--s1);
          overflow-y: auto;
        }
        .r-form-scroll {
          padding: 52px 48px;
          max-width: 600px;
        }
        @media (max-width: 560px) { .r-form-scroll { padding: 28px 20px; } }

        /* Header */
        .r-fhead { margin-bottom: 32px; }
        .r-fhead__step {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--g);
          margin: 0 0 8px;
        }
        .r-fhead__h {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -.8px;
          color: var(--tx);
          margin: 0 0 6px;
        }
        .r-fhead__sub {
          font-size: 13.5px;
          color: var(--tx2);
          margin: 0;
        }

        /* Error */
        .r-err {
          display: flex; align-items: flex-start; gap: 10px;
          background: var(--er-bg);
          border: 1px solid rgba(248,113,113,.2);
          border-radius: var(--r);
          padding: 12px 16px;
          color: var(--er);
          font-size: 13.5px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .r-err svg { flex-shrink: 0; margin-top: 2px; }

        /* Form */
        .r-form { display: flex; flex-direction: column; gap: 0; }

        /* Group */
        .r-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
        }
        .r-group__hd {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--tx3);
          padding-bottom: 12px;
          border-bottom: 1px solid var(--bd);
        }
        .r-group__hd svg { opacity: .45; }

        /* Cols */
        .r-cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 520px) { .r-cols2 { grid-template-columns: 1fr; } }

        /* Inputs (global via cascade from .r-form) */
        .r-form input[type=text],
        .r-form input[type=email],
        .r-form input[type=password],
        .r-form input[type=tel],
        .r-form select {
          width: 100%;
          background: var(--s2);
          border: 1.5px solid var(--bd2);
          border-radius: var(--r);
          padding: 11px 14px;
          font-size: 14px;
          color: var(--tx);
          font-family: inherit;
          outline: none;
          transition: border-color .18s var(--e), background .18s var(--e), box-shadow .18s var(--e);
          -webkit-appearance: none;
          appearance: none;
          box-sizing: border-box;
        }
        .r-form input::placeholder { color: var(--tx3); }
        .r-form input:hover,
        .r-form select:hover {
          border-color: rgba(255,255,255,.2);
          background: var(--s3);
        }
        .r-form input:focus,
        .r-form select:focus {
          border-color: var(--g);
          background: var(--s3);
          box-shadow: 0 0 0 3px var(--g-ring);
        }
        .r-form select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
          cursor: pointer;
        }
        .r-form select option { background: #1a1a1a; }

        /* Combo */
        .r-combo { position: relative; }
        .r-combo__ok {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--g);
          display: flex;
          pointer-events: none;
        }
        .r-combo__drop {
          position: absolute;
          top: calc(100% + 5px);
          left: 0; right: 0;
          background: #111;
          border: 1.5px solid var(--bd2);
          border-radius: var(--r);
          list-style: none;
          margin: 0; padding: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 60;
          box-shadow: 0 20px 48px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.03) inset;
        }
        .r-combo__drop::-webkit-scrollbar { width: 3px; }
        .r-combo__drop::-webkit-scrollbar-thumb { background: rgba(255,255,255,.09); border-radius: 3px; }
        .r-combo__opt {
          padding: 9px 12px;
          font-size: 13.5px;
          color: var(--tx2);
          border-radius: 6px;
          cursor: pointer;
          transition: background .1s, color .1s;
        }
        .r-combo__opt:hover { background: rgba(255,255,255,.05); color: var(--tx); }
        .r-combo__opt.--sel { background: var(--g-dim); color: var(--g); font-weight: 600; }

        /* Terms */
        .r-sr { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
        .r-terms {
          display: flex; align-items: flex-start; gap: 12px;
          cursor: pointer;
          background: var(--s2);
          border: 1.5px solid var(--bd2);
          border-radius: var(--r);
          padding: 14px 16px;
          margin-bottom: 24px;
          transition: border-color .15s var(--e), background .15s var(--e);
        }
        .r-terms:hover { border-color: rgba(255,255,255,.18); }
        .r-terms:has(.r-sr:checked) { border-color: var(--g-bd); background: var(--g-dim); }
        .r-terms__box {
          width: 20px; height: 20px; min-width: 20px;
          border-radius: 5px;
          border: 2px solid var(--bd2);
          background: var(--s3);
          display: flex; align-items: center; justify-content: center;
          transition: all .15s var(--e);
          margin-top: 1px;
        }
        .r-terms:has(.r-sr:checked) .r-terms__box { background: var(--g); border-color: var(--g); color: #000; }
        .r-terms__txt { font-size: 12.5px; color: var(--tx2); line-height: 1.55; }

        /* CTA */
        .r-cta {
          width: 100%;
          background: var(--g);
          color: #000;
          border: none;
          border-radius: var(--r);
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          letter-spacing: -.2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background .2s var(--e), transform .2s var(--e), box-shadow .2s var(--e);
          box-shadow: 0 4px 24px rgba(34,197,94,.25);
        }
        .r-cta:hover:not(:disabled) {
          background: #4ade80;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(34,197,94,.4);
        }
        .r-cta:active:not(:disabled) { transform: translateY(0); }
        .r-cta:disabled { opacity: .3; cursor: not-allowed; box-shadow: none; }

        /* Spinner */
        @keyframes r-spin { to { transform: rotate(360deg); } }
        .r-spin { animation: r-spin .7s linear infinite; display: flex; }
      `}</style>
    </div>
    </LoggedInArtistGate>
  );
}

/* ── Field wrapper ────────────────────────────── */
function Field({
  label, id, req, hint, children,
}: {
  label: string; id: string; req?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,.55)" }}>
        {label}{req && <em style={{ fontStyle: "normal", color: "#22c55e", marginLeft: 2 }}>*</em>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: -2 }}>{hint}</span>}
    </div>
  );
}

/* ── SVG icons ────────────────────────────────── */
function IcoCheck() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function IcoArrow() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function IcoAlert() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function IcoSpin() {
  return <span className="r-spin">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity=".2"/>
      <path d="M14 8a6 6 0 01-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </span>;
}
function IcoPerson() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function IcoLock() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function IcoPhone() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M5 1h6a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="12.5" r=".75" fill="currentColor"/>
  </svg>;
}
function IcoDoc() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function IcoGem() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8 14L1 6l2-3h10l2 3-7 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M1 6h14M5 3l3 11M11 3l-3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
}
