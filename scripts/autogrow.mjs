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

// Función para pausar la ejecución y evitar bloqueos
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateEntry(cat, niche) {
  const prompt = `Genera una comparativa SEO: "Mejor ${cat.label} para ${niche.name || niche.label}".
  
  Devuelve este JSON exacto:
  {
    "categoria": "${cat.slug}",
    "nicho": "${niche.slug}",
    "titulo_h1": "Los 4 mejores ${cat.label} para ${niche.name || niche.label} en 2026",
    "meta_title": "Mejor ${cat.label} para ${niche.name || niche.label} 2026 | Comparativa y Opiniones",
    "meta_description": "Análisis de los 4 mejores ${cat.label} diseñados para ${niche.name || niche.label}. Ahorra tiempo y dinero con la herramienta adecuada para tu sector.",
    "intro": "Como ${niche.name || niche.label}, necesitas un ${cat.label} que se adapte a tu flujo de trabajo y no al revés.",
    "pain_points": ["Problema real 1", "Problema real 2", "Problema real 3"],
    "theme": { "colorPrincipal": "${niche.theme?.colorPrincipal || 'blue'}" },
    "productos": [
      {
        "nombre": "Nombre Real",
        "slug": "slug-real",
        "puntuacion": 4.8,
        "precio_desde": "X€/mes",
        "descripcion": "Ideal para ${niche.name || niche.label} por su facilidad de uso.",
        "pros": ["Ventaja 1", "Ventaja 2"],
        "cons": ["Contra 1"],
        "url_afiliado": "https://example.com",
        "badge": "Recomendado"
      }
    ],
    "faq": [
      { "pregunta": "Duda real de un ${niche.name || niche.label}", "respuesta": "Explicación clara." },
      { "pregunta": "Segunda duda frecuente", "respuesta": "Respuesta directa y profesional." }
    ],
    "last_updated": "${new Date().toISOString().split('T')[0]}"
  }
  
  IMPORTANTE: Incluye 4 productos reales del mercado.`;

  let retries = 3;
  while (retries > 0) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant", // <-- EL MODELO BLINDADO ANTI-CORTES
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      if (error.status === 429) {
        console.warn(`⏳ Límite de Groq detectado. Esperando 10 segundos... (Intentos restantes: ${retries - 1})`);
        await delay(10000);
        retries--;
      } else {
        console.error("❌ Error de la API:", error.message);
        throw error;
      }
    }
  }
  throw new Error("Se superaron los reintentos por exceso de peticiones.");
}

async function main() {
  console.log("🚀 Iniciando AutoGrow V3 BLINDADO PRO...");
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

  // Genera 3 de golpe, cantidad perfecta para no saturar.
  const batch = pending.sort(() => Math.random() - 0.5).slice(0, 3);
  
  for (const item of batch) {
    console.log(`📝 Generando: ${item.c.slug} para ${item.n.slug}`);
    try {
        const entry = await generateEntry(item.c, item.n);
        await fs.writeFile(
          path.join(MATRIX_DIR, `${item.c.slug}--${item.n.slug}.json`),
          JSON.stringify(entry, null, 2)
        );
        console.log(`✅ Guardado exitoso: ${item.c.slug}--${item.n.slug}.json`);
        
        // El seguro de vida: respirar 5 segundos antes de pedir la siguiente
        console.log("⏳ Pausa de 5 segundos de seguridad...");
        await delay(5000);
    } catch (e) {
        console.error(`❌ Error fatal en ${item.c.slug}--${item.n.slug}:`, e.message);
        console.log("⚠️ Saltando al siguiente nicho sin romper el programa...");
    }
  }
  console.log("🎉 Ciclo completado perfectamente.");
}

main().catch(console.error);
