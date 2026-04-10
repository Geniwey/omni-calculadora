import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

const BASE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tusitio.com'
const MATRIX_DIR  = path.join(process.cwd(), 'data', 'matrix')
const CHUNK_SIZE  = 5000 // Google acepta hasta 50.000 por fichero; 5k es seguro

// Next.js llama a generateSitemaps() para saber cuántos sub-sitemaps crear.
// Cada uno se sirve en /sitemap/0.xml, /sitemap/1.xml, etc.
// El índice principal en /sitemap.xml los referencia automáticamente.
export function generateSitemaps() {
  if (!fs.existsSync(MATRIX_DIR)) return [{ id: 0 }]

  const total = fs
    .readdirSync(MATRIX_DIR)
    .filter(f => f.endsWith('.json') && f !== '.gitkeep').length

  const count = Math.max(1, Math.ceil(total / CHUNK_SIZE))
  return Array.from({ length: count }, (_, i) => ({ id: i }))
}

export default function sitemap({
  id,
}: {
  id: number
}): MetadataRoute.Sitemap {
  // ── Páginas estáticas de la raíz (solo en el primer chunk) ────────────
  const staticRoutes: MetadataRoute.Sitemap =
    id === 0
      ? [
          {
            url:             BASE_URL,
            lastModified:    new Date(),
            changeFrequency: 'weekly',
            priority:        1.0,
          },
        ]
      : []

  // ── Páginas de matriz ─────────────────────────────────────────────────
  if (!fs.existsSync(MATRIX_DIR)) return staticRoutes

  const files = fs
    .readdirSync(MATRIX_DIR)
    .filter(f => f.endsWith('.json') && f !== '.gitkeep')

  const chunk = files.slice(id * CHUNK_SIZE, (id + 1) * CHUNK_SIZE)

  const matrixRoutes: MetadataRoute.Sitemap = chunk.map(file => {
    const [categoria, nicho] = file.replace('.json', '').split('--')

    // Intenta leer la fecha real del JSON para un lastModified preciso
    let lastModified = new Date()
    try {
      const raw   = fs.readFileSync(path.join(MATRIX_DIR, file), 'utf-8')
      const entry = JSON.parse(raw)
      if (entry.last_updated) lastModified = new Date(entry.last_updated)
    } catch {
      // Si el JSON falla no rompemos el sitemap; usamos la fecha de hoy
    }

    return {
      url:             `${BASE_URL}/mejor-${categoria}-para-${nicho}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority:        0.8,
    }
  })

  return [...staticRoutes, ...matrixRoutes]
}
