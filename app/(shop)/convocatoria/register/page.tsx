"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@services/auth.service";
import { useAuth } from "@provider/authProvider";

/* ── Helpers ───────────────────────────────────────────── */
/** Format phone to +57 3XX XXX XXXX */
function formatColPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `+57 ${digits}`;
  if (digits.length <= 6) return `+57 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+57 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

const FLOW_STEPS = [
  "Crear cuenta",
  "Pagar inscripción",
  "Subir obras",
  "Resolución del curador",
];

export default function ConvocatoriaRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
    mobile: "", city: "", documentType: "CC", documentNumber: "",
    instagram: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/^\+57\s?/, "");
    const digits = input.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, mobile: digits }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.mobile ? `+57${form.mobile}` : undefined,
        city: form.city,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        instagram: form.instagram,
        roles: { artista: true },
      });
      
      // Auto-login after register
      await login(form.email, form.password);
      
      // Go directly to application flow
      router.push("/convocatoria/aplicar");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      if (err?.message?.includes("login")) {
        router.push("/login?role=artist&redirect=/convocatoria/aplicar&msg=cuenta_creada");
      } else {
        setError(err?.response?.data?.error || err?.message || "Error al registrarse");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center py-10 px-4">
      <main className="reg-page w-full min-h-max">
        <div className="reg-container">
        {/* Left panel */}
        <div className="reg-side">
          <div className="reg-side__badge">Convocatoria 2026</div>
          <h1 className="reg-side__title">Únete a la<br /><span>Feria del Millón</span></h1>
          <p className="reg-side__desc">
            Crea tu cuenta de artista y postula tu proyecto. Una vez que completes el registro,
            podrás pagar la inscripción ($40,000 COP) y subir tus obras.
          </p>
          <div className="reg-side__steps">
            {FLOW_STEPS.map((s, i) => (
              <div key={s} className="reg-side__step">
                <span className={`reg-side__step-n ${i === 0 ? "active" : ""}`}>{i + 1}</span>
                <span className={`reg-side__step-label ${i === 0 ? "active" : ""}`}>{s}</span>
              </div>
            ))}
          </div>
          <p className="reg-side__login">
            ¿Ya tienes cuenta? <Link href="/login?redirect=/convocatoria/aplicar">Inicia sesión</Link>
          </p>
        </div>

        {/* Right panel — form */}
        <div className="reg-form-panel">
          <h2 className="reg-form__title">Registro de artista</h2>
          <p className="reg-form__subtitle">Complete todos los campos para crear su cuenta</p>

          {error && <div className="reg-error">{error}</div>}

          <form onSubmit={handleSubmit} className="reg-form">
            <div className="reg-row">
              <div className="reg-field">
                <label>Nombre *</label>
                <input type="text" value={form.firstName} onChange={set("firstName")} required placeholder="María" />
              </div>
              <div className="reg-field">
                <label>Apellido *</label>
                <input type="text" value={form.lastName} onChange={set("lastName")} required placeholder="García" />
              </div>
            </div>

            <div className="reg-field">
              <label>Correo electrónico *</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="artista@correo.com" />
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label>Contraseña *</label>
                <div className="reg-pw-wrap">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} required minLength={8} placeholder="Mínimo 8 caracteres" />
                  <button type="button" className="reg-pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div className="reg-field">
                <label>Confirmar contraseña *</label>
                <div className="reg-pw-wrap">
                  <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} required placeholder="Repite la contraseña" />
                  <button type="button" className="reg-pw-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label>Teléfono / Móvil</label>
                <input
                  type="tel"
                  value={formatColPhone(form.mobile)}
                  onChange={handlePhoneChange}
                  placeholder="+57 300 000 0000"
                />
                <span className="reg-hint">Formato Colombia · 10 dígitos</span>
              </div>
              <div className="reg-field">
                <label>Ciudad</label>
                <input type="text" value={form.city} onChange={set("city")} placeholder="Bogotá" />
              </div>
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label>Tipo de documento</label>
                <select value={form.documentType} onChange={set("documentType")}>
                  {["CC","CE","NIT","PP","INE","OTRO"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="reg-field">
                <label>Número de documento</label>
                <input type="text" value={form.documentNumber} onChange={set("documentNumber")} placeholder="12345678" />
              </div>
            </div>

            <div className="reg-field">
              <label>Instagram (opcional)</label>
              <input type="text" value={form.instagram} onChange={set("instagram")} placeholder="@tuusuario" />
            </div>

            {/* Clickable terms checkbox */}
            <label className="reg-terms" htmlFor="terms-cb">
              <input
                id="terms-cb"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="reg-terms__input"
              />
              <span className="reg-terms__check">{acceptedTerms ? "✓" : ""}</span>
              <span className="reg-terms__text">
                Acepto el tratamiento de mis datos personales para los fines relacionados con la Feria del Millón, incluyendo la publicación de mi nombre en caso de ser seleccionado.
              </span>
            </label>

            <button type="submit" className="reg-submit" disabled={loading || !acceptedTerms}>
              {loading ? "Creando cuenta…" : "Crear cuenta y continuar →"}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .reg-page { display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
        .reg-container {
          max-width: 1100px; margin: auto; width: 100%;
          display: grid; grid-template-columns: 1fr 1.2fr; gap: 0;
          background: #0a0a0a; border-radius: 24px; overflow: hidden;
          box-shadow: 0 24px 64px rgba(255,255,255,0.05); border: 1px solid #222;
        }
        @media (max-width: 768px) { .reg-container { grid-template-columns: 1fr; } }

        /* Left side */
        .reg-side {
          background: #000; border-right: 1px solid #222;
          padding: 56px 40px; color: #fff; display: flex; flex-direction: column;
        }
        .reg-side__badge {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; padding: 6px 16px; border-radius: 100px; font-size: 13px;
          font-weight: 600; display: inline-block; margin-bottom: 28px; align-self: flex-start;
        }
        .reg-side__title { font-size: 36px; font-weight: 900; margin: 0 0 16px; line-height: 1.1; letter-spacing: -1px; }
        .reg-side__title span { color: #9ca3af; }
        .reg-side__desc { color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0 0 36px; }
        .reg-side__steps { display: flex; flex-direction: column; gap: 16px; flex: 1; }
        .reg-side__step { display: flex; align-items: center; gap: 12px; }
        .reg-side__step-n {
          width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.4); font-size: 12px;
          font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: all .2s;
        }
        .reg-side__step-n.active { background: #fff; border-color: #fff; color: #000; }
        .reg-side__step-label { font-size: 14px; color: rgba(255,255,255,0.4); transition: color .2s; }
        .reg-side__step-label.active { color: #fff; font-weight: 700; }
        .reg-side__login { margin-top: 32px; font-size: 13px; color: rgba(255,255,255,0.5); }
        .reg-side__login a { color: #fff; text-decoration: underline; }

        /* Form panel */
        .reg-form-panel { padding: 48px 40px; overflow-y: auto; background: #0a0a0a; color: #fff; }
        .reg-form__title { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 4px; letter-spacing: -1px; }
        .reg-form__subtitle { color: #888; font-size: 14px; margin: 0 0 28px; }
        .reg-error {
          background: rgba(220,38,38,0.1); border: 1px solid #ef4444; color: #ef4444;
          padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 20px;
        }
        .reg-form { display: flex; flex-direction: column; gap: 16px; }
        .reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .reg-row { grid-template-columns: 1fr; } }
        .reg-field { display: flex; flex-direction: column; gap: 6px; }
        .reg-field label { font-size: 13px; font-weight: 600; color: #ccc; }
        .reg-field input, .reg-field select, .reg-field textarea {
          border: 1.5px solid #333; border-radius: 10px; padding: 10px 14px;
          font-size: 14px; outline: none; transition: border-color .2s; background: #111;
          color: #fff; font-family: inherit;
        }
        .reg-field input::placeholder, .reg-field textarea::placeholder { color: #555; }
        .reg-field select { color: #fff; }
        .reg-field input:focus, .reg-field select:focus, .reg-field textarea:focus {
          border-color: #fff; background: #000;
        }
        .reg-hint { font-size: 11px; color: #666; }

        /* Password toggle */
        .reg-pw-wrap { position: relative; }
        .reg-pw-wrap input { width: 100%; padding-right: 40px; }
        .reg-pw-toggle {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; font-size: 16px;
          padding: 4px; line-height: 1;
        }

        /* Terms checkbox */
        .reg-terms {
          display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
          background: #111; border: 1px solid #333; border-radius: 12px; padding: 16px;
          transition: border-color .2s;
        }
        .reg-terms:hover { border-color: #555; }
        .reg-terms__input { position: absolute; opacity: 0; width: 0; height: 0; }
        .reg-terms__check {
          width: 22px; height: 22px; border-radius: 6px; border: 2px solid #555;
          background: #0a0a0a; display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
          transition: all .15s;
        }
        .reg-terms:has(.reg-terms__input:checked) .reg-terms__check {
          background: #fff; border-color: #fff; color: #000;
        }
        .reg-terms__text { font-size: 12px; color: #aaa; line-height: 1.5; }

        .reg-submit {
          background: #fff; color: #000;
          border: none; border-radius: 12px; padding: 15px; font-size: 16px;
          font-weight: 700; cursor: pointer; transition: all .2s;
        }
        .reg-submit:hover:not(:disabled) { transform: translateY(-1px); background: #eee; }
        .reg-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
      </main>
    </div>
  );
}
