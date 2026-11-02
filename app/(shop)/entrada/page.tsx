// app/(shop)/entrada/page.tsx — destino del QR impreso de taquilla: la entrada de hoy.
// ?dia=YYYY-MM-DD abre otro día de feria: sirve para probar antes del evento.
import { ExampleTicketsSection } from "@components/views/tickets/ExampleSection";

export default async function EntradaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const { dia } = await searchParams;
  return <ExampleTicketsSection quick dia={dia} />;
}
