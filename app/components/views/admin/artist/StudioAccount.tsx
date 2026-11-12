"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@provider/authProvider";
import { useEdition } from "@provider/editionProvider";
import { MY_PROJECT_KEY } from "@hooks/artist/useMyProject";
import { getMyProject, photoPosition } from "@services/applications.service";
import ArtistProfileCard from "./ArtistProfileCard";
import { Ico } from "./ui";

/* Pestaña "Cuenta" del estudio (port de "Mi estudio — Cuenta"): perfil
   público, datos de acceso, ayuda y cerrar sesión. La foto y la presentación
   se editan aquí mismo; los datos personales, en /admin/account. */

export default function StudioAccount() {
  const { user, logout } = useAuth();
  const { eventName } = useEdition();
  const { data } = useQuery({ queryKey: MY_PROJECT_KEY, queryFn: getMyProject, staleTime: 60_000 });
  const [editing, setEditing] = useState(false);

  const artistId = user?.id || user?._id;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Artista";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "A";

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 className="fdm-st-h1">Mi cuenta</h1>

      <section className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 className="fdm-st-h3">Perfil público</h2>
          <span className="fdm-st-note">Así te ven los compradores en el catálogo.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="fdm-st-avatar">
            {data?.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.profilePhotoUrl} alt="" style={{ objectPosition: photoPosition(data.profilePhotoY ?? 25) }} />
            ) : (
              initials
            )}
          </span>
          <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 20, overflowWrap: "anywhere" }}>{name}</span>
            <span className="fdm-st-note">Artista · {eventName}</span>
          </span>
        </div>
        {editing ? (
          <ArtistProfileCard />
        ) : (
          data?.bio && <p className="fdm-st-note" style={{ whiteSpace: "pre-line" }}>{data.bio}</p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" className={`fdm-st-btn fdm-studio-plain${editing ? "" : " is-solid"}`} style={{ flex: "1 1 160px", padding: "0 18px" }} onClick={() => setEditing((v) => !v)}>
            {editing ? "Cerrar edición" : <><Ico name="edit" />Editar mi perfil</>}
          </button>
          <a className="fdm-st-btn" style={{ flex: "1 1 160px", padding: "0 18px" }} href={`/artista/${artistId}`} target="_blank" rel="noopener noreferrer">
            Ver mi página<Ico name="ext" size={16} sw={1.8} />
          </a>
        </div>
      </section>

      <section className="fdm-st-card" style={{ paddingBottom: 4, display: "flex", flexDirection: "column" }}>
        <h2 className="fdm-st-h3" style={{ marginBottom: 16 }}>Datos de acceso</h2>
        <div className="fdm-st-kv">
          <span><span className="fdm-st-label">Correo</span><span className="v">{user?.email}</span></span>
          <Link href="/admin/account" className="fdm-st-btn is-sm" style={{ padding: "0 18px" }}>Cambiar</Link>
        </div>
        <div className="fdm-st-kv">
          <span><span className="fdm-st-label">Contraseña</span><span className="v">••••••••</span></span>
          <Link href="/convocatoria/recuperar?role=artist" className="fdm-st-btn is-sm" style={{ padding: "0 18px" }}>Cambiar</Link>
        </div>
        <div className="fdm-st-kv">
          <span><span className="fdm-st-label">Datos personales</span><span className="v">Nombre, teléfono, documento y redes</span></span>
          <Link href="/admin/account" className="fdm-st-btn is-sm" style={{ padding: "0 18px" }}>Editar</Link>
        </div>
      </section>

      <section className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 className="fdm-st-h3">¿Necesitas ayuda?</h2>
        <span className="fdm-st-note">Escríbele a la coordinación de la feria.</span>
        <a className="fdm-st-contact" href="mailto:coordinaciongeneral@feriadelmillon.com"><Ico name="mail" />coordinaciongeneral@feriadelmillon.com</a>
        <a className="fdm-st-contact" href="tel:+573227008576"><Ico name="phone" />+57 322 700 8576</a>
      </section>

      <button type="button" className="fdm-st-btn fdm-studio-plain" style={{ alignSelf: "flex-start", padding: "0 22px", color: "var(--fg2)" }} onClick={() => logout()}>
        <Ico name="logout" />
        Cerrar sesión
      </button>
    </div>
  );
}
