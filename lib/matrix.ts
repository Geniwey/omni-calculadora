import fs from 'fs'
import path from 'path'
import type { Theme } from './themes'

const MATRIX_DIR = path.join(process.cwd(), 'data', 'matrix')
const CATEGORIES_PATH = path.join(process.cwd(), 'data', 'categories.json')
const NICHES_PATH = path.join(process.cwd(), 'data', 'niches.json')

// --- TIPOS ---
export type Product = {
  nombre: string;
  slug: string;
  puntuacion: number;
  precio_desde: string;
  descripcion: string;
  pros: string[];
  cons: string[];
  url_afiliado: string;
  badge?: string;
}

export type FAQ = { pregunta: string; respuesta: string }

export type MatrixEntry = {
  categoria: string;
  nicho: string;
  titulo_h1: string;
  meta_title: string;
  meta_description: string;
  intro: string;
  pain_points: string[];
  theme: Theme;
  productos: Product[];
  faq: FAQ[];
  schema_type: string;
  last_updated: string;
}

export type CategoryMeta = { slug: string; label: string; description: string }
export type NicheMeta = { slug: string; label: string; sector: string; theme?: Theme }

// --- CACHÉ ---
let _categoriesCache: CategoryMeta[] | null = null
let _nichesCache: NicheMeta[] | null = null

// --- FUNCIONES EXPORTADAS (Las que Vercel necesita ver) ---

export function getCategories(): CategoryMeta[] {
  if (_categoriesCache) return _categoriesCache
  _categoriesCache = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf-8'))
  return _categoriesCache!
}

export function getNiches(): NicheMeta[] {
  if (_nichesCache) return _nichesCache
  _nichesCache = JSON.parse(fs.readFileSync(NICHES_PATH, 'utf-8'))
  return _nichesCache!
}

export function getAllMatrixSlugs(): { categoria: string; nicho: string }[] {
  if (!fs.existsSync(MATRIX_DIR)) return []
  const files = fs.readdirSync(MATRIX_DIR).filter(f => f.endsWith('.json') && f !== '.gitkeep')
  
  return files.map(f => {
    const parts = f.replace('.json', '').split('--')
    return { categoria: parts[0], nicho: parts[1] }
  }).filter(s => s.categoria && s.nicho)
}

export function getMatrixEntry(categoria: string, nicho: string): MatrixEntry | null {
  const filePath = path.join(MATRIX_DIR, `${categoria}--${nicho}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

export function getEntriesGroupedByCategory() {
  const categories = getCategories()
  const niches = getNiches()
  const slugs = getAllMatrixSlugs()
  const nichoMap = Object.fromEntries(niches.map(n => [n.slug, n.label]))

  return categories.map(cat => ({
    categoria: cat,
    entries: slugs
      .filter(s => s.categoria === cat.slug)
      .map(s => ({
        nicho: s.nicho,
        nichoLabel: nichoMap[s.nicho] ?? s.nicho,
        slug: `${s.categoria}--${s.nicho}`,
      }))
      .sort((a, b) => a.nichoLabel.localeCompare(b.nichoLabel, 'es')),
  })).filter(g => g.entries.length > 0)
}
