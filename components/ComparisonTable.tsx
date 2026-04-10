import type { ThemeClasses } from '../lib/themes'
import type { Product } from '../lib/matrix'

type Props = {
  productos: Product[]
  t: ThemeClasses
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function ComparisonTable({ productos, t }: Props) {
  const top3 = productos.slice(0, 3)

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Comparativa rápida — Top 3
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          Más del 70% elige aquí
        </span>
      </div>

      <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${t.heroBg} text-left`}>
              <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-widest ${t.heroSubtext}`}>
                Puesto
              </th>
              <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-widest ${t.heroSubtext}`}>
                Software
              </th>
              <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-widest ${t.heroSubtext}`}>
                Valoración
              </th>
              <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-widest ${t.heroSubtext}`}>
                Precio
              </th>
              <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-widest ${t.heroSubtext}`}>
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {top3.map((p, i) => (
              <tr
                key={p.slug}
                className={`border-t border-gray-100 dark:border-gray-800 ${
                  i === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50/50 dark:bg-gray-900/50'
                }`}
              >
                <td className="px-4 py-4 text-xl text-center w-16">
                  {MEDALS[i]}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {p.nombre}
                    </span>
                    {p.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.badgeBg} ${t.badgeText}`}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {p.descripcion}
                  </p>
                </td>

                <td className="px-4 py-4 w-28">
                  <div className="flex flex-col gap-0.5">
                    <span className={`font-bold text-base ${t.accentText}`}>
                      {p.puntuacion}
                      <span className="text-xs text-gray-400 font-normal">/5</span>
                    </span>
                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${t.ctaBg}`}
                        style={{ width: `${(p.puntuacion / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 w-28">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {p.precio_desde}
                  </span>
                </td>

                <td className="px-4 py-4 w-36">
                  <a
                    href={p.url_afiliado}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className={`block text-center text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${t.ctaBg} ${t.ctaHover} ${t.ctaText}`}
                  >
                    {i === 0 ? 'Probar gratis →' : 'Ver oferta →'}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {top3.map((p, i) => (
          <div
            key={p.slug}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              i === 0
                ? `border-2 ${t.accentBorder} bg-white dark:bg-gray-900`
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
            }`}
          >
            <span className="text-2xl w-8 text-center flex-shrink-0">{MEDALS[i]}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {p.nombre}
              </p>
              <p className={`text-xs font-medium ${t.accentText}`}>
                {p.puntuacion}/5 · {p.precio_desde}
              </p>
            </div>
            <a
              href={p.url_afiliado}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${t.ctaBg} ${t.ctaHover} ${t.ctaText}`}
            >
              Probar →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
