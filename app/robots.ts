import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tusitio.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Googlebot obtiene acceso total
        userAgent:   'Googlebot',
        allow:       '/',
        disallow:    [],
        crawlDelay:  undefined,
      },
      {
        // Bingbot también indexa bien
        userAgent:  'Bingbot',
        allow:      '/',
        crawlDelay: 1,
      },
      {
        // Bloquea scrapers y bots de IA que no aportan tráfico
        // y consumen crawl budget innecesariamente
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'Google-Extended',
          'PerplexityBot',
          'Bytespider',
          'SemrushBot',
          'AhrefsBot',
          'MJ12bot',
          'DotBot',
        ],
        disallow: '/',
      },
      {
        // Todos los demás: acceso normal
        userAgent: '*',
        allow:     '/',
        disallow:  [
          '/api/',      // Rutas de API internas
          '/_next/',    // Assets internos de Next.js
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host:    BASE_URL,
  }
}
