'use client'
import { useEffect, useRef } from 'react'

type AdFormat = 'in-content' | 'leaderboard' | 'sidebar'

type Props = {
  format: AdFormat
  slotId?: string
  className?: string
}

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

    // Cuando tengas AdSense/Monetag, descomentarás los scripts aquí
  }, [slotId, format, config.minHeight])

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
      <div
        ref={containerRef}
        style={{ minHeight: config.minHeight, width: '100%' }}
      />

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
