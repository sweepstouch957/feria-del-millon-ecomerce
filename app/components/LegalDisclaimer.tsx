import { mix } from "@components/views/checkout/checkoutTheme";
import { LEGAL_ENTITY } from "@lib/legalContent";

const link: React.CSSProperties = { color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 };

/** Aviso legal corto para todo formulario de pago. Los enlaces abren aparte para no perder el formulario.
 *  `children` va al final (lo propio de cada pago: reembolso, QR por correo…). */
export default function LegalDisclaimer({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: mix(55), maxWidth: "64ch", ...style }}>
      Al pagar aceptas los{" "}
      <a href="/legal#terminos" target="_blank" rel="noopener" style={link}>términos y condiciones</a>{" "}
      y autorizas el tratamiento de tus datos según la{" "}
      <a href="/legal#politica" target="_blank" rel="noopener" style={link}>política de privacidad</a>{" "}
      (Ley 1581 de 2012). La Feria del Millón es operada por {LEGAL_ENTITY.name}, NIT {LEGAL_ENTITY.nit}.
      {children ? <> {children}</> : null}
    </p>
  );
}
