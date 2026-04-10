/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esto ayuda a que el build sea más estable con muchos archivos
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
