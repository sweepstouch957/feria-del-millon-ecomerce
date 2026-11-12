"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import { ApplicationCard } from "@components/views/convocatoria/ApplicationCard";
import { Alert, ApplyShell } from "@components/views/convocatoria/applyUi";
import { Bone } from "@components/views/admin/artist/ui";
import SiteFooter from "@components/SiteFooter";

/* Mi postulación: en qué va cada postulación y qué le toca hacer al artista. */

export default function MiSolicitudPage() {
  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Sin sesión no hay postulación que mostrar.
  useEffect(() => {
    if (error && (error as any)?.response?.status === 401) {
      window.location.href = `/login?role=artist&redirect=${encodeURIComponent("/convocatoria/mi-solicitud")}`;
    }
  }, [error]);

  const failed = !!error && (error as any)?.response?.status !== 401;

  return (
    <>
      <ApplyShell>
        <div className="fdm-ap-head">
          <span className="fdm-st-eyebrow">Convocatoria</span>
          <h1 className="fdm-st-h1">Mi postulación</h1>
          <p className="fdm-st-lead">Aquí ves en qué va tu proceso y qué te toca hacer.</p>
        </div>

        {isLoading ? (
          <Bone h={360} style={{ borderRadius: 16 }} />
        ) : failed ? (
          <Alert tone="bad" title="No pudimos cargar tus postulaciones">Revisa tu conexión y vuelve a intentar.</Alert>
        ) : apps.length === 0 ? (
          <div className="fdm-st-empty" style={{ padding: "56px 24px" }}>
            <b>Todavía no te has postulado</b>
            Presenta tu proyecto a la convocatoria y sigue aquí tu proceso, paso por paso.
            <Link href="/convocatoria/aplicar" className="fdm-st-btn is-green is-lg" style={{ marginTop: 8 }}>Empezar mi postulación</Link>
          </div>
        ) : (
          apps.map((app: ArtistApplication) => <ApplicationCard key={app._id} app={app} />)
        )}

        <p className="fdm-st-note" style={{ textAlign: "center" }}>
          ¿Dudas? Escríbenos a <a href="mailto:coordinaciongeneral@feriadelmillon.com" style={{ color: "var(--fg)", textDecoration: "underline" }}>coordinaciongeneral@feriadelmillon.com</a>
        </p>
      </ApplyShell>
      <SiteFooter />
    </>
  );
}
