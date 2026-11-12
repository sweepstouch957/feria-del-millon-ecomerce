"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@services/auth.service";
import { useAuth } from "@provider/authProvider";
import { useCities } from "@hooks/queries/useCities";
import type { CityDoc } from "@services/city.service";
import { LoggedInArtistGate } from "@components/views/convocatoria/LoggedInArtistGate";
import { useEdition } from "@provider/editionProvider";
import ConvocatoriaClosed from "@components/views/convocatoria/ConvocatoriaClosed";
import { Alert, ApplyShell, Ico, Journey } from "@components/views/convocatoria/applyUi";
import PhoneInput from "@components/PhoneInput";

/* Paso 1 del camino de la postulación: crear la cuenta de artista.
   Tres tarjetas cortas (quién eres, tu contraseña, cómo te contactamos) y un
   solo botón. Lo opcional está marcado como opcional. */

const REG_CSS = `
  .fdm-rg-combo { position: relative; }
  .fdm-rg-drop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30; margin: 0; padding: 6px; list-style: none; max-height: 240px; overflow-y: auto; background: var(--card); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 24px 48px rgba(17,17,17,.16); }
  .fdm-rg-drop li { min-height: 44px; padding: 0 12px; display: flex; align-items: center; border-radius: 8px; font-size: 16px; cursor: pointer; }
  .fdm-rg-drop li:hover, .fdm-rg-drop li[aria-selected="true"] { background: var(--soft); }
  .fdm-rg-pass { position: relative; }
  .fdm-rg-pass input { padding-right: 96px !important; }
  .fdm-rg-pass button { position: absolute; right: 4px; top: 4px; height: 44px; padding: 0 12px; border: none; background: transparent; font-size: 14px; color: var(--fg); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .fdm-rg-terms { display: flex; gap: 12px; align-items: flex-start; padding: 16px; border: 1px solid var(--line2); border-radius: 12px; background: var(--card); cursor: pointer; font-size: 15px !important; font-weight: 400 !important; line-height: 1.5; color: var(--fg2) !important; }
  .fdm-rg-terms:has(input:checked) { border-color: var(--green); background: var(--green-soft); color: var(--fg) !important; }
  .fdm-rg-terms input { margin-top: 2px; flex: none; }
`;

