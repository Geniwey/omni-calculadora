'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

export type Product = {
  nombre: string
  slug: string
  puntuacion: number
  precio_desde: string
  descripcion: string
  pros: string[]
  cons: string[]
  url_afiliado: string
  badge?: string
}

export function StickyCTA({
  producto,
  accent,
}: {
  producto: Product
  accent: string
}) {
  const [show, setShow] = useState(false)
  const [gone, setGone] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 5000)
    const onScroll = () => {
      if (window.scrollY > 500) setShow(true)
      lastY.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [])

  if (!show || gone) return null

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 p-3 bg-[#0f0f0f]/95 backdrop-blur border-t border-[#1f1f1f]">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#666] leading-none mb-0.5">Mejor valorado</p>
          <p className="text-sm font-semibold text-white truncate">{producto.nombre}</p>
          <p className="text-[11px] text-[#888]">{producto.precio_desde} · ★ {producto.puntuacion}</p>
        </div>
        <a
          href={producto.url_afiliado}
          target="_blank"
          rel="sponsored noopener noreferrer"
          style={{ backgroundColor: accent }}
          className="flex-shrink-0 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
        >
          Probar →
        </a>
        <button
          onClick={() => setGone(true)}
          className="text-[#555] hover:text-[#888] text-xl leading-none w-7 h-7 flex items-center justify-center"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  )
}

const SK = 'ei_shown'
export function ExitIntent({
  producto,
  nicho,
  accent,
}: {
  producto: Product
  nicho: string
  accent: string
}) {
  const [open, setOpen] = useState(false)
  const fired = useRef(false)

  const fire = useCallback(() => {
    if (fired.current) return
    if (typeof window !== 'undefined' && sessionStorage.getItem(SK)) return
    fired.current = true
    sessionStorage.setItem(SK, '1')
    setOpen(true)
  }, [])

  useEffect(() => {
    const activate = setTimeout(() => {
      const onLeave = (e: MouseEvent) => { if (e.clientY <= 15) fire() }
      let ly = 0
      const onScroll = () => {
        const y = window.scrollY
        if (ly - y > 120 && y < 400) fire()
        ly = y
      }
      document.addEventListener('mouseleave', onLeave)
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        document.removeEventListener('mouseleave', onLeave)
        window.removeEventListener('scroll', onScroll)
      }
    }, 10_000)
    return () => clearTimeout(activate)
  }, [fire])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-sm bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 pt-6 pb-5 text-center border-b border-[#1a1a1a]">
          <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-[#555] hover:text-[#888] text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1a1a1a]">×</button>
          <div className="text-3xl mb-2">⚡</div>
          <h2 className="text-lg font-bold text-white">¡Un momento!</h2>
          <p className="text-sm text-[#888] mt-1">Comprueba si <strong className="text-white">{producto.nombre}</strong> tiene promoción activa para {nicho.replace(/-/g, ' ')} hoy.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <ul className="space-y-2">
            {producto.pros.slice(0, 3).map((pro, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#ccc]"><span className="text-emerald-400 flex-shrink-0">✓</span>{pro}</li>
            ))}
          </ul>
          <a
            href={producto.url_afiliado}
            target="_blank"
            rel="sponsored noopener noreferrer"
            style={{ backgroundColor: accent }}
            className="block w-full text-center font-bold py-3.5 rounded-xl text-white text-sm"
            onClick={() => setOpen(false)}
          >
            Ver ofertas de {producto.nombre} →
          </a>
          <p className="text-center text-[11px] text-[#555]">Sin tarjeta · Cancela cuando quieras</p>
          <button onClick={() => setOpen(false)} className="block w-full text-center text-xs text-[#444] hover:text-[#666]">No gracias, seguiré buscando</button>
        </div>
      </div>
    </div>
  )
}
