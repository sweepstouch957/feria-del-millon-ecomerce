import PavilionPageClient from "@components/views/pavilion/PavilionPageClient";

const DEFAULT_EVENT_ID = "6909aef219f26eec22af4220";

// ✅ Next.js 15: params es Promise<{ slug: string }>
export default async function PavilionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <PavilionPageClient eventId={DEFAULT_EVENT_ID} slug={slug} />;
}
