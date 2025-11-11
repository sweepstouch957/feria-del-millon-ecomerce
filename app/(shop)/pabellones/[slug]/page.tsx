// app/pabellones/[slug]/page.tsx

import PavilionPageClient from "@components/views/pavilion/PavilionPageClient";

const DEFAULT_EVENT_ID = "6909aef219f26eec22af4220";

export default function PavilionPage({ params }: { params: { slug: string } }) {
  return <PavilionPageClient eventId={DEFAULT_EVENT_ID} slug={params.slug} />
}
