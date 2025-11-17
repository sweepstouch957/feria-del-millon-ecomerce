import Navigation from "@components/Navigation";
import "./globals.css";
import { AuthProvider } from "@provider/authProvider";
import ReactQueryProvider from "@provider/reactQueryProvider";
import Script from "next/script";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Semana del Arte",
  description: "Feria del Millón - Tienda y Panel de Artistas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* SDK de Mercado Pago disponible en todo el front */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <Navigation />
            {children}
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
