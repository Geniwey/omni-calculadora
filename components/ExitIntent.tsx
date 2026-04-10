'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ThemeClasses } from '@/lib/themes'
import type { Product } from '@/lib/matrix'

type Props = {
  producto: Product
  nicho: string
  t: ThemeClasses
}

// Solo se muestra una vez por sesión
const SESSION_KEY = 'exit_intent_shown'

export default function ExitIntent({ producto, nicho, t }: Props) {
  const [open, setOpen]         = useState(false)
  const hasShown                = useRef(false)
  const lastScrollY             = useRef(0)
  const scrollVelocity          = useRef<number[]>([])

  const show = useCallback(() => {
    if (hasShown.current) return
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return
    hasShown.current = true
    sessionStorage?.setItem(SESSION_KEY, '1')
    setOpen(true)
  }, [])

  useEffect(() => {
    // ── DESKTOP: exit intent por movimiento del ratón hacia el borde superior
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 20) show()
    }

    // ── MÓVIL: scroll rápido hacia arriba detecta intención de salida
    const onScroll = () => {
      const y = window.scrollY
      const delta = lastScrollY.current - y
      scrollVelocity.current.push(delta)
      if (scrollVelocity.current.length > 5) scrollVelocity.current.shift()

      const avgVelocity = scrollVelocity.current.reduce((a, b) => a + b, 0) / scrollVelocity.current.length
      // Scroll hacia arriba rápido (> 40px/frame de promedio) = quiere salir
      if (avgVelocity > 40 && y < 300) show()
      lastScrollY.current = y
    }

    // Solo activa tras 8 segundos para no molestar a quienes acaban de llegar
    const activationTimer = setTimeout(() => {
      document.addEventListener('mouseleave', onMouseLeave)
      window.addEventListener('scroll', onScroll, { passive: true })
    }, 8000)

    return () => {
      clearTimeout(activationTimer)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [show])

  // Cierra con Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    // Bloquea scroll del body mientras el modal está abierto
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    // Overlay
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oferta especial antes de salir"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Header con color del tema */}
        <div className={`${t.heroBg} px-6 pt-6 pb-8 text-center relative`}>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors ${t.heroSubtext} hover:bg-white/10`}
          >
            ×
          </button>

          <div className="text-3xl mb-2" aria-hidden="true">⚡</div>
          <h2 className={`text-xl font-bold mb-1 ${t.heroText}`}>
            ¡Un momento!
          </h2>
          <p className={`text-sm ${t.heroSubtext}`}>
            Antes de elegir, comprueba si{' '}
            <strong className={t.heroText}>{producto.nombre}</strong>{' '}
            tiene promociones activas para {nicho.replace(/-/g, ' ')} hoy.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Info del producto */}
          <div className={`flex items-center gap-4 p-4 rounded-xl mb-5 ${t.painBg} ${t.painBorder} border`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${t.rankBg}`}>
              1
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white">
                {producto.nombre}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ⭐ {producto.puntuacion}/5 · Desde {producto.precio_desde}
              </p>
            </div>
            {producto.badge && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${t.badgeBg} ${t.badgeText}`}>
                {producto.badge}
              </span>
            )}
          </div>

          {/* Beneficios top */}
          <ul className="space-y-2 mb-5">
            {producto.pros.slice(0, 3).map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                {pro}
              </li>
            ))}
          </ul>

          {/* CTA principal — el más grande posible */}
          <a
            href={producto.url_afiliado}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={() => setOpen(false)}
            className={`block w-full text-center font-bold py-4 px-6 rounded-xl text-base transition-colors mb-3 ${t.ctaBg} ${t.ctaHover} ${t.ctaText}`}
          >
            Ver promociones de {producto.nombre} →
          </a>

          {/* Micro-copy de seguridad */}
          <p className="text-center text-xs text-gray-400">
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>

          {/* Dismiss link */}
          <button
            onClick={() => setOpen(false)}
            className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-3 transition-colors"
          >
            No, gracias. Seguiré buscando.
          </button>
        </div>
      </div>
    </div>
  )
}