export default function ConvocatoriaRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { data: allCities = [] } = useCities();
  const { convocatoria } = useEdition();

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
    .filter((c) => c.active)
    .filter((c) => !cityQuery || c.name.toLowerCase().includes(cityQuery.toLowerCase()))
    .slice(0, 14);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectCity = (c: CityDoc) => {
    setCityQuery(c.name);
    setSelectedCityId(c.id);
    setCityOpen(false);
  };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const fail = (msg: string) => {
    setError(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) return fail("Escribe tu nombre y tu apellido.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return fail("Escribe un correo electrónico válido.");
    if (form.password.length < 8) return fail("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== form.confirmPassword) return fail("Las dos contraseñas no coinciden.");
    if (!acceptedTerms) return fail("Para continuar debes aceptar el tratamiento de tus datos.");
    setLoading(true);
    try {
      await register({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        mobile: form.mobile || undefined, // ya viene con país: "+573001234567"
        city: cityQuery || undefined,
        cityId: selectedCityId || undefined,
        documentType: form.documentType,
        documentNumber: form.documentNumber || undefined,
        instagram: form.instagram || undefined,
        roles: { artista: true },
      });
      await login(form.email, form.password);
      router.push("/convocatoria/aplicar");
    } catch (e2: unknown) {
      const err = e2 as { response?: { data?: { error?: string } }; message?: string };
      if (err?.message?.includes("login")) {
        router.push("/login?role=artist&redirect=/convocatoria/aplicar&msg=cuenta_creada");
      } else {
        const raw = err?.response?.data?.error || "";
        fail(/exists/i.test(raw) ? "Ya hay una cuenta con ese correo. Entra con ella o recupera tu contraseña." : raw || "No pudimos crear tu cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Si la convocatoria vigente NO está abierta, no hay registro nuevo.
  if (convocatoria && convocatoria.status !== "open") return <ConvocatoriaClosed />;

  const pwMismatch = !!form.confirmPassword && form.confirmPassword !== form.password;

  return (
    <LoggedInArtistGate>
      <ApplyShell>
        <style>{REG_CSS}</style>
        <Journey current={0} />

        <div className="fdm-ap-head">
          <span className="fdm-st-eyebrow">Paso 1 de 4</span>
          <h1 className="fdm-st-h1">Crea tu cuenta de artista</h1>
          <p className="fdm-st-lead">Toma dos minutos. Con esta cuenta pagas la inscripción, subes tu proyecto y sigues tu postulación.</p>
        </div>

        {error && <Alert tone="bad">{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate style={{ display: "contents" }}>
          <section className="fdm-st-card fdm-ap-sec">
            <h2 className="fdm-st-h3">1. ¿Quién eres?</h2>
            <div className="fdm-ap-grid">
              <div className="fdm-ap-field">
                <label htmlFor="cr-fn">Nombre</label>
                <input id="cr-fn" type="text" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
              </div>
              <div className="fdm-ap-field">
                <label htmlFor="cr-ln">Apellido</label>
                <input id="cr-ln" type="text" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
              </div>
            </div>
            <div className="fdm-ap-field">
              <label htmlFor="cr-em">Correo electrónico</label>
              <input id="cr-em" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={form.email} onChange={set("email")} autoComplete="email" placeholder="nombre@correo.com" />
              <span className="fdm-ap-help">A este correo te llega la respuesta del jurado.</span>
            </div>
          </section>

          <section className="fdm-st-card fdm-ap-sec">
            <h2 className="fdm-st-h3">2. Elige una contraseña</h2>
            <div className="fdm-ap-grid">
              <div className="fdm-ap-field">
                <label htmlFor="cr-pw">Contraseña</label>
                <div className="fdm-rg-pass">
                  <input id="cr-pw" type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")} autoComplete="new-password" />
                  <button type="button" className="fdm-studio-plain" aria-pressed={showPwd} onClick={() => setShowPwd((v) => !v)}>{showPwd ? "Ocultar" : "Mostrar"}</button>
                </div>
                <span className={`fdm-ap-help${form.password.length >= 8 ? " is-ok" : ""}`}>{form.password.length >= 8 ? "Bien: tiene 8 o más caracteres." : "Mínimo 8 caracteres."}</span>
              </div>
              <div className="fdm-ap-field">
                <label htmlFor="cr-cpw">Repite la contraseña</label>
                <input id="cr-cpw" type={showPwd ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" aria-invalid={pwMismatch || undefined} />
                {pwMismatch && <span className="fdm-ap-help is-bad">Todavía no coinciden.</span>}
              </div>
            </div>
          </section>

          <section className="fdm-st-card fdm-ap-sec">
            <div className="hd">
              <h2 className="fdm-st-h3">3. ¿Cómo te contactamos? <span style={{ fontWeight: 400, color: "var(--fg2)", fontSize: 15 }}>· opcional</span></h2>
              <span className="fdm-ap-help">Puedes dejarlo para después, pero nos ayuda a ubicarte más rápido.</span>
            </div>
            <div className="fdm-ap-grid">
              <div className="fdm-ap-field">
                <label htmlFor="cr-tel">Celular</label>
                <PhoneInput id="cr-tel" value={form.mobile} onChange={(v) => setForm((f) => ({ ...f, mobile: v }))} selectStyle={{ width: 116, flex: "0 0 116px", padding: "13px 10px" }} />
              </div>
              <div className="fdm-ap-field">
                <label htmlFor="cr-city">Ciudad</label>
                <div className="fdm-rg-combo" ref={cityRef}>
                  <input
                    id="cr-city"
                    type="text"
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setSelectedCityId("");
                      setCityOpen(true);
                    }}
                    onFocus={() => setCityOpen(true)}
                    placeholder="Escribe para buscar"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={cityOpen}
                    aria-autocomplete="list"
                    aria-controls="cr-city-lb"
                  />
                  {cityOpen && filteredCities.length > 0 && (
                    <ul id="cr-city-lb" role="listbox" className="fdm-rg-drop">
                      {filteredCities.map((c) => (
                        <li key={c.id} role="option" aria-selected={c.id === selectedCityId} onMouseDown={() => selectCity(c)}>{c.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="fdm-ap-grid">
              <div className="fdm-ap-field" style={{ flex: "0 1 140px" }}>
                <label htmlFor="cr-dt">Documento</label>
                <select id="cr-dt" value={form.documentType} onChange={set("documentType")}>
                  {["CC", "CE", "NIT", "PP", "INE", "OTRO"].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="fdm-ap-field">
                <label htmlFor="cr-dn">Número</label>
                <input id="cr-dn" type="text" inputMode="numeric" value={form.documentNumber} onChange={set("documentNumber")} />
              </div>
              <div className="fdm-ap-field">
                <label htmlFor="cr-ig">Instagram</label>
                <input id="cr-ig" type="text" autoCapitalize="none" value={form.instagram} onChange={set("instagram")} placeholder="@usuario" />
              </div>
            </div>
          </section>

          <label className="fdm-rg-terms" htmlFor="cr-terms">
            <input id="cr-terms" type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
            <span>Acepto el tratamiento de mis datos personales para los fines de la Feria del Millón, incluida la publicación de mi nombre si soy seleccionado.</span>
          </label>

          <button type="submit" className="fdm-st-btn is-green fdm-studio-plain" style={{ height: 56, fontSize: 16 }} disabled={loading}>
            {loading ? "Creando tu cuenta…" : <>Crear mi cuenta y continuar<Ico name="arrow" /></>}
          </button>
        </form>

        <p className="fdm-st-note" style={{ textAlign: "center" }}>
          ¿Ya tienes cuenta? <Link href="/login?role=artist&redirect=/convocatoria/aplicar" style={{ color: "var(--fg)", textDecoration: "underline" }}>Entra aquí</Link>
        </p>
      </ApplyShell>
    </LoggedInArtistGate>
  );
}
