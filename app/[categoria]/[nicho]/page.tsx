import { notFound } from 'next/navigation';
import { getIndex, getCategoriaData, getNichoData } from '../../../lib/getData';
import AdUnit from '../../../components/AdUnit';

// 1. Generador de URLs masivas (SSG) - Coste 0 en Vercel
export async function generateStaticParams() {
  const index = await getIndex();
  if (!index) return [];
  return index.pairs.map((pair) => ({
    categoria: pair.categoria,
    nicho: pair.nicho,
  }));
}

// 2. Optimizador SEO Automático para Google
export async function generateMetadata({ params }: { params: { categoria: string; nicho: string } }) {
  const categoria = await getCategoriaData(params.categoria);
  const nicho = await getNichoData(params.nicho);
  if (!categoria || !nicho) return {};

  return {
    title: `Mejor ${categoria.nombre} para ${nicho.nombre} en ${new Date().getFullYear()}`,
    description: `Descubre y compara el mejor ${categoria.nombreCompleto} diseñado específicamente para ${nicho.nombre.toLowerCase()}. Opiniones, precios y ventajas.`,
  };
}

// 3. El Diseño de la Página (La Matriz)
export default async function Page({ params }: { params: { categoria: string; nicho: string } }) {
  const categoria = await getCategoriaData(params.categoria);
  const nicho = await getNichoData(params.nicho);

  if (!categoria || !nicho) notFound();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      
      {/* Cabecera SEO */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-brand-900 leading-tight mb-4">
          Mejor {categoria.nombre} para <span className="text-brand-500">{nicho.nombre}</span>
        </h1>
        <p className="text-xl text-slate-600 font-medium">
          La guía definitiva para profesionales del sector: {nicho.sectorProfesional}.
        </p>
      </header>

      {/* Anuncio Superior (Alta visibilidad) */}
      <AdUnit slot="Banner Superior" />

      {/* Caja de Empatía (Convence al usuario de que la web es experta en su nicho) */}
      <section className="bg-white border-l-4 border-brand-500 shadow-md rounded-r-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          ¿Por qué un {nicho.nombreSingular} necesita {categoria.nombreCompleto}?
        </h2>
        <ul className="space-y-3">
          {nicho.painPoints.map((point: string, i: number) => (
            <li key={i} className="flex items-start text-slate-700 text-lg">
              <span className="text-brand-500 mr-3 font-bold">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* Reseñas y Enlaces de Afiliado (Donde está el dinero) */}
      <section>
        <h2 className="text-3xl font-black text-slate-900 mb-8">
          Comparativa y Recomendaciones
        </h2>
        
        {categoria.productos.map((producto: any, i: number) => (
          <article key={producto.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-10 transform transition duration-300 hover:shadow-xl">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-brand-50 text-brand-900 font-black text-sm rounded-full mb-3 uppercase tracking-wide">
                  #{i + 1} {i === 0 ? '— Nuestra Elección' : ''}
                </span>
                <h3 className="text-3xl font-bold text-slate-900">{producto.nombre}</h3>
                <p className="text-slate-500 mt-2 text-lg">{producto.descripcion}</p>
              </div>
              <div className="mt-4 md:mt-0 md:text-right bg-slate-50 p-4 rounded-xl">
                <div className="text-3xl font-black text-green-600">{producto.puntuacion}/5</div>
                <div className="text-sm font-bold text-slate-500 mt-1">{producto.precio}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                <p className="font-bold text-green-800 mb-3 text-lg">✅ Lo mejor</p>
                {producto.ventajas.map((v: string, j: number) => (
                  <p key={j} className="text-green-700 mb-1">• {v}</p>
                ))}
              </div>
              <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                <p className="font-bold text-red-800 mb-3 text-lg">⚠️ A tener en cuenta</p>
                {producto.desventajas.map((d: string, j: number) => (
                  <p key={j} className="text-red-700 mb-1">• {d}</p>
                ))}
              </div>
            </div>

            {/* BOTÓN MÁGICO DE AFILIADO */}
            <a 
              href={producto.afiliado.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-black text-xl py-4 rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              Probar {producto.nombre} Ahora
            </a>
          </article>
        ))}
      </section>

      {/* Anuncio Inferior */}
      <AdUnit slot="Banner Inferior" />

    </main>
  );
}
