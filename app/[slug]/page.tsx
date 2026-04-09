import calculators from "../../data/calculators.json";
import CalculatorEngine from "../../components/CalculatorEngine";
import { notFound } from "next/navigation";

export default function Page({ params }: { params: { slug: string } }) {
  const calc = calculators.find((c) => c.slug === params.slug);
  if (!calc) notFound();

  return (
    <main className="p-8">
      <a href="/" className="text-blue-500 font-bold underline">← Volver al inicio</a>
      <CalculatorEngine calculator={calc} />
    </main>
  );
}
