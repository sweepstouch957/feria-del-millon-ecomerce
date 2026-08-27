import SiteFooter from "@components/SiteFooter";

/* El footer vive aqui y no en la page para que aparezca tambien mientras
   carga y en el estado de error, sin repetirlo en cada return. */
export default function ObraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
