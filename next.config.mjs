/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sin alias @/ — usamos rutas relativas simples, cero errores de resolución
  images: {
    unoptimized: true, // gratis en Vercel Hobby
  },
  // Silencia el aviso de tamaño de build en páginas grandes
  experimental: {
    largePageDataBytes: 512 * 1024,
  },
}

export default nextConfig
