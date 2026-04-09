import "./globals.css";

export const metadata = {
  title: "Omni-Calculadora | Herramientas Gratis",
  description: "Calculadoras exactas, gratis y automáticas para cualquier necesidad. Finanzas, salud y más.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
