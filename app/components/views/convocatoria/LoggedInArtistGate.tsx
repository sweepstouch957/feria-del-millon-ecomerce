"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@provider/authProvider";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import { Bone } from "@components/views/admin/artist/ui";
import { ApplyShell, Ico, Journey } from "./applyUi";

/**
 * A dónde debe ir el artista según el estado de su postulación, y con qué
 * palabras se le dice. `journey` es el paso del camino en el que va
 * (0 cuenta · 1 pago · 2 proyecto · 3 respuesta).
 */
function nextFor(app: ArtistApplication): { url: string; label: string; title: string; text: string; journey: 0 | 1 | 2 | 3 } {
  // Invitado por la feria: no paga inscripción ni llena postulación.
  if (app.invited) {
    return { url: "/admin/artist", label: "Ir a mi estudio", title: "Entraste por invitación", text: "La feria te invitó directamente: no tienes que postularte ni pagar. Ya puedes cargar tus obras.", journey: 3 };
  }
  if (!app.isPaid || app.status === "pending_payment") {
    return { url: `/convocatoria/pagar?appId=${app._id}`, label: "Pagar la inscripción", title: "Te falta pagar la inscripción", text: "Tu cuenta ya está creada. Cuando pagues se abre el formulario para subir tu proyecto.", journey: 1 };
  }
  if (app.status === "draft" || app.status === "revision_requested") {
    const hasImages = !!app.artworkImages?.length;
    const where = hasImages ? "revisar y enviar" : app.projectReview ? "subir tus obras" : app.bio || app.cvUrl ? "contar tu proyecto" : "completar tu perfil";
    return {
      url: `/convocatoria/aplicar?appId=${app._id}`,
      label: "Continuar mi postulación",
      title: app.status === "revision_requested" ? "El jurado te pide corregir algo" : "Sigue donde quedaste",
      text: `Ya pagaste la inscripción. Lo que sigue es ${where}.`,
      journey: 2,
    };
  }
  return { url: "/convocatoria/mi-solicitud", label: "Ver mi postulación", title: "Tu postulación ya fue enviada", text: "Está en manos del jurado. Puedes ver en qué va cuando quieras.", journey: 3 };
}

/**
 * Si ya hay sesión, en vez del formulario de registro muestra «sigue donde
 * quedaste» con un solo botón. Sin sesión, deja pasar al registro.
 */
export function LoggedInArtistGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const [app, setApp] = useState<ArtistApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      setChecked(true);
      return;
    }
    getMyApplications()
      .then((apps) => {
        if (apps && apps.length > 0) setApp(apps[0]);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setChecked(true);
      });
  }, [isAuthenticated, isAuthLoading]);

  if (!checked || isAuthLoading || (isAuthenticated && loading)) {
    return (
      <ApplyShell narrow>
        <Bone h={56} style={{ borderRadius: 12 }} />
        <Bone w="70%" h={40} />
        <Bone h={160} style={{ borderRadius: 16 }} />
      </ApplyShell>
    );
  }

  if (!isAuthenticated) return <>{children}</>;

  const name = user?.firstName || "artista";

  // Con sesión pero sin postulación: directo a empezar.
  if (!app) {
    return (
      <ApplyShell narrow>
        <Journey current={1} />
        <div className="fdm-ap-head">
          <span className="fdm-st-eyebrow">Ya tienes cuenta</span>
          <h1 className="fdm-st-h1">Hola, {name}</h1>
          <p className="fdm-st-lead">No necesitas registrarte otra vez. Empieza tu postulación con la cuenta que ya tienes.</p>
        </div>
        <Link href="/convocatoria/aplicar" className="fdm-st-btn is-green is-lg">Empezar mi postulación<Ico name="arrow" /></Link>
        <Link href="/" className="fdm-st-btn">Volver al inicio</Link>
      </ApplyShell>
    );
  }

  const next = nextFor(app);
  const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;

  return (
    <ApplyShell narrow>
      <Journey current={next.journey} />
      <div className="fdm-ap-head">
        <span className="fdm-st-eyebrow">Hola de nuevo, {name}</span>
        <h1 className="fdm-st-h1">{next.title}</h1>
        <p className="fdm-st-lead">{next.text}</p>
      </div>

      <div className="fdm-st-stats">
        <div><span className="fdm-st-label">Convocatoria</span><span style={{ fontSize: 16 }}>{conv?.name || "Feria del Millón"}</span></div>
        <div><span className="fdm-st-label">Inscripción</span><span style={{ fontSize: 16 }}>{app.invited ? "No aplica" : app.isPaid ? "Pagada" : "Sin pagar"}</span></div>
        <div><span className="fdm-st-label">Obras</span><span style={{ fontSize: 16 }}>{app.artworkImages?.length || 0}</span></div>
      </div>

      <Link href={next.url} className="fdm-st-btn is-green is-lg">{next.label}<Ico name="arrow" /></Link>
      {next.url !== "/convocatoria/mi-solicitud" && <Link href="/convocatoria/mi-solicitud" className="fdm-st-btn">Ver mi postulación completa</Link>}
    </ApplyShell>
  );
}
