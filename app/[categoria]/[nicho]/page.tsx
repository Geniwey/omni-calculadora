import { Metadata }    from 'next'
import { notFound }    from 'next/navigation'
import { getAllMatrixSlugs, getMatrixEntry, getCategories, type Product } from '@/lib/matrix'
import { getTheme }    from '@/lib/themes'
import StickyCTA       from '@/components/StickyCTA'
import ComparisonTable from '@/components/ComparisonTable'
import ExitIntent      from '@/components/ExitIntent'
import AdUnit          from '@/components/AdUnit'

type Props = { params: { categoria: string; nicho: string } }

// ─── SSG ─────────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return getAllMatrixSlugs()
}

// ─── SEO por página ───────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getMatrixEntry(params.categoria, params.nicho)
  if (!entry) return {}

  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tusitio.com'}/mejor-${params.categoria}-para-${params.nicho}`

  return {
    title:       entry.meta_title,
    description: entry.meta_description,
    alternates:  { canonical: url },
    openGraph: {
      title:       entry.meta_title,
      description: entry.meta_description,
      url,
      type:        'article',
    },
    robots: entry.productos.length >= 2 ? 'index, follow' : 'noindex',
  }
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────
function Breadcrumbs({
  categoriaSlug,
  categoriaLabel,
  nichoLabel,
  t,
}: {
  categoriaSlug:  string
  categoriaLabel: string
  nichoLabel:     string
  t: ReturnType<typeof getTheme>
}) {
  const crumbs = [
    { label: 'Inicio',        href: '/' },
    { label: categoriaLabel,  href: `/#cat-${categoriaSlug}` },
    { label: nichoLabel,      href: null },
  ]

  // JSON-LD para BreadcrumbList (mejora el rich snippet en Google)
  const breadcrumbLd = {
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    itemListElement:   crumbs.map((c, i) => ({
      '@type':   'ListItem',
      position:  i + 1,
      name:      c.label,
      ...(c.href ? { item: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tusitio.com'}${c.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <nav
        aria-label="Ruta de navegación"
        className="max-w-4xl mx-auto px-4 pt-4 pb-0"
      >
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          {crumbs.map((crumb, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="opacity-40 select-none">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className={`hover:underline transition-colors ${t.accentText}`}
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[180px]"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

// ─── Tabla de contenidos ──────────────────────────────────────────────────
function TableOfContents({
  productos,
  t,
}: {
  productos: Product[]
  t: ReturnType<typeof getTheme>
}) {
  return (
    <aside
      aria-label="Tabla de contenidos"
      className={`rounded-2xl border p-5 mb-10 ${t.painBg} ${t.painBorder}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${t.accentText}`}>
        En esta página
      </p>
      <ol className="space-y-2">
        <li>
          <a
            href="#comparativa-rapida"
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:underline group"
          >
            <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 font-semibold ${t.rankBg} text-white`}>
              ★
            </span>
            Comparativa rápida Top 3
          </a>
        </li>
        {productos.map((p, i) => (
          <li key={p.slug}>
            <a
              href={`#producto-${p.slug}`}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:underline group"
            >
              <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 font-semibold ${t.rankBg} text-white`}>
                {i + 1}
              </span>
              <span className="truncate">{p.nombre}</span>
              {p.badge && (
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${t.badgeBg} ${t.badgeText}`}>
                  {p.badge}
                </span>
              )}
            </a>
          </li>
        ))}
        <li>
          <a
            href="#preguntas-frecuentes"
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:underline"
          >
            <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 font-semibold ${t.rankBg} text-white`}>
              ?
            </span>
            Preguntas frecuentes
          </a>
        </li>
      </ol>
    </aside>
  )
}

// ─── Barra de estrellas ───────────────────────────────────────────────────
function StarBar({
  score,
  accentBg,
}: {
  score:    number
  accentBg: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5" role="img" aria-label={`${score} de 5`}>
        {[1, 2, 3, 4, 5].map(n => (
          <div
            key={n}
            className={`h-1.5 w-4 rounded-full ${
              n <= Math.round(score) ? accentBg : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{score}/5</span>
    </div>
  )
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────
function ProductCard({
  producto,
  rank,
  t,
}: {
  producto: Product
  rank:     number
  t:        ReturnType<typeof getTheme>
}) {
  // Extrae el color base del rankBg para reutilizarlo en la barra
  // e.g. "bg-blue-600" → "bg-blue-600"
  const accentBg = t.rankBg

  return (
    <article
      id={`producto-${producto.slug}`}
      // scroll-mt para que el anchor no quede tapado por navbars sticky
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200 scroll-mt-6"
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full ${t.rankBg} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}
            aria-hidden="true"
          >
            {rank}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
              {producto.nombre}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Desde {producto.precio_desde}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {producto.badge && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t.badgeBg} ${t.badgeText}`}>
              {producto.badge}
            </span>
          )}
          <StarBar score={producto.puntuacion} accentBg={accentBg} />
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-5 leading-relaxed">
        {producto.descripcion}
      </p>

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${t.accentText}`}>
            Ventajas
          </p>
          <ul className="space-y-1.5">
            {producto.pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">
            Inconvenientes
          </p>
          <ul className="space-y-1.5">
            {producto.cons.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true">–</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <a
        href={producto.url_afiliado}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className={`block w-full text-center font-semibold py-3 px-6 rounded-xl transition-colors duration-150 ${t.ctaBg} ${t.ctaHover} ${t.ctaText}`}
      >
        Probar {producto.nombre} gratis →
      </a>
    </article>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────
export default function MatrixPage({ params }: Props) {
  const entry = getMatrixEntry(params.categoria, params.nicho)
  if (!entry) notFound()

  const t              = getTheme(entry.theme)
  const winner         = entry.productos[0]
  const nichoLabel     = params.nicho.replace(/-/g, ' ')
  const categoriaLabel = params.categoria.replace(/-/g, ' ')

  // Obtiene el label legible de la categoría desde el JSON maestro
  const categories     = getCategories()
  const catMeta        = categories.find(c => c.slug === params.categoria)
  const categoriaFull  = catMeta?.label ?? categoriaLabel

  // ── Schema.org ────────────────────────────────────────────────────────
  const jsonLd = {
    '@context':      'https://schema.org',
    '@type':         'ItemList',
    name:            entry.titulo_h1,
    description:     entry.meta_description,
    numberOfItems:   entry.productos.length,
    itemListElement: entry.productos.map((p, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      name:       p.nombre,
      description: p.descripcion,
      url:        p.url_afiliado,
    })),
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: entry.faq.map(item => ({
      '@type': 'Question',
      name:    item.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ── Breadcrumbs (incluye su propio JSON-LD) ─────────────────── */}
      <Breadcrumbs
        categoriaSlug={params.categoria}
        categoriaLabel={categoriaFull}
        nichoLabel={nichoLabel}
        t={t}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className={`${t.heroBg} ${t.heroText} py-14 px-4 mt-2`}>
        <div className="max-w-4xl mx-auto">
          <div className={`inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${t.badgeBg} ${t.badgeText}`}>
            Comparativa {new Date().getFullYear()}
          </div>
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 ${t.heroText}`}>
            {entry.titulo_h1}
          </h1>
          <p className={`text-lg leading-relaxed max-w-2xl ${t.heroSubtext}`}>
            {entry.intro}
          </p>
          <div className={`mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${t.heroSubtext}`}>
            <span>✓ {entry.productos.length} herramientas analizadas</span>
            <span className="opacity-40 hidden sm:inline">·</span>
            <span>✓ Precios actualizados</span>
            <span className="opacity-40 hidden sm:inline">·</span>
            <span>✓ Opiniones reales</span>
          </div>
        </div>
      </header>

      {/* ── Leaderboard ad ───────────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-900/50 flex justify-center py-3 px-4 border-b border-gray-100 dark:border-gray-800">
        <AdUnit
          format="leaderboard"
          slotId={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* ── Tabla de contenidos ──────────────────────────────────── */}
        <TableOfContents productos={entry.productos} t={t} />

        {/* ── Comparativa rápida Top 3 ─────────────────────────────── */}
        <div id="comparativa-rapida" className="scroll-mt-6">
          <ComparisonTable productos={entry.productos} t={t} />
        </div>

        {/* ── Pain points ─────────────────────────────────────────── */}
        <div className={`rounded-2xl border p-5 mb-10 ${t.painBg} ${t.painBorder}`}>
          <h2 className={`font-semibold mb-3 ${t.painTitle}`}>
            Problemas habituales sin el software adecuado
          </h2>
          <ul className="space-y-2">
            {entry.pain_points.map((p, i) => (
              <li key={i} className={`flex items-start gap-2 text-sm ${t.painText}`}>
                <span className="mt-0.5 flex-shrink-0 opacity-60" aria-hidden="true">✗</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* ── In-content ad #1 ─────────────────────────────────────── */}
        <div className="flex justify-center mb-10">
          <AdUnit
            format="in-content"
            slotId={process.env.NEXT_PUBLIC_AD_SLOT_INCONTENT_1}
          />
        </div>

        {/* ── Ranking detallado ────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Los mejores {categoriaFull} para {nichoLabel}
        </h2>

        <div className="space-y-6 mb-12">
          {entry.productos.map((producto, i) => (
            <ProductCard
              key={producto.slug}
              producto={producto}
              rank={i + 1}
              t={t}
            />
          ))}
        </div>

        {/* ── In-content ad #2 ─────────────────────────────────────── */}
        <div className="flex justify-center mb-12">
          <AdUnit
            format="in-content"
            slotId={process.env.NEXT_PUBLIC_AD_SLOT_INCONTENT_2}
          />
        </div>

        {/* ── Tabla resumen (texto denso, valioso para SEO) ────────── */}
        <div className="mb-12 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Tabla comparativa de {categoriaFull} para {nichoLabel}
            </caption>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                {['Software', 'Precio', 'Valoración', 'Destacado', 'Enlace'].map(col => (
                  <th
                    key={col}
                    scope="col"
                    className={`px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 ${col === 'Destacado' ? 'hidden sm:table-cell' : ''}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.productos.map((p, i) => (
                <tr
                  key={p.slug}
                  className={`border-t border-gray-100 dark:border-gray-800 ${
                    i % 2 === 0
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-gray-50/50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {p.nombre}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {p.precio_desde}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${t.accentText}`}>{p.puntuacion}/5</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {p.badge
                      ? <span className={`text-xs px-2 py-0.5 rounded-full ${t.tagBg} ${t.tagText}`}>{p.badge}</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={p.url_afiliado}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      className={`text-xs font-semibold underline underline-offset-2 ${t.accentText}`}
                    >
                      Ver ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="preguntas-frecuentes" className="scroll-mt-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {entry.faq.map((item, i) => (
              <details
                key={i}
                className={`rounded-xl border p-5 group cursor-pointer ${t.accentBorder} bg-white dark:bg-gray-900`}
              >
                <summary className="font-medium text-gray-800 dark:text-gray-200 list-none flex justify-between items-center gap-4">
                  <span>{item.pregunta}</span>
                  <span className={`flex-shrink-0 transition-transform duration-200 group-open:rotate-180 ${t.accentText}`}>
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {item.respuesta}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── In-content ad #3 ─────────────────────────────────────── */}
        <div className="flex justify-center mt-10">
          <AdUnit
            format="in-content"
            slotId={process.env.NEXT_PUBLIC_AD_SLOT_INCONTENT_3}
          />
        </div>

        {/* ── Footer de página ─────────────────────────────────────── */}
        <footer className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            Última actualización:{' '}
            {new Date(entry.last_updated).toLocaleDateString('es-ES', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
            {' · '}
            Los enlaces marcados con ↗ pueden ser de afiliado. El precio no varía para el usuario.
          </p>
        </footer>
      </main>

      {/* ── Componentes flotantes (Client Components) ────────────────── */}
      <StickyCTA  producto={winner} t={t} />
      <ExitIntent producto={winner} nicho={params.nicho} t={t} />
    </>
  )
}
