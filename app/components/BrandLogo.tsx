/* Logo de la feria (la "M" con cartela), PNG negro sobre transparente.
   En modo oscuro se invierte a blanco (regla .fdm-logo en el layout);
   `onDark` lo deja siempre blanco (sobre paneles oscuros en modo claro). */
export const LOGO_M = "/assets/fdm/logo-m.png";

export default function BrandLogo({
  height,
  onDark = false,
  style,
}: {
  height: number | string;
  onDark?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_M}
      alt="Feria del Millón"
      width={430}
      height={190}
      decoding="async"
      className={onDark ? "fdm-logo fdm-logo--on-dark" : "fdm-logo"}
      style={{ display: "block", height, width: "auto", ...style }}
    />
  );
}
