import Link from 'next/link'
import { getEntriesGroupedByCategory, getCategories } from '../lib/matrix'

export const metadata = {
  title: 'El Mejor Software para Cada Profesional | Comparativas B2B España',
  description: 'Encuentra el software perfecto para tu profesión. Comparativas detalladas de CRM, facturación, IA y más, adaptadas a tu sector.',
}

const SECTOR_ICONS: Record<string, string> = {
  salud: '🏥', legal: '⚖️', construccion: '🏗️', finanzas: '💼',
  educacion: '📚', marketing: '📣', tecnologia: '💻', hosteleria: '🍽️',
  logistica: '🚚', inmobiliaria: '🏠', otros: '🔧',
}

export default function HomePage() {
  const grouped   = getEntriesGroupedByCategory()
  const categories = getCategories()
  const totalPages = grouped.reduce((acc, g) => acc + g.entries.length, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <header className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 py-24 px-4">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {totalPages} comparativas · Actualización semanal automática
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            El software perfecto
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              para cada profesional
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Comparativas honestas de {categories.length}+ categorías de software adaptadas
            a las necesidades reales de cada sector profesional en España.
          </p>

          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[
              { label: 'Comparativas',  value: totalPages.toString() },
              { label: 'Categorías',    value: categories.length.toString() },
              { label: 'Sectores',      value: grouped.length.toString() },
              { label: 'Actualización', value: 'Semanal' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 py-3 px-4 overflow-x-auto">
        <div className="flex gap-2 max-w-5xl mx-auto w-max sm:w-auto flex-nowrap sm:flex-wrap">
          {categories.map(cat => (
            <a
              key={cat.slug}
              href={`#cat-${cat.slug}`}
              className="text-sm px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {cat.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        {grouped.map(group => (
          <section key={group.categoria.slug} id={`cat-${group.categoria.slug}`}>

            <div className="flex items-end justify-between mb-8 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-white">{group.categoria.label}</h2>
                <p className="text-gray-400 text-sm mt-1">{group.categoria.description}</p>
              </div>
              <span className="text-sm text-gray-600 flex-shrink-0 ml-4">
                {group.entries.length} comparativas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.entries.map(entry => {
                const href = `/mejor-${entry.slug.replace('--', '-para-')}`
                return (
                  <Link
                    key={entry.slug}
                    href={href}
                    className="group flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-3.5 transition-all duration-150"
                  >
                    <span className="text-xl flex-shrink-0" aria-hidden="true">
                      {SECTOR_ICONS['otros']}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                        {group.categoria.label} para {entry.nichoLabel}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">Ver comparativa →</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}

        {grouped.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <p className="text-5xl mb-4">🤖</p>
            <p className="text-lg">El cerebro está generando el primer lote de comparativas.</p>
            <p className="text-sm mt-2">Vuelve en unos minutos después del primer GitHub Actions run.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 py-10 px-4 text-center text-sm text-gray-600">
        <p>
          Comparativas actualizadas automáticamente cada semana · Los enlaces de afiliado están marcados con{' '}
          <code className="bg-gray-800 px-1 rounded text-xs">rel="sponsored"</code>
        </p>
      </footer>
    </div>
  )
}
