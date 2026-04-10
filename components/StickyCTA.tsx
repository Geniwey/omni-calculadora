'use client'
import { useState, useEffect, useRef } from 'react'
import type { ThemeClasses } from '../lib/themes'
import type { Product } from '../lib/matrix'

type Props = {
  producto: Product
  t: ThemeClasses
}

export default function StickyCTA({ producto, t }: Props) {
  const [visible, setVisible]   = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const lastScrollY = useRef(0)
  const timerRef    = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(true), 4000)

    const onScroll = () => {
      const y = window.scrollY
      if (y > 400) setVisible(true)
      if (y < lastScrollY.current - 80) setVisible(true)
      lastScrollY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timerRef.current)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (dismissed || !visible) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-0.5">
            Mejor valorado
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {producto.nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {producto.precio_desde} · ⭐ {producto.puntuacion}/5
          </p>
        </div>

        <a
          href={producto.url_afiliado}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className={`flex-shrink-0 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors ${t.ctaBg} ${t.ctaHover} ${t.ctaText}`}
        >
          Probar gratis →
        </a>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
