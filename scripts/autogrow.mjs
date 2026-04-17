import Groq from 'groq-sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MATRIX_DIR = path.join(ROOT, 'data', 'matrix');
const CATS_PATH = path.join(ROOT, 'data', 'categories.json');
const NICHES_PATH = path.join(ROOT, 'data', 'niches.json');

const SYSTEM_PROMPT = `Eres un experto en SEO y marketing B2B en España. Tu objetivo es ayudar a profesionales a elegir software. 
REGLAS:
- No parezcas una IA. Usa un tono directo, profesional y humano.
- Los productos deben ser REALES y conocidos en España.
- Los "pain points" deben ser problemas reales de cada profesión.
- Responde ÚNICAMENTE con un objeto JSON válido.`;

async function generateEntry(cat, niche) {
  const prompt = `Genera una comparativa SEO: "Mejor ${cat.label} para ${niche.name}".
  
  Devuelve este JSON exacto:
  {
    "categoria": "${cat.slug}",
    "nicho": "${niche.slug}",
    "titulo_h1": "Los 4 mejores ${cat.label} para ${niche.name} en 2026",
    "meta_title": "Mejor ${cat.label} para ${niche.name} 2026 | Comparativa y Opiniones",
    "meta_description": "Análisis de los 4 mejores ${cat.label} diseñados para ${niche.name}. Ahorra tiempo y dinero con la herramienta adecuada para tu sector.",
    "intro": "Como ${niche.name}, necesitas un ${cat.label} que se adapte a tu flujo de trabajo y no al revés.",
    "pain_points": ["Problema real 1", "Problema real 2", "Problema real 3"],
    "theme": { "colorPrincipal": "${niche.theme?.colorPrincipal || 'blue'}" },
    "productos": [
      {
        "nombre": "Nombre Real",
        "slug": "slug-real",
        "puntuacion": 4.8,
        "precio_desde": "X€/mes",
        "descripcion": "Ideal para ${niche.name} por su facilidad de uso.",
        "pros": ["Ventaja 1", "Ventaja 2"],
        "cons": ["Contra 1"],
        "url_afiliado": "https://example.com",
        "badge": "Recomendado"
      }
    ],
    "faq": [
      { "pregunta": "Duda real de un ${niche.name}", "respuesta": "Explicación clara." },
      { "pregunta": "Segunda duda frecuente", "respuesta": "Respuesta directa y profesional." }
    ],
    "last_updated": "${new Date().toISOString().split('T')[0]}"
  }
  
  IMPORTANTE: Incluye 4 productos reales del mercado.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
}

async function main() {
  console.log("🚀 Iniciando AutoGrow V3...");
  const cats = JSON.parse(await fs.readFile(CATS_PATH, 'utf-8'));
  const niches = JSON.parse(await fs.readFile(NICHES_PATH, 'utf-8'));
  
  await fs.mkdir(MATRIX_DIR, { recursive: true });

  const pending = [];
  for (const c of cats) {
    for (const n of niches) {
      if (n.sector === c.slug) {
        const filename = `${c.slug}--${n.slug}.json`;
        try {
          await fs.access(path.join(MATRIX_DIR, filename));
        } catch {
          pending.push({ c, n });
        }
      }
    }
  }

  if (pending.length === 0) {
    console.log("✅ Todo el contenido ya está generado.");
    return;
  }

  const batch = pending.sort(() => Math.random() - 0.5).slice(0, 3);
  
  for (const item of batch) {
    console.log(`📝 Generando: ${item.c.slug} para ${item.n.slug}`);
    try {
        const entry = await generateEntry(item.c, item.n);
        await fs.writeFile(
          path.join(MATRIX_DIR, `${item.c.slug}--${item.n.slug}.json`),
          JSON.stringify(entry, null, 2)
        );
        console.log(`✅ Guardado: ${item.c.slug}--${item.n.slug}.json`);
    } catch (e) {
        console.error(`❌ Error en ${item.c.slug}--${item.n.slug}:`, e.message);
    }
  }
}

main().catch(console.error);
