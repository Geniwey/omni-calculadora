import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { StickyCTA, ExitIntent } from '../client'
import type { Product } from '../client'

const ROOT = process.cwd()
const MATRIX_DIR = path.join(ROOT, 'data', 'matrix')
const CATS_PATH = path.join(ROOT, 'data', 'categories.json')
const NICHES_PATH = path.join(ROOT, 'data', 'niches.json')
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tusitio.com').replace(/\/$/, '')
const YEAR = new Date().getFullYear()

type FAQ = { pregunta: string; respuesta: string }
type MatrixEntry = {
  categoria: string; nicho: string; titulo_h1: string; meta_title: string; meta_description: string;
  intro: string; pain_points: string[]; theme?: { colorPrincipal?: string };
  productos: Product[]; faq: FAQ[]; last_updated: string
}
type CatMeta = { slug: string; label: string; description: string }
type NicheMeta = { slug: string; name?: string; label?: string; sector: string; theme?: { colorPrincipal?: string } }

const PALETTE: Record<string, { hex: string; dark: string; glow: string; text: string }> = {
  blue:    { hex: '#3b82f6', dark: '#172554', glow: '#3b82f618', text: '#93c5fd' },
  indigo:  { hex: '#6366f1', dark: '#1e1b4b', glow: '#6366f118', text: '#a5b4fc' },
  violet:  { hex: '#7c3aed', dark: '#2e1065', glow: '#7c3aed18', text: '#c4b5fd' },
  emerald: { hex: '#059669', dark: '#022c22', glow: '#05966918', text: '#6ee7b7' },
  teal:    { hex: '#0d9488', dark: '#042f2e', glow: '#0d948818', text: '#5eead4' },
  amber:   { hex: '#d97706', dark: '#451a03', glow: '#d9770618', text: '#fcd34d' },
  orange:  { hex: '#ea580c', dark: '#431407', glow: '#ea580c18', text: '#fdba74' },
  rose:    { hex: '#e11d48', dark: '#4c0519', glow: '#e11d4818', text: '#fda4af' },
  purple:  { hex: '#a855f7', dark: '#3b0764', glow: '#a855f718', text: '#d8b4fe' },
}

function accent(key?: string) { return PALETTE[key ?? 'blue'] ?? PALETTE.blue }

function getCats(): CatMeta[] {
  try { return JSON.parse(fs.readFileSync(CATS_PATH, 'utf-8')) } catch { return [] }
}
function getNiches(): NicheMeta[] {
  try { return JSON.parse(fs.readFileSync(NICHES_PATH, 'utf-8')) } catch { return [] }
}
function getSlugs() {
  if (!fs.existsSync(MATRIX_DIR)) return []
  return fs.readdirSync(MATRIX_DIR).filter(f => f.endsWith('.json') && f !== '.gitkeep').flatMap(f => {
    const [c, n] = f.replace('.json','').split('--')
    return c && n ? [{ categoria: c, nicho: n }] : []
  })
}
function getEntry(cat: string, niche: string): MatrixEntry | null {
  const fp = path.join(MATRIX_DIR, `${cat}--${niche}.json`)
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) } catch { return null }
}

function parseRoute(slug?: string[]) {
  if (!slug?.length) return { type: 'home' }
  const m = slug[0].match(/^mejor-(.+?)-para-(.+)$/)
  if (!m) return { type: '404' }
  return { type: 'matrix', cat: m[1], niche: m[2] }
}

export function generateStaticParams() {
  return [ { slug: [] }, ...getSlugs().map(({ categoria, nicho }) => ({ slug: [`mejor-${categoria}-para-${nicho}`] })) ]
}

export async function generateMetadata({ params }: { params: { slug?: string[] } }): Promise<Metadata> {
  const r = parseRoute(params.slug)
  if (r.type === 'home') return { title: `El Mejor Software B2B España ${YEAR}` }
  if (r.type === 'matrix') {
    const e = getEntry(r.cat, r.niche)
    return e ? { title: e.meta_title, description: e.meta_description, alternates: { canonical: `${SITE_URL}/mejor-${r.cat}-para-${r.niche}` } } : {}
  }
  return {}
}

