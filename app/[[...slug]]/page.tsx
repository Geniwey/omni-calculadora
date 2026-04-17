import fs                       from 'fs'
import path                     from 'path'
import { notFound }             from 'next/navigation'
import type { Metadata }        from 'next'
import { StickyCTA, ExitIntent } from '../client'
import type { Product }         from '../client'

const ROOT          = process.cwd()
const MATRIX_DIR    = path.join(ROOT, 'data', 'matrix')
const CATS_PATH     = path.join(ROOT, 'data', 'categories.json')
const NICHES_PATH   = path.join(ROOT, 'data', 'niches.json')
const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tusitio.com'

type FAQ = { pregunta: string; respuesta: string }
type MatrixEntry = {
  categoria: string; nicho: string; titulo_h1: string; meta_title: string;
  meta_description: string; intro: string; pain_points: string[];
  theme?: { colorPrincipal?: string }; productos: Product[]; faq: FAQ[]; last_updated: string
}
type CatMeta   = { slug: string; label: string; description: string }
type NicheMeta = { slug: string; label: string; sector: string; theme?: { colorPrincipal?: string } }

const ACCENTS: Record<string, { hex: string; dim: string; glow: string }> = {
  blue:    { hex: '#3b82f6', dim: '#1d3f6e', glow: '#3b82f620' },
  indigo:  { hex: '#6366f1', dim: '#312e81', glow: '#6366f120' },
  violet:  { hex: '#8b5cf6', dim: '#3b0764', glow: '#8b5cf620' },
  purple:  { hex: '#a855f7', dim: '#3b0764', glow: '#a855f720' },
  emerald: { hex: '#10b981', dim: '#064e3b', glow: '#10b98120' },
  teal:    { hex: '#14b8a6', dim: '#042f2e', glow: '#14b8a620' },
  green:   { hex: '#22c55e', dim: '#14532d', glow: '#22c55e20' },
  amber:   { hex: '#f59e0b', dim: '#451a03', glow: '#f59e0b20' },
  orange:  { hex: '#f97316', dim: '#431407', glow: '#f9731620' },
  rose:    { hex: '#f43f5e', dim: '#4c0519', glow: '#f43f5e20' },
  red:     { hex: '#ef4444', dim: '#450a0a', glow: '#ef444420' },
}

function getAccent(colorKey?: string) { return ACCENTS[colorKey ?? 'blue'] ?? ACCENTS.blue }

function readCats(): CatMeta[] {
  try { return JSON.parse(fs.readFileSync(CATS_PATH, 'utf-8')) } catch { return [] }
}
function readNiches(): NicheMeta[] {
  try { return JSON.parse(fs.readFileSync(NICHES_PATH, 'utf-8')) } catch { return [] }
}
function readAllSlugs() {
  if (!fs.existsSync(MATRIX_DIR)) return []
  return fs.readdirSync(MATRIX_DIR).filter(f => f.endsWith('.json') && f !== '.gitkeep').flatMap(f => {
    const parts = f.replace('.json', '').split('--')
    return parts.length === 2 ? [{ categoria: parts[0], nicho: parts[1] }] : []
  })
}
function readEntry(categoria: string, nicho: string): MatrixEntry | null {
  const fp = path.join(MATRIX_DIR, `${categoria}--${nicho}.json`)
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) } catch { return null }
}

function parseSlug(slug?: string[]) {
  if (!slug || slug.length === 0) return { type: 'home' }
  const match = slug[0].match(/^mejor-(.+?)-para-(.+)$/)
  if (!match) return { type: '404' }
  return { type: 'matrix', categoria: match[1], nicho: match[2] }
}

export function generateStaticParams() {
  const matrix = readAllSlugs().map(({ categoria, nicho }) => ({ slug: [`mejor-${categoria}-para-${nicho}`] }))
  return [{ slug: [] }, ...matrix]
}

export async function generateMetadata({ params }: { params: { slug?: string[] } }): Promise<Metadata> {
  const route = parseSlug(params.slug)
  if (route.type === 'home') return { title: 'SoftwareProf | Comparativas B2B' }
  if (route.type === 'matrix') {
    const entry = readEntry(route.categoria as string, route.nicho as string)
    return entry ? { title: entry.meta_title, description: entry.meta_description } : {}
  }
  return {}
}

function HomePage() {
  const cats = readCats(); const niches = readNiches(); const slugs = readAllSlugs()
  const nichoLabel = Object.fromEntries(niches.map(n => [n.slug, n.label]))
  const grouped = cats.map(cat => ({
    cat,
    entries: slugs.filter(s => s.categoria === cat.slug).map(s => ({ 
      href: `/mejor-${s.categoria}-para-${s.nicho}`, 
      label: `${cat.label} para ${nichoLabel[s.nicho] ?? s.nicho}` 
    }))
  })).filter(g => g.entries.length > 0)

  return (
    <div className="min-h-screen bg-[#080808] p-8">
      <header className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-6xl font-black text-white mb-4">SoftwareProf<span className="text-blue-500">.</span></h1>
        <p className="text-gray-400 text-xl">Encuentra el software perfecto para tu sector profesional.</p>
      </header>
      <main className="max-w-5xl mx-auto space-y-16">
        {grouped.map(g => (
          <section key={g.cat.slug}>
            <h2 className="text-2xl font-bold text-white border-b border-[#1f1f1f] pb-4 mb-6">{g.cat.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {g.entries.map(e => (
                <a key={e.href} href={e.href} className="block p-6 rounded-2xl bg-[#0f0f0f] border border-[#1a1a1a] hover:border-blue-500 transition-all group">
                  <p className="text-gray-300 group-hover:text-white font-medium">{e.label}</p>
                  <p className="text-blue-500 text-xs mt-2 font-bold">Ver comparativa →</p>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

function MatrixPage({ entry, categoria, nicho }: { entry: MatrixEntry, categoria: string, nicho: string }) {
  const acc = getAccent(entry.theme?.colorPrincipal)
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="py-24 px-6 border-b border-[#111] text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10" style={{ background: `radial-gradient(circle, ${acc.hex}, transparent)` }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">{entry.titulo_h1}</h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">{entry.intro}</p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-8">
          {entry.productos.map((p, i) => (
            <article key={p.slug} className="p-8 rounded-3xl bg-[#0f0f0f] border border-[#1a1a1a]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black" style={{ backgroundColor: acc.hex }}>{i+1}</div>
                <h2 className="text-2xl font-bold">{p.nombre}</h2>
              </div>
              <p className="text-gray-400 mb-8">{p.descripcion}</p>
              <a href={p.url_afiliado} target="_blank" className="block w-full py-4 rounded-xl text-center font-bold transition-transform active:scale-95" style={{ backgroundColor: acc.hex }}>Probar {p.nombre} gratis →</a>
            </article>
          ))}
        </div>
      </main>
      <StickyCTA producto={entry.productos[0]} accent={acc.hex} />
      <ExitIntent producto={entry.productos[0]} nicho={nicho} accent={acc.hex} />
    </div>
  )
}

export default function Page({ params }: { params: { slug?: string[] } }) {
  const route = parseSlug(params.slug)
  if (route.type === 'home') return <HomePage />
  if (route.type === '404') notFound()
  const entry = readEntry(route.categoria as string, route.nicho as string)
  if (!entry) notFound()
  return <MatrixPage entry={entry} categoria={route.categoria as string} nicho={route.nicho as string} />
}
