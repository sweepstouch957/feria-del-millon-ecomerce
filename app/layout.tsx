import Navigation from "@components/Navigation";
import "./globals.css";
import { AuthProvider } from "@provider/authProvider";
import ReactQueryProvider from "@provider/reactQueryProvider";
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
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <Navigation />
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