function Nav({ accentHex }: { accentHex?: string }) {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md border-b border-slate-200 bg-white/90 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="font-extrabold text-slate-900 text-xl tracking-tight">
          Software<span style={{ color: accentHex ?? '#3b82f6' }}>Prof</span>
        </a>
        <span className="text-xs font-medium text-slate-500 hidden sm:block bg-slate-100 px-3 py-1 rounded-full">
          Comparativas B2B Premium
        </span>
      </div>
    </nav>
  )
}

function AdSlot({ format = 'banner' }: { format?: 'banner' | 'square' | 'leaderboard' }) {
  const h = format === 'square' ? 250 : format === 'leaderboard' ? 90 : 100
  return (
    <div className="flex items-center justify-center my-10 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 relative overflow-hidden" style={{ minHeight: h }}>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Espacio Publicitario ({format})</span>
    </div>
  )
}

function HomePage() {
  const cats = getCats()
  const niches = getNiches()
  const slugs = getSlugs()
  
  const nichoLabel = Object.fromEntries(niches.map(n => [n.slug, n.name || n.label]))
  const nichoTheme = Object.fromEntries(niches.map(n => [n.slug, n.theme?.colorPrincipal]))

  const grouped = cats.map(cat => ({
    cat,
    entries: slugs.filter(s => s.categoria === cat.slug).map(s => ({
      href: `/mejor-${s.categoria}-para-${s.nicho}`,
      label: nichoLabel[s.nicho] ?? s.nicho,
      color: nichoTheme[s.nicho] ?? 'blue',
    }))
  })).filter(g => g.entries.length > 0)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Nav />
      <header className="relative overflow-hidden py-24 bg-white border-b border-slate-200">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-4xl mx-auto relative z-10 px-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100 mb-8 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            {slugs.length} guías de software actualizadas
          </div>
          <h1 className="mb-6 text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-tight">
            El software perfecto <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">para tu profesión</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Comparamos precios, funcionalidades y opiniones reales para que elijas la mejor herramienta para tu negocio en España.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        {grouped.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-6xl mb-6">🤖</p>
            <p className="text-2xl font-bold text-slate-800">El bot está preparando el contenido.</p>
            <p className="text-slate-500 mt-2">Ejecuta el script de AutoGrow para generar las comparativas.</p>
          </div>
        )}
        {grouped.map((g) => (
          <section key={g.cat.slug} className="animate-fade-in-up">
            <div className="flex items-end justify-between border-b-2 border-slate-200 pb-4 mb-8">
              <h2 className="text-3xl font-black text-slate-800">{g.cat.label}</h2>
              <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{g.entries.length} sectores</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {g.entries.map(e => {
                const a = accent(e.color)
                return (
                  <a key={e.href} href={e.href} className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: a.hex }} />
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{g.cat.label}</p>
                    <p className="text-slate-900 font-bold text-lg mb-4">Mejor software para {e.label}</p>
                    <p className="text-sm font-bold flex items-center gap-1" style={{ color: a.hex }}>
                      Ver comparativa <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </p>
                  </a>
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

function MatrixPage({ entry, cat, niche }: { entry: MatrixEntry; cat: string; niche: string }) {
  const a = accent(entry.theme?.colorPrincipal)
  const catMeta = getCats().find(c => c.slug === cat)
  const catLabel = catMeta?.label ?? cat.replace(/-/g, ' ')
  const nichoStr = getNiches().find(n => n.slug === niche)?.name ?? niche.replace(/-/g, ' ')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Nav accentHex={a.hex} />
      
      <header className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2" style={{ background: a.hex }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at top, ${a.hex}, transparent 70%)` }} />
        
        <div className="max-w-4xl mx-auto px-6 py-20 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-8 text-xs font-black tracking-widest uppercase rounded-full border shadow-sm" style={{ background: a.glow, borderColor: a.hex, color: a.dark }}>
            🏆 Top {entry.productos.length} Opciones · Actualizado {YEAR}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-slate-900">{entry.titulo_h1}</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">{entry.intro}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <AdSlot format="leaderboard" />

        <section className="mb-20 scroll-mt-24" id="top3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <h2 className="text-3xl font-black text-slate-900">Comparativa Rápida Top 3</h2>
            <span className="text-sm font-bold text-slate-500 bg-slate-200 px-3 py-1.5 rounded-lg">El 70% de {nichoStr} elige aquí</span>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-card bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 text-slate-500 font-bold uppercase tracking-wider text-xs">Rank</th>
                  <th className="px-6 py-5 text-slate-500 font-bold uppercase tracking-wider text-xs">Software</th>
                  <th className="px-6 py-5 text-slate-500 font-bold uppercase tracking-wider text-xs">Nota</th>
                  <th className="px-6 py-5 text-slate-500 font-bold uppercase tracking-wider text-xs text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entry.productos.slice(0,3).map((p, i) => (
                  <tr key={p.slug} className={`transition-colors hover:bg-slate-50 ${i === 0 ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-5 text-3xl text-center w-20">{['🥇','🥈','🥉'][i]}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-base mb-1">{p.nombre}</div>
                      {p.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: a.glow, color: a.dark }}>{p.badge}</span>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-xl" style={{ color: a.hex }}>{p.puntuacion}<span className="text-sm text-slate-400">/5</span></div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <a href={p.url_afiliado} target="_blank" className="btn-primary py-2.5 px-6 text-sm inline-block shadow-md" style={{ background: a.hex }}>
                        Ver Oferta →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <AdSlot format="square" />

        <section className="mt-20">
          <h2 className="text-3xl font-black mb-10 text-slate-900 border-b-2 border-slate-200 pb-4">Análisis a fondo</h2>
          <div className="space-y-12">
            {entry.productos.map((p, i) => (
              <article key={p.slug} id={`p-${p.slug}`} className={`product-card scroll-mt-24 ${i === 0 ? 'product-card-featured ring-2' : ''}`} style={{ '--tw-ring-color': a.hex } as any}>
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg" style={{ background: a.hex }}>{i + 1}</div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{p.nombre}</h3>
                    <p className="text-slate-500 font-bold text-sm">Precios desde: <span className="text-slate-700">{p.precio_desde}</span></p>
                  </div>
                  {p.badge && <span className="ml-auto rating-badge text-sm">{p.badge}</span>}
                </div>
                
                <p className="text-slate-600 mb-8 text-base leading-relaxed">{p.descripcion}</p>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-emerald-50/80 p-6 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="bg-emerald-200 text-emerald-800 w-5 h-5 rounded-full flex items-center justify-center">✓</span> Ventajas
                    </p>
                    <ul className="text-sm space-y-3 text-emerald-900 font-medium">
                      {p.pros.map(pro => <li key={pro} className="flex gap-2"><span>•</span> {pro}</li>)}
                    </ul>
                  </div>
                  <div className="bg-rose-50/80 p-6 rounded-2xl border border-rose-100">
                    <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="bg-rose-200 text-rose-800 w-5 h-5 rounded-full flex items-center justify-center">✗</span> Inconvenientes
                    </p>
                    <ul className="text-sm space-y-3 text-rose-900 font-medium">
                      {p.cons.map(con => <li key={con} className="flex gap-2"><span>•</span> {con}</li>)}
                    </ul>
                  </div>
                </div>
                
                <a href={p.url_afiliado} target="_blank" className="btn-primary block text-center py-4 text-lg shadow-xl" style={{ background: a.hex }}>
                  Ir a la web de {p.nombre} →
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 mb-16">
          <h2 className="text-3xl font-black mb-10 text-slate-900 text-center">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {entry.faq.map((f, i) => (
              <details key={i} className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-all group">
                <summary className="font-bold text-lg text-slate-800 group-open:text-blue-600 transition-colors">{f.pregunta}</summary>
                <p className="mt-4 text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-100">{f.respuesta}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <StickyCTA producto={entry.productos[0]} accent={a.hex} />
      <ExitIntent producto={entry.productos[0]} nicho={niche} accent={a.hex} />
    </div>
  )
}

export default function Page({ params }: { params: { slug?: string[] } }) {
  const r = parseRoute(params.slug)
  if (r.type === '404') return notFound()
  if (r.type === 'home') return <HomePage />
  const entry = getEntry(r.cat, r.niche)
  if (!entry) return notFound()
  return <MatrixPage entry={entry} cat={r.cat} niche={r.niche} />
}
