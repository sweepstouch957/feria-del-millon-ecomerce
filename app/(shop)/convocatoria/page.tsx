"use client";
import Link from "next/link";

export default function ConvocatoriaLandingPage() {
  return (
    <main className="convocatoria-landing">
      {/* Hero */}
      <section className="conv-hero">
        <div className="conv-hero__badge">📅 Convocatoria Abierta 2026</div>
        <h1 className="conv-hero__title">
          Feria del <span className="conv-hero__accent">Millón</span>
        </h1>
        <p className="conv-hero__subtitle">
          Bogotá · Edición 2026 · Postula tu proyecto artístico y sé parte del evento de arte más inclusivo de Colombia
        </p>
        <div className="conv-hero__ctas">
          <Link href="/convocatoria/register" className="bg-white text-black px-8 py-4 rounded-xl text-base font-bold shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300">
            Postular ahora →
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
              { num: "01", icon: "👤", title: "Crea tu cuenta", desc: "Regístrate como artista. Puedes postular a diferentes convocatorias y salones desde una sola cuenta." },
              { num: "02", icon: "💳", title: "Paga la inscripción", desc: "Inscripción de $40,000 COP via MercadoPago. Seguro y rápido. Activa tu acceso al formulario." },
              { num: "03", icon: "🎨", title: "Sube tu proyecto", desc: "Completa el formulario: CV, foto de perfil, reseña de proyecto, imágenes de obras y fichas técnicas." },
              { num: "04", icon: "✉️", title: "Espera la respuesta", desc: "Nuestro equipo de curaduría evaluará tu postulación. Recibirás una notificación por email con el resultado." },
            ].map((step) => (
              <div key={step.num} className="conv-step-card">
                <div className="conv-step-card__num">{step.num}</div>
                <div className="conv-step-card__icon">{step.icon}</div>
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
              { icon: "📄", title: "CV del artista", desc: "PDF · máx 2MB · Incluye formación, exposiciones, premios y trayectoria artística." },
              { icon: "🖼️", title: "Foto de perfil", desc: "JPG o PNG · 640×480px · Foto profesional del artista o colectivo." },
              { icon: "✍️", title: "Biografía", desc: "Máx 500 caracteres · Ciudad de nacimiento, técnica, trayectoria." },
              { icon: "📋", title: "Reseña del proyecto", desc: "Máx 750 caracteres · Descripción de la serie, ejes temáticos y conceptuales." },
              { icon: "🖼️", title: "Imágenes del proyecto", desc: "Hasta 15 imágenes · JPG/PNG · máx 2MB por imagen · Con ficha técnica." },
              { icon: "🔍", title: "Imagen de detalle", desc: "1 imagen · JPG o PNG · Aspecto relevante de la técnica o proceso de creación." },
              { icon: "📐", title: "Plano de montaje", desc: "JPG o PNG · Disposición de obras en espacio de 3.60m × 2.44m." },
            ].map((req) => (
              <div key={req.title} className="conv-req-card">
                <span className="conv-req-card__icon">{req.icon}</span>
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
        <Link href="/convocatoria/register" className="inline-block bg-white text-black px-8 py-4 rounded-xl text-base font-bold shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300">
          Comenzar postulación →
        </Link>
      </section>

      <style jsx>{`
        .convocatoria-landing { font-family: 'Inter', sans-serif; }

        /* Hero */
        .conv-hero {
          min-height: 90vh;
          background: #000;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 80px 24px 60px; position: relative; overflow: hidden;
        }
        .conv-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 60%);
        }
        .conv-hero__badge {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; padding: 8px 20px; border-radius: 100px; font-size: 14px;
          margin-bottom: 28px; display: inline-block; position: relative;
        }
        .conv-hero__title {
          font-size: clamp(48px, 8vw, 96px); font-weight: 900; color: #fff;
          line-height: 1; margin: 0 0 16px; position: relative; letter-spacing: -2px;
        }
        .conv-hero__accent { color: #9ca3af; /* elegant gray instead of purple */ }
        .conv-hero__subtitle {
          font-size: clamp(16px, 2vw, 20px); color: rgba(255,255,255,0.65);
          max-width: 600px; margin: 0 auto 40px; line-height: 1.6; position: relative;
        }
        .conv-hero__ctas { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; margin-bottom: 60px; }
        .btn-primary-lg {
          background: #fff;
          color: #000; padding: 16px 36px; border-radius: 12px; font-size: 16px;
          font-weight: 700; text-decoration: none; transition: all .2s;
          box-shadow: 0 4px 24px rgba(255,255,255,0.1); border: 1px solid transparent;
        }
        .btn-primary-lg:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,255,255,0.2); background: #f3f4f6; }
        .btn-ghost-lg {
          background: transparent; color: #fff;
          padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 600;
          text-decoration: none; border: 1px solid rgba(255,255,255,0.3); transition: all .2s;
        }
        .btn-ghost-lg:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.6); }
        .conv-hero__stats { display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; position: relative; }
        .conv-stat { display: flex; flex-direction: column; align-items: center; color: rgba(255,255,255,0.6); font-size: 14px; }
        .conv-stat__num { font-size: 32px; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 4px; }

        /* Steps */
        .conv-steps { padding: 80px 24px; background: #0a0a0a; border-top: 1px solid #222; border-bottom: 1px solid #222;}
        .conv-steps__inner { max-width: 1200px; margin: auto; }
        .conv-section-title {
          text-align: center; font-size: clamp(28px, 4vw, 48px);
          font-weight: 900; color: #fff; margin-bottom: 48px; letter-spacing: -1px;
        }
        .conv-steps__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
        .conv-step-card {
          background: #111; border-radius: 20px; padding: 36px 28px;
          text-align: center; transition: all .3s;
          border: 1px solid #222;
        }
        .conv-step-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(255,255,255,0.02); border-color: #444; }
        .conv-step-card__num { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: 2px; margin-bottom: 16px; opacity: 0.6; }
        .conv-step-card__icon { font-size: 40px; margin-bottom: 20px; display: block; opacity: 1; }
        .conv-step-card__title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 12px; }
        .conv-step-card__desc { font-size: 14px; color: #888; line-height: 1.6; margin: 0; }

        /* Requirements */
        .conv-requirements { padding: 80px 24px; background: #000; border-top: 1px solid #111; }
        .conv-requirements__inner { max-width: 1100px; margin: auto; }
        .conv-req__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        .conv-req-card {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 20px; border-radius: 12px; background: #0a0a0a;
          border: 1px solid #222; transition: border-color .2s;
        }
        .conv-req-card:hover { border-color: #555; }
        .conv-req-card__icon { font-size: 28px; flex-shrink: 0; opacity: 1; }
        .conv-req-card__title { font-size: 15px; font-weight: 800; color: #fff; margin: 0 0 4px; }
        .conv-req-card__desc { font-size: 13px; color: #888; line-height: 1.5; margin: 0; }

        /* CTA bottom */
        .conv-cta-bottom {
          background: #000;
          color: #fff; text-align: center; padding: 100px 24px;
        }
        .conv-cta-bottom h2 { font-size: clamp(28px, 4vw, 44px); font-weight: 900; margin: 0 0 16px; letter-spacing: -1px; }
        .conv-cta-bottom p { color: rgba(255,255,255,0.65); font-size: 17px; margin: 0 auto 36px; max-width: 500px; }
      `}</style>
    </main>
  );
}
