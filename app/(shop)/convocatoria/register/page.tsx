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
  const [cityQuery,      setCityQuery]      = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [cityOpen,       setCityOpen]       = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [acceptedTerms,  setAcceptedTerms]  = useState(false);
  const [showPwd,        setShowPwd]        = useState(false);

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
    if (!acceptedTerms)                         { setError("Debes aceptar los términos y condiciones"); return; }
    if (form.password !== form.confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8)               { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setLoading(true);
    try {
      await register({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        mobile:         form.mobile         ? `+57${form.mobile}` : undefined,
        city:           cityQuery           || undefined,
        cityId:         selectedCityId      || undefined,
        documentType:   form.documentType,
        documentNumber: form.documentNumber || undefined,
        instagram:      form.instagram      || undefined,
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
      <div className="cr-glow cr-glow--1" aria-hidden />
      <div className="cr-glow cr-glow--2" aria-hidden />

      <div className="cr-shell">

        {/* ══ LEFT — Branding ══════════════════════════ */}
        <aside className="cr-side">
          <div className="cr-side__top">
            <div className="cr-wordmark">
              <GemSvg />
              <span>Feria del Millón</span>
            </div>
            <span className="cr-badge">Convocatoria 2026</span>
          </div>

          <div className="cr-hero">
            <h1 className="cr-hero__h">
              Postula<br />
              tu arte<br />
              <span className="cr-hero__accent">al millón.</span>
            </h1>
            <p className="cr-hero__p">
              Únete a la convocatoria más grande del arte colombiano.
              Crea tu cuenta, paga la inscripción y deja que el curador elija tu obra.
            </p>
          </div>

          <ol className="cr-timeline">
            {([
              { n:"01", lbl:"Crea tu cuenta",   sub:"Datos personales",     on: true  },
              { n:"02", lbl:"Paga inscripción",  sub:"$40,000 COP",         on: false },
              { n:"03", lbl:"Sube tus obras",    sub:"Portafolio artístico", on: false },
              { n:"04", lbl:"Resolución",        sub:"Decisión del curador", on: false },
            ] as const).map((s, i, arr) => (
              <li key={s.n} className={`cr-tl${s.on ? " cr-tl--on" : ""}`}>
                <div className="cr-tl__dot">
                  {s.on ? <CheckSvg /> : <span>{s.n}</span>}
                </div>
                {i < arr.length - 1 && <div className="cr-tl__line" aria-hidden />}
                <div className="cr-tl__text">
                  <span className="cr-tl__lbl">{s.lbl}</span>
                  <span className="cr-tl__sub">{s.sub}</span>
                </div>
              </li>
            ))}
          </ol>

          <div className="cr-stats">
            <div className="cr-stat">
              <span className="cr-stat__n">500+</span>
              <span className="cr-stat__l">Artistas participantes</span>
            </div>
            <div className="cr-stat__div" aria-hidden />
            <div className="cr-stat">
              <span className="cr-stat__n">4</span>
              <span className="cr-stat__l">Pasos al curador</span>
            </div>
          </div>
        </aside>

        {/* ══ RIGHT — Form ═════════════════════════════ */}
        <section className="cr-form-col">
          <div className="cr-form-wrap">

            <header className="cr-fhead">
              <p className="cr-fhead__step">Paso 1 de 4</p>
              <h2 className="cr-fhead__h">Registro de artista</h2>
              <p className="cr-fhead__sub">Completa tus datos para crear la cuenta</p>
            </header>

            {error && (
              <div role="alert" className="cr-error">
                <div className="cr-error__dot" aria-hidden />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="cr-form">

              {/* ── Personal ── */}
              <div className="cr-section">
                <p className="cr-section__lbl">Información personal</p>
                <div className="cr-row">
                  <Fld label="Nombre" req htmlFor="cr-fn">
                    <input id="cr-fn" type="text" value={form.firstName} onChange={set("firstName")}
                      required autoComplete="given-name" placeholder="María" />
                  </Fld>
                  <Fld label="Apellido" req htmlFor="cr-ln">
                    <input id="cr-ln" type="text" value={form.lastName} onChange={set("lastName")}
                      required autoComplete="family-name" placeholder="García" />
                  </Fld>
                </div>
                <Fld label="Correo electrónico" req htmlFor="cr-em">
                  <input id="cr-em" type="email" value={form.email} onChange={set("email")}
                    required autoComplete="email" placeholder="artista@correo.com" />
                </Fld>
              </div>

              {/* ── Contraseña ── */}
              <div className="cr-section">
                <p className="cr-section__lbl">Contraseña</p>
                <div className="cr-row">
                  <Fld label="Contraseña" req htmlFor="cr-pw">
                    <div className="cr-pw-wrap">
                      <input id="cr-pw" type={showPwd ? "text" : "password"} value={form.password}
                        onChange={set("password")} required minLength={8}
                        autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
                      <button type="button" className="cr-pw-btn" onClick={() => setShowPwd(v => !v)}>
                        {showPwd ? "Ocultar" : "Ver"}
                      </button>
                    </div>
                  </Fld>
                  <Fld label="Confirmar contraseña" req htmlFor="cr-cpw">
                    <input id="cr-cpw" type="password" value={form.confirmPassword}
                      onChange={set("confirmPassword")} required
                      autoComplete="new-password" placeholder="Repite la contraseña" />
                  </Fld>
                </div>
              </div>

              {/* ── Contacto ── */}
              <div className="cr-section">
                <p className="cr-section__lbl">Contacto y ubicación</p>
                <div className="cr-row">
                  <Fld label="Teléfono" htmlFor="cr-tel" hint="Colombia · 10 dígitos">
                    <input id="cr-tel" type="tel" value={formatColPhone(form.mobile)}
                      onChange={handlePhone} autoComplete="tel" placeholder="+57 300 000 0000" />
                  </Fld>
                  <Fld label="Ciudad" htmlFor="cr-city">
                    <div className="cr-combo" ref={cityRef}>
                      <input id="cr-city" type="text" value={cityQuery}
                        onChange={e => { setCityQuery(e.target.value); setSelectedCityId(""); setCityOpen(true); }}
                        onFocus={() => setCityOpen(true)}
                        placeholder="Buscar ciudad…" autoComplete="off"
                        role="combobox" aria-expanded={cityOpen} aria-autocomplete="list" aria-controls="cr-city-lb" />
                      {selectedCityId && <span className="cr-combo__ok" aria-hidden><CheckSvg /></span>}
                      {cityOpen && filteredCities.length > 0 && (
                        <ul id="cr-city-lb" role="listbox" className="cr-combo__drop">
                          {filteredCities.map(c => (
                            <li key={c.id} role="option" aria-selected={c.id === selectedCityId}
                              className={`cr-combo__opt${c.id === selectedCityId ? " --sel" : ""}`}
                              onMouseDown={() => selectCity(c)}>{c.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Fld>
                </div>
              </div>

              {/* ── Documento ── */}
              <div className="cr-section">
                <p className="cr-section__lbl">Documento e Instagram</p>
                <div className="cr-row cr-row--3">
                  <Fld label="Tipo doc." htmlFor="cr-dt">
                    <select id="cr-dt" value={form.documentType} onChange={set("documentType")}>
                      {["CC","CE","NIT","PP","INE","OTRO"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Fld>
                  <Fld label="Nro. documento" htmlFor="cr-dn">
                    <input id="cr-dn" type="text" value={form.documentNumber}
                      onChange={set("documentNumber")} placeholder="12345678" />
                  </Fld>
                  <Fld label="Instagram" htmlFor="cr-ig">
                    <input id="cr-ig" type="text" value={form.instagram}
                      onChange={set("instagram")} placeholder="@usuario" />
                  </Fld>
                </div>
              </div>

              {/* ── Términos ── */}
              <label className="cr-terms" htmlFor="cr-terms">
                <input id="cr-terms" type="checkbox" checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)} className="cr-sr" />
                <span className="cr-terms__box" aria-hidden>{acceptedTerms && <CheckSvg />}</span>
                <span className="cr-terms__txt">
                  Acepto el tratamiento de mis datos personales para los fines relacionados
                  con la Feria del Millón, incluyendo la publicación de mi nombre en caso
                  de ser seleccionado.
                </span>
              </label>

              <button type="submit" className="cr-cta" disabled={loading || !acceptedTerms}>
                {loading
                  ? <><SpinSvg /> Creando cuenta…</>
                  : <>Crear cuenta y continuar <ArrowSvg /></>
                }
              </button>

            </form>

            <div className="cr-foot">
              <p>
                ¿Ya tienes cuenta?{" "}
                <Link href="/login?role=artist&redirect=/convocatoria/aplicar">Inicia sesión</Link>
              </p>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ── Tokens ── */
        .cr-root {
          --g:      #22c55e;
          --g-dim:  rgba(34,197,94,.09);
          --g-ring: rgba(34,197,94,.2);
          --g-bd:   rgba(34,197,94,.32);
          --blk:    #000;
          --s1:     #0a0a0a;
          --s2:     #111;
          --s3:     #181818;
          --bd:     rgba(255,255,255,.08);
          --bd2:    rgba(255,255,255,.14);
          --tx:     rgba(255,255,255,.93);
          --tx2:    rgba(255,255,255,.62);
          --tx3:    rgba(255,255,255,.35);
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

        /* Glow blobs */
        .cr-glow {
          position: absolute; border-radius: 50%;
          filter: blur(160px); opacity: .07; pointer-events: none;
        }
        .cr-glow--1 { width: 480px; height: 480px; top: -140px; left: -80px;  background: var(--g); }
        .cr-glow--2 { width: 360px; height: 360px; bottom: -120px; right: -60px; background: #4ade80; }

        /* ── Shell ── */
        .cr-shell {
          position: relative; z-index: 1;
          width: 100%; max-width: 1000px;
          display: grid;
          grid-template-columns: 340px 1fr;
          min-height: 680px;
          border-radius: 22px;
          border: 1px solid var(--bd2);
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,.03) inset, 0 48px 96px rgba(0,0,0,.75);
          animation: cr-in .5s var(--e) both;
        }
        @keyframes cr-in { from{opacity:0;transform:translateY(18px) scale(.98)} to{opacity:1;transform:none} }
        @media (max-width: 820px) {
          .cr-shell { grid-template-columns: 1fr; }
          .cr-side  { display: none; }
        }

        /* ══ LEFT SIDE ═════════════════════════════════ */
        .cr-side {
          background: var(--blk);
          border-right: 1px solid var(--bd2);
          padding: 44px 36px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .cr-side::before {
          content: '';
          position: absolute;
          bottom: -60px; left: -60px;
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(34,197,94,.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .cr-side__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 48px;
        }
        .cr-wordmark {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: var(--tx3);
          letter-spacing: .01em;
        }
        .cr-wordmark svg { color: var(--g); }
        .cr-badge {
          font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--g); background: var(--g-dim); border: 1px solid var(--g-bd);
          padding: 4px 10px; border-radius: 100px;
        }

        /* Hero */
        .cr-hero { flex: 1; }
        .cr-hero__h {
          font-size: 48px; font-weight: 900;
          line-height: .92; letter-spacing: -3px;
          margin: 0 0 18px;
          color: rgba(255,255,255,.88);
        }
        .cr-hero__accent { color: var(--g); display: block; }
        .cr-hero__p {
          font-size: 13px; color: var(--tx3); line-height: 1.7;
          margin: 0 0 40px; max-width: 240px;
        }

        /* Timeline */
        .cr-timeline { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 0; }
        .cr-tl {
          display: flex; align-items: flex-start; gap: 12px;
          position: relative; padding-bottom: 18px;
        }
        .cr-tl__dot {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          border: 1.5px solid var(--bd2); background: var(--s2);
          font-size: 10px; font-weight: 800; color: var(--tx3);
          display: flex; align-items: center; justify-content: center;
          transition: all .2s var(--e);
        }
        .cr-tl--on .cr-tl__dot { background: var(--g); border-color: var(--g); color: #000; }
        .cr-tl__line {
          position: absolute; left: 14px; top: 32px; bottom: 0;
          width: 1.5px; background: var(--bd); pointer-events: none;
        }
        .cr-tl__text { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
        .cr-tl__lbl { font-size: 13px; font-weight: 600; color: var(--tx3); transition: color .15s; }
        .cr-tl--on .cr-tl__lbl { color: var(--tx); }
        .cr-tl__sub { font-size: 11.5px; color: var(--tx3); }
        .cr-tl--on .cr-tl__sub { color: rgba(34,197,94,.6); }

        /* Stats */
        .cr-stats {
          display: flex; align-items: center; gap: 20px;
          padding-top: 20px; border-top: 1px solid var(--bd);
          margin-top: auto;
        }
        .cr-stat { display: flex; flex-direction: column; gap: 2px; }
        .cr-stat__n { font-size: 28px; font-weight: 900; color: var(--tx); line-height: 1; letter-spacing: -1px; }
        .cr-stat__l { font-size: 11px; color: var(--tx3); }
        .cr-stat__div { width: 1px; height: 36px; background: var(--bd2); flex-shrink: 0; }

        /* ══ RIGHT FORM ════════════════════════════════ */
        .cr-form-col { background: var(--s1); overflow-y: auto; }
        .cr-form-wrap { padding: 40px 40px 32px; max-width: 600px; }
        @media (max-width: 560px) { .cr-form-wrap { padding: 28px 20px; } }

        .cr-fhead { margin-bottom: 28px; }
        .cr-fhead__step {
          font-size: 10.5px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--g); margin: 0 0 6px;
        }
        .cr-fhead__h { font-size: 22px; font-weight: 900; letter-spacing: -.6px; margin: 0 0 4px; }
        .cr-fhead__sub { font-size: 13px; color: var(--tx2); margin: 0; }

        /* Error */
        .cr-error {
          display: flex; align-items: center; gap: 10px;
          background: rgba(248,113,113,.06); border: 1px solid rgba(248,113,113,.2);
          border-radius: 10px; padding: 10px 14px; color: var(--er);
          font-size: 13px; margin-bottom: 20px; line-height: 1.4;
        }
        .cr-error__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--er); flex-shrink: 0; }

        /* Form layout */
        .cr-form { display: flex; flex-direction: column; gap: 0; }
        .cr-section { margin-bottom: 22px; display: flex; flex-direction: column; gap: 12px; }
        .cr-section__lbl {
          font-size: 10px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: var(--tx3);
          padding-bottom: 10px; border-bottom: 1px solid var(--bd);
          margin: 0;
        }
        .cr-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cr-row--3 { grid-template-columns: 90px 1fr 1fr; }
        @media (max-width: 520px) {
          .cr-row, .cr-row--3 { grid-template-columns: 1fr; }
        }

        /* Inputs */
        .cr-form input[type=text],
        .cr-form input[type=email],
        .cr-form input[type=password],
        .cr-form input[type=tel],
        .cr-form select {
          width: 100%;
          background: var(--s2);
          border: 1.5px solid var(--bd2);
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 14px;
          color: var(--tx);
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          -webkit-appearance: none;
          appearance: none;
          transition: border-color .15s var(--e), background .15s var(--e), box-shadow .15s var(--e);
        }
        .cr-form input::placeholder { color: var(--tx3); }
        .cr-form input:hover, .cr-form select:hover {
          border-color: rgba(255,255,255,.24);
          background: var(--s3);
        }
        .cr-form input:focus, .cr-form select:focus {
          border-color: var(--g);
          background: var(--s3);
          box-shadow: 0 0 0 3px var(--g-ring);
        }
        .cr-form select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer;
        }
        .cr-form select option { background: #1a1a1a; }

        /* Pw toggle */
        .cr-pw-wrap { position: relative; }
        .cr-pw-wrap input { padding-right: 58px; }
        .cr-pw-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          font-size: 11px; font-weight: 700; color: var(--tx3);
          background: rgba(255,255,255,.06); border: 1px solid var(--bd2);
          padding: 3px 8px; border-radius: 6px; cursor: pointer;
          transition: color .15s, border-color .15s;
        }
        .cr-pw-btn:hover { color: var(--tx); border-color: rgba(255,255,255,.22); }

        /* Combo */
        .cr-combo { position: relative; }
        .cr-combo__ok {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          color: var(--g); display: flex; pointer-events: none;
        }
        .cr-combo__drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #111; border: 1.5px solid var(--bd2); border-radius: 10px;
          list-style: none; margin: 0; padding: 4px;
          max-height: 190px; overflow-y: auto;
          z-index: 60; box-shadow: 0 16px 40px rgba(0,0,0,.7);
        }
        .cr-combo__drop::-webkit-scrollbar { width: 3px; }
        .cr-combo__drop::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }
        .cr-combo__opt {
          padding: 8px 10px; font-size: 13.5px; color: var(--tx2);
          border-radius: 6px; cursor: pointer; transition: all .1s;
        }
        .cr-combo__opt:hover { background: rgba(255,255,255,.05); color: var(--tx); }
        .cr-combo__opt.--sel { background: var(--g-dim); color: var(--g); font-weight: 600; }

        /* Terms */
        .cr-sr { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
        .cr-terms {
          display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
          background: var(--s2); border: 1.5px solid var(--bd2); border-radius: 10px;
          padding: 12px 14px; margin-bottom: 20px;
          transition: border-color .15s var(--e), background .15s var(--e);
        }
        .cr-terms:hover { border-color: rgba(255,255,255,.22); }
        .cr-terms:has(.cr-sr:checked) { border-color: var(--g-bd); background: var(--g-dim); }
        .cr-terms__box {
          width: 18px; height: 18px; min-width: 18px; border-radius: 5px;
          border: 2px solid var(--bd2); background: var(--s3);
          display: flex; align-items: center; justify-content: center;
          transition: all .15s var(--e); margin-top: 1px;
        }
        .cr-terms:has(.cr-sr:checked) .cr-terms__box { background: var(--g); border-color: var(--g); color: #000; }
        .cr-terms__txt { font-size: 12px; color: var(--tx2); line-height: 1.55; }

        /* CTA */
        .cr-cta {
          width: 100%; background: var(--g); color: #000; border: none;
          border-radius: 11px; padding: 13px 20px; font-size: 14.5px; font-weight: 700;
          font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .2s var(--e);
          box-shadow: 0 4px 22px rgba(34,197,94,.22);
        }
        .cr-cta:hover:not(:disabled) {
          background: #4ade80; transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(34,197,94,.38);
        }
        .cr-cta:active:not(:disabled) { transform: translateY(0); }
        .cr-cta:disabled { opacity: .28; cursor: not-allowed; box-shadow: none; }

        /* Footer */
        .cr-foot {
          text-align: center; padding-top: 18px; margin-top: 10px;
          border-top: 1px solid var(--bd);
        }
        .cr-foot p { font-size: 13px; color: var(--tx3); margin: 0; }
        .cr-foot a { color: var(--g); font-weight: 700; text-decoration: none; }
        .cr-foot a:hover { text-decoration: underline; }

        @keyframes cr-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
    </LoggedInArtistGate>
  );
}

/* ── Field wrapper ── */
function Fld({ label, req, htmlFor, hint, children }: {
  label: string; req?: boolean; htmlFor: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label htmlFor={htmlFor} style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.62)", letterSpacing:".01em" }}>
        {label}{req && <em style={{ fontStyle:"normal", color:"#22c55e", marginLeft:2 }}>*</em>}
      </label>
      {children}
      {hint && <span style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:-2 }}>{hint}</span>}
    </div>
  );
}

/* ── SVG icons ── */
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
  return <span style={{ animation:"cr-spin .7s linear infinite", display:"flex" }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity=".2"/>
      <path d="M14 8a6 6 0 01-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </span>;
}
function GemSvg() {
  return <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8 14L1 6l2-3h10l2 3-7 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M1 6h14M5 3l3 11M11 3l-3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
}
