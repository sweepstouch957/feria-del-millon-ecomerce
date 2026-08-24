"use client";
import Link from "next/link";
import { useAuth } from "@provider/authProvider";
import { Calendar, User, CreditCard, Palette, Mail, FileText, Image, Pencil, ClipboardList, Search, Ruler } from "lucide-react";

export default function ConvocatoriaLandingPage() {
  const { isAuthenticated } = useAuth();
  const postularHref = isAuthenticated ? "/convocatoria/aplicar" : "/convocatoria/register";
  return (
    <main className="convocatoria-landing">
      {/* Hero */}
      <section className="conv-hero">
        <div className="conv-hero__badge"><Calendar size={14} style={{ verticalAlign: "-2px" }} /> Convocatoria Abierta 2026</div>
        <h1 className="conv-hero__title">
          Feria del <span className="conv-hero__accent">Millón</span>
        </h1>
        <p className="conv-hero__subtitle">
          Bogotá · Edición 2026 · Postula tu proyecto artístico y sé parte del evento de arte más inclusivo de Colombia
        </p>
        <div className="conv-hero__ctas">
          <Link href={postularHref} className="bg-white text-black px-8 py-4 rounded-xl text-base font-bold shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300">
            {isAuthenticated ? "Continuar mi postulación →" : "Postular ahora →"}
          </Link>
          <a href="#requisitos" className="bg-transparent text-white px-8 py-4 rounded-xl text-base font-semibold border border-white/30 hover:bg-white/10 hover:border-white/60 transition-all duration-300">
            Ver requisitos
          </a>
        </div>
        <div className="conv-hero__stats">
          <div className="conv-stat"><span className="conv-stat__num">500+</span><span>Artistas</span></div>
          <div className="conv-stat"><span className="conv-stat__num">8</span><span>Salones</span></div>
          <div className="conv-stat"><span className="conv-stat__num">3</span><span>Días</span></div>
          <div className="conv-stat"><span className="conv-stat__num">$40K</span><span>Inscripción COP</span></div>
        </div>
      </section>

      {/* Steps */}
      <section className="conv-steps">
        <div className="conv-steps__inner">
          <h2 className="conv-section-title">¿Cómo participar?</h2>
          <div className="conv-steps__grid">
            {[
              { num: "01", icon: User, title: "Crea tu cuenta", desc: "Regístrate como artista. Puedes postular a diferentes convocatorias y salones desde una sola cuenta." },
              { num: "02", icon: CreditCard, title: "Paga la inscripción", desc: "Inscripción de $40,000 COP via MercadoPago. Seguro y rápido. Activa tu acceso al formulario." },
              { num: "03", icon: Palette, title: "Sube tu proyecto", desc: "Completa el formulario: CV, foto de perfil, reseña de proyecto, imágenes de obras y fichas técnicas." },
              { num: "04", icon: Mail, title: "Espera la respuesta", desc: "Nuestro equipo de curaduría evaluará tu postulación. Recibirás una notificación por email con el resultado." },
            ].map((step) => (
              <div key={step.num} className="conv-step-card">
                <div className="conv-step-card__num">{step.num}</div>
                <div className="conv-step-card__icon"><step.icon size={32} /></div>
                <h3 className="conv-step-card__title">{step.title}</h3>
                <p className="conv-step-card__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section id="requisitos" className="conv-requirements">
        <div className="conv-requirements__inner">
          <h2 className="conv-section-title">Documentos requeridos</h2>
          <div className="conv-req__grid">
            {[
              { icon: FileText, title: "CV del artista", desc: "PDF · máx 2MB · Incluye formación, exposiciones, premios y trayectoria artística." },
              { icon: Image, title: "Foto de perfil", desc: "JPG o PNG · 640×480px · Foto profesional del artista o colectivo." },
              { icon: Pencil, title: "Biografía", desc: "Máx 500 caracteres · Ciudad de nacimiento, técnica, trayectoria." },
              { icon: ClipboardList, title: "Reseña del proyecto", desc: "Máx 750 caracteres · Descripción de la serie, ejes temáticos y conceptuales." },
              { icon: Image, title: "Imágenes del proyecto", desc: "Hasta 15 imágenes · JPG/PNG · máx 2MB por imagen · Con ficha técnica." },
              { icon: Search, title: "Imagen de detalle", desc: "1 imagen · JPG o PNG · Aspecto relevante de la técnica o proceso de creación." },
              { icon: Ruler, title: "Plano de montaje", desc: "JPG o PNG · Disposición de obras en espacio de 3.60m × 2.44m." },
            ].map((req) => (
              <div key={req.title} className="conv-req-card">
                <span className="conv-req-card__icon"><req.icon size={22} /></span>
                <div>
                  <h4 className="conv-req-card__title">{req.title}</h4>
                  <p className="conv-req-card__desc">{req.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="conv-cta-bottom">
        <h2>¿Lista/o para postular?</h2>
        <p>Únete a cientos de artistas que hacen de la Feria del Millón el evento más diverso del arte en Colombia.</p>
        <Link href={postularHref} className="inline-block bg-white text-black px-8 py-4 rounded-xl text-base font-bold shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300">
          {isAuthenticated ? "Continuar mi postulación →" : "Comenzar postulación →"}
        </Link>
      </section>

      <style jsx>{`
        * { box-sizing: border-box; }
        .convocatoria-landing { font-family: 'Inter', sans-serif; overflow-x: hidden; }

        /* ── Hero ── */
        .conv-hero {
          min-height: 90vh;
          background: #060606;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 80px 20px 64px; position: relative; overflow: hidden;
        }
        .conv-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.04) 0%, transparent 65%);
          pointer-events: none;
        }
        .conv-hero__badge {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14);
          color: #ccc; padding: 7px 18px; border-radius: 100px; font-size: 13px; font-weight: 600;
          margin-bottom: 28px; display: inline-block; position: relative; letter-spacing: 0.2px;
        }
        .conv-hero__title {
          font-size: clamp(44px, 8vw, 96px); font-weight: 900; color: #f0f0f0;
          line-height: 1; margin: 0 0 18px; position: relative; letter-spacing: -2px;
        }
        .conv-hero__accent { color: #8a8a8a; }
        .conv-hero__subtitle {
          font-size: clamp(15px, 2vw, 19px); color: rgba(255,255,255,0.5);
          max-width: 560px; margin: 0 auto 44px; line-height: 1.65; position: relative;
        }
        .conv-hero__ctas {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          position: relative; margin-bottom: 56px; width: 100%;
        }
        .conv-hero__ctas a {
          min-width: 180px; flex: 0 1 auto;
        }
        .conv-hero__stats {
          display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;
          position: relative; padding: 0 8px;
        }
        .conv-stat {
          display: flex; flex-direction: column; align-items: center;
          color: rgba(255,255,255,0.45); font-size: 13px; min-width: 64px;
        }
        .conv-stat__num { font-size: 30px; font-weight: 900; color: #e8e8e8; line-height: 1; margin-bottom: 4px; }

        /* ── Steps ── */
        .conv-steps {
          padding: 80px 20px;
          background: #0a0a0a;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .conv-steps__inner { max-width: 1100px; margin: auto; }
        .conv-section-title {
          text-align: center; font-size: clamp(26px, 4vw, 44px);
          font-weight: 900; color: #f0f0f0; margin-bottom: 48px; letter-spacing: -0.8px;
        }
        .conv-steps__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .conv-step-card {
          background: #0f0f0f; border-radius: 20px; padding: 32px 24px;
          text-align: center; transition: border-color .3s, transform .3s;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .conv-step-card:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-3px);
        }
        .conv-step-card__num {
          font-size: 11px; font-weight: 800; color: #444;
          letter-spacing: 2px; margin-bottom: 16px; text-transform: uppercase;
        }
        .conv-step-card__icon { font-size: 36px; margin-bottom: 18px; display: block; }
        .conv-step-card__title { font-size: 17px; font-weight: 800; color: #efefef; margin: 0 0 10px; }
        .conv-step-card__desc { font-size: 14px; color: #666; line-height: 1.65; margin: 0; }

        /* ── Requirements ── */
        .conv-requirements {
          padding: 80px 20px;
          background: #060606;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .conv-requirements__inner { max-width: 1060px; margin: auto; }
        .conv-req__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }
        .conv-req-card {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 18px 16px; border-radius: 12px; background: #0c0c0c;
          border: 1px solid rgba(255,255,255,0.06); transition: border-color .2s;
        }
        .conv-req-card:hover { border-color: rgba(255,255,255,0.14); }
        .conv-req-card__icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
        .conv-req-card__title { font-size: 14px; font-weight: 800; color: #efefef; margin: 0 0 3px; }
        .conv-req-card__desc { font-size: 12px; color: #666; line-height: 1.55; margin: 0; }

        /* ── CTA bottom ── */
        .conv-cta-bottom {
          background: #060606;
          color: #f0f0f0; text-align: center; padding: 96px 20px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .conv-cta-bottom h2 {
          font-size: clamp(26px, 4vw, 42px);
          font-weight: 900; margin: 0 0 14px; letter-spacing: -0.8px; color: #efefef;
        }
        .conv-cta-bottom p {
          color: rgba(255,255,255,0.45); font-size: 16px;
          margin: 0 auto 36px; max-width: 480px; line-height: 1.6;
        }

        /* ── Mobile ── */
        @media (max-width: 540px) {
          .conv-hero { padding: 64px 16px 48px; min-height: 80vh; }
          .conv-hero__ctas { gap: 10px; }
          .conv-hero__ctas a { min-width: 0; width: 100%; max-width: 320px; text-align: center; }
          .conv-hero__stats { gap: 16px; }
          .conv-stat__num { font-size: 24px; }
          .conv-steps { padding: 56px 16px; }
          .conv-requirements { padding: 56px 16px; }
          .conv-cta-bottom { padding: 64px 16px; }
          .conv-req__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
