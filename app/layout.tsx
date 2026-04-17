import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tusitio.com'
  ),
  title: {
    default: 'El Mejor Software para Cada Profesional',
    template: '%s | SoftwareProf',
  },
  description:
    'Comparativas honestas de software B2B adaptadas a tu profesión. Encuentra la herramienta perfecta para tu sector en España.',
  openGraph: { type: 'website', locale: 'es_ES' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        className="bg-[#080808] text-[#ededed] antialiased"
      >
        {children}
      </body>
    </html>
  )
}
