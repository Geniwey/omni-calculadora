export type ThemeKey = 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'teal' | 'indigo' | 'rose'
export type EstiloKey = 'corporativo' | 'creativo' | 'tecnico' | 'premium' | 'minimalista'

export type Theme = { colorPrincipal: ThemeKey; estilo: EstiloKey; icono: string }

type ThemeClasses = {
  heroBg: string; heroText: string; heroSubtext: string; ctaBg: string; ctaHover: string;
  ctaText: string; badgeBg: string; badgeText: string; accentText: string; accentBorder: string;
  painBg: string; painBorder: string; painTitle: string; painText: string; rankBg: string;
  starColor: string; tagBg: string; tagText: string; fontClass: string;
}

export const THEME_MAP: Record<ThemeKey, ThemeClasses> = {
  blue: {
    heroBg: 'bg-blue-950', heroText: 'text-white', heroSubtext: 'text-blue-200', ctaBg: 'bg-blue-600',
    ctaHover: 'hover:bg-blue-500', ctaText: 'text-white', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800',
    accentText: 'text-blue-600', accentBorder: 'border-blue-500', painBg: 'bg-blue-50 dark:bg-blue-950/30',
    painBorder: 'border-blue-200 dark:border-blue-800', painTitle: 'text-blue-900 dark:text-blue-200',
    painText: 'text-blue-700 dark:text-blue-300', rankBg: 'bg-blue-600', starColor: 'text-blue-400',
    tagBg: 'bg-blue-50', tagText: 'text-blue-700', fontClass: 'font-sans',
  },
  indigo: {
    heroBg: 'bg-indigo-950', heroText: 'text-white', heroSubtext: 'text-indigo-200', ctaBg: 'bg-indigo-600',
    ctaHover: 'hover:bg-indigo-500', ctaText: 'text-white', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-800',
    accentText: 'text-indigo-600', accentBorder: 'border-indigo-500', painBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    painBorder: 'border-indigo-200 dark:border-indigo-800', painTitle: 'text-indigo-900 dark:text-indigo-200',
    painText: 'text-indigo-700 dark:text-indigo-300', rankBg: 'bg-indigo-600', starColor: 'text-indigo-400',
    tagBg: 'bg-indigo-50', tagText: 'text-indigo-700', fontClass: 'font-sans',
  },
  purple: {
    heroBg: 'bg-purple-950', heroText: 'text-white', heroSubtext: 'text-purple-200', ctaBg: 'bg-purple-600',
    ctaHover: 'hover:bg-purple-500', ctaText: 'text-white', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800',
    accentText: 'text-purple-600', accentBorder: 'border-purple-500', painBg: 'bg-purple-50 dark:bg-purple-950/30',
    painBorder: 'border-purple-200 dark:border-purple-800', painTitle: 'text-purple-900 dark:text-purple-200',
    painText: 'text-purple-700 dark:text-purple-300', rankBg: 'bg-purple-600', starColor: 'text-purple-400',
    tagBg: 'bg-purple-50', tagText: 'text-purple-700', fontClass: 'font-sans',
  },
  green: {
    heroBg: 'bg-green-950', heroText: 'text-white', heroSubtext: 'text-green-200', ctaBg: 'bg-green-600',
    ctaHover: 'hover:bg-green-500', ctaText: 'text-white', badgeBg: 'bg-green-100', badgeText: 'text-green-800',
    accentText: 'text-green-600', accentBorder: 'border-green-500', painBg: 'bg-green-50 dark:bg-green-950/30',
    painBorder: 'border-green-200 dark:border-green-800', painTitle: 'text-green-900 dark:text-green-200',
    painText: 'text-green-700 dark:text-green-300', rankBg: 'bg-green-600', starColor: 'text-green-400',
    tagBg: 'bg-green-50', tagText: 'text-green-700', fontClass: 'font-sans',
  },
  amber: {
    heroBg: 'bg-amber-950', heroText: 'text-white', heroSubtext: 'text-amber-200', ctaBg: 'bg-amber-500',
    ctaHover: 'hover:bg-amber-400', ctaText: 'text-amber-950', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800',
    accentText: 'text-amber-600', accentBorder: 'border-amber-500', painBg: 'bg-amber-50 dark:bg-amber-950/30',
    painBorder: 'border-amber-200 dark:border-amber-800', painTitle: 'text-amber-900 dark:text-amber-200',
    painText: 'text-amber-700 dark:text-amber-300', rankBg: 'bg-amber-500', starColor: 'text-amber-400',
    tagBg: 'bg-amber-50', tagText: 'text-amber-700', fontClass: 'font-sans',
  },
  red: {
    heroBg: 'bg-red-950', heroText: 'text-white', heroSubtext: 'text-red-200', ctaBg: 'bg-red-600',
    ctaHover: 'hover:bg-red-500', ctaText: 'text-white', badgeBg: 'bg-red-100', badgeText: 'text-red-800',
    accentText: 'text-red-600', accentBorder: 'border-red-500', painBg: 'bg-red-50 dark:bg-red-950/30',
    painBorder: 'border-red-200 dark:border-red-800', painTitle: 'text-red-900 dark:text-red-200',
    painText: 'text-red-700 dark:text-red-300', rankBg: 'bg-red-600', starColor: 'text-red-400',
    tagBg: 'bg-red-50', tagText: 'text-red-700', fontClass: 'font-sans',
  },
  teal: {
    heroBg: 'bg-teal-950', heroText: 'text-white', heroSubtext: 'text-teal-200', ctaBg: 'bg-teal-600',
    ctaHover: 'hover:bg-teal-500', ctaText: 'text-white', badgeBg: 'bg-teal-100', badgeText: 'text-teal-800',
    accentText: 'text-teal-600', accentBorder: 'border-teal-500', painBg: 'bg-teal-50 dark:bg-teal-950/30',
    painBorder: 'border-teal-200 dark:border-teal-800', painTitle: 'text-teal-900 dark:text-teal-200',
    painText: 'text-teal-700 dark:text-teal-300', rankBg: 'bg-teal-600', starColor: 'text-teal-400',
    tagBg: 'bg-teal-50', tagText: 'text-teal-700', fontClass: 'font-sans',
  },
  rose: {
    heroBg: 'bg-rose-950', heroText: 'text-white', heroSubtext: 'text-rose-200', ctaBg: 'bg-rose-600',
    ctaHover: 'hover:bg-rose-500', ctaText: 'text-white', badgeBg: 'bg-rose-100', badgeText: 'text-rose-800',
    accentText: 'text-rose-600', accentBorder: 'border-rose-500', painBg: 'bg-rose-50 dark:bg-rose-950/30',
    painBorder: 'border-rose-200 dark:border-rose-800', painTitle: 'text-rose-900 dark:text-rose-200',
    painText: 'text-rose-700 dark:text-rose-300', rankBg: 'bg-rose-600', starColor: 'text-rose-400',
    tagBg: 'bg-rose-50', tagText: 'text-rose-700', fontClass: 'font-sans',
  },
}

export function getTheme(theme?: Theme | null): ThemeClasses {
  const key = (theme?.colorPrincipal ?? 'blue') as ThemeKey
  return THEME_MAP[key] ?? THEME_MAP.blue
}
