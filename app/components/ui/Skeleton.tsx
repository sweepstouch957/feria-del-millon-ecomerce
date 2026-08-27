"use client";

/* Placeholder de carga. Se dimensiona igual que el contenido final para que al
   llegar los datos no haya salto (CLS). */

export default function Skeleton({
  w = "100%",
  h = 14,
  radius = 0,
  aspect,
  style,
}: {
  w?: number | string;
  h?: number | string;
  radius?: number;
  aspect?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className="fdm-skel"
      style={{
        display: "block",
        width: w,
        height: aspect ? undefined : h,
        aspectRatio: aspect,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
