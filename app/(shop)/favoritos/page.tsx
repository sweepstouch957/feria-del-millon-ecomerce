import FavoritesPageClient from "@components/views/favorites/FavoritesPageClient";
import SiteFooter from "@components/SiteFooter";
import FairModeGate from "@components/FairModeGate";

export const metadata = { title: "Favoritos · Feria del Millón" };

export default function FavoritesPage() {
  return (
    <>
      <FairModeGate>
        <FavoritesPageClient />
      </FairModeGate>
      <SiteFooter />
    </>
  );
}
