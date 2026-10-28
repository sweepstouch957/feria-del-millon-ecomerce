import PavilionPageClient from "@components/views/pavilion/PavilionPageClient";
import { getActiveEdition } from "@lib/getActiveEdition";
import FairModeGate from "@components/FairModeGate";

// Next.js 15: params es Promise<{ slug: string }>
export default async function PavilionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { eventId } = await getActiveEdition(); // edición vigente (dinámica)

  return (
    <FairModeGate>
      <PavilionPageClient eventId={eventId} slug={slug} />
    </FairModeGate>
  );
}
