'use client'
import { useEffect, useRef } from 'react'

type AdFormat = 'in-content' | 'leaderboard' | 'sidebar'

type Props = {
  format: AdFormat
  // Pega aquí el ID de slot de AdSense, Monetag o Adsterra cuando los tengas
  slotId?: string
  className?: string
}

// Dimensiones estándar IAB para cada formato
// Están fijadas para que el layout no salte cuando carga el anuncio (CLS = 0)
const FORMAT_CONFIG: Record<AdFormat, {
  label: string
  minHeight: number
  maxWidth?: string
  aspectHint: string
}> = {
  'in-content': {
    label:      'In-content (cuadrado)',
    minHeight:  250,
    maxWidth:   '336px',
    aspectHint: '300×250 o 336×280',
  },
  'leaderboard': {
    label:      'Leaderboard (horizontal)',
    minHeight:  90,
    maxWidth:   '728px',
    aspectHint: '728×90 o 970×90',
  },
  'sidebar': {
    label:      'Sidebar',
    minHeight:  600,
    maxWidth:   '300px',
    aspectHint: '300×600',
  },
}

export default function AdUnit({ format, slotId, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const config = FORMAT_CONFIG[format]

  useEffect(() => {
    if (!slotId || !containerRef.current) return

    // ──────────────────────────────────────────────────────────────────────
    // INSTRUCCIONES DE INTEGRACIÓN (descomenta el bloque de tu red):
    //
    // ── ADSENSE ──────────────────────────────────────────────────────────
    // 1. Añade en app/layout.tsx dentro de <head>:
    //    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous" />
    // 2. Descomenta el bloque AdSense de abajo y pon tu data-ad-slot.
    //
    // ── MONETAG ──────────────────────────────────────────────────────────
    // 1. En el dashboard de Monetag, crea un "Banner" y copia el script.
    // 2. Descomenta el bloque Monetag de abajo, pega el src del script.
    //
    // ── ADSTERRA ─────────────────────────────────────────────────────────
    // 1. En Adsterra, crea un "Display Banner" y copia el key.
    // 2. Descomenta el bloque Adsterra de abajo.
    // ──────────────────────────────────────────────────────────────────────

    // ── BLOQUE ADSENSE (descomenta cuando tengas aprobación) ─────────────
    /*
    const ins = document.createElement('ins')
    ins.className             = 'adsbygoogle'
    ins.style.display         = 'block'
    ins.style.width           = '100%'
    ins.style.height          = `${config.minHeight}px`
    ins.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX')
    ins.setAttribute('data-ad-slot',   slotId)
    ins.setAttribute('data-ad-format', format === 'leaderboard' ? 'horizontal' : 'rectangle')
    ins.setAttribute('data-full-width-responsive', 'true')
    containerRef.current.appendChild(ins)
    ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
    ;(window as any).adsbygoogle.push({})
    */

    // ── BLOQUE MONETAG (descomenta cuando tengas aprobación) ─────────────
    /*
    const script = document.createElement('script')
    script.src   = `https://alwingulla.com/88/tag.min.js`  // reemplaza con tu URL
    script.setAttribute('data-zone', slotId)
    script.async = true
    containerRef.current.appendChild(script)
    */

    // ── BLOQUE ADSTERRA (descomenta cuando tengas aprobación) ────────────
    /*
    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src   = `//pl${slotId}.highcpmgate.com/invoke.js`  // reemplaza con tu URL
    containerRef.current.appendChild(script)
    */

  }, [slotId, format, config.minHeight])

  // Si no hay slotId configurado: muestra un placeholder visible en desarrollo
  // que indica qué ad irá aquí (desaparece en producción cuando haya slotId)
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div
      className={`ad-unit-wrapper overflow-hidden ${className}`}
      style={{
        maxWidth: config.maxWidth ?? '100%',
        margin:   format === 'in-content' ? '0 auto' : undefined,
      }}
      aria-label="Publicidad"
      role="complementary"
    >
      {/* Contenedor real donde se inyecta el script del anuncio */}
      <div
        ref={containerRef}
        style={{ minHeight: config.minHeight, width: '100%' }}
      />

      {/* Placeholder solo en desarrollo — NO se renderiza en producción */}
      {isDev && !slotId && (
        <div
          className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center px-4"
          style={{ minHeight: config.minHeight, width: '100%' }}
        >
          <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
            AD SLOT — {config.label}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            {config.aspectHint}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            Añade <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">slotId</code> para activar
          </p>
        </div>
      )}
    </div>
  )
}
