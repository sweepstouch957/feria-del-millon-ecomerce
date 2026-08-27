import SiteFooter from "@components/SiteFooter";

/* El footer vive acá y no en la page para que salga también mientras carga
   y en el estado de error, sin repetirlo en cada return. */
export default function ArtistaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
