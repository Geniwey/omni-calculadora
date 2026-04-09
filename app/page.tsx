import Link from "next/link";
import calculators from "../data/calculators.json";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-black text-center mb-4 text-gray-900 tracking-tight">Omni-Calculadora</h1>
        <p className="text-center text-gray-600 mb-12 text-xl">Todas las herramientas exactas. Cero coste.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calc: any) => (
            <Link href={`/${calc.slug}`} key={calc.slug}>
              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 cursor-pointer h-full group">
                <h2 className="text-2xl font-bold text-blue-600 mb-3 group-hover:text-blue-800">{calc.title}</h2>
                <p className="text-gray-600">{calc.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
