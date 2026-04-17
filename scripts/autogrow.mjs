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

// CONFIGURACIÓN DE SEGURIDAD
const MODEL = "llama-3.1-8b-instant"; // Modelo con límites altos
const BATCH_SIZE = 3; // Lote pequeño para evitar errores 429

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Reparador de JSON por si la IA añade texto extra
function cleanJSON(raw) {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return JSON.parse(raw);
    return JSON.parse(raw.slice(start, end + 1));
  } catch (e) {
    throw new Error("La IA no devolvió un JSON válido.");
  }
}

async function generateEntry(cat, niche) {
  const prompt = `Genera una comparativa SEO técnica para "Mejor ${cat.label} para ${niche.name || niche.label}" en España.
  
  Devuelve este JSON exacto:
  {
    "categoria": "${cat.slug}",
    "nicho": "${niche.slug}",
    "titulo_h1": "Los 4 mejores ${cat.label} para ${niche.name || niche.label} en 2026",
    "meta_title": "Mejor ${cat.label} para ${niche.name || niche.label} 2026 | Top 4",
    "meta_description": "Análisis de software para ${niche.name || niche.label}. Comparamos los 4 mejores ${cat.label} del mercado español.",
    "intro": "Para un ${niche.name || niche.label}, elegir el ${cat.label} adecuado es vital.",
    "pain_points": ["Punto de dolor 1", "Punto de dolor 2", "Punto de dolor 3"],
    "theme": { "colorPrincipal": "${niche.theme?.colorPrincipal || 'blue'}" },
    "productos": [
      {
        "nombre": "Software Real",
        "slug": "software-slug",
        "puntuacion": 4.9,
        "precio_desde": "X€/mes",
        "descripcion": "Ideal para ${niche.name || niche.label}.",
        "pros": ["Ventaja 1", "Ventaja 2"],
        "cons": ["Inconveniente 1"],
        "url_afiliado": "https://example.com",
        "badge": "Mejor Valoración"
      }
    ],
    "faq": [
      { "pregunta": "¿Es fácil de usar?", "respuesta": "Sí, para un ${niche.name || niche.label} es intuitivo." }
    ],
    "last_updated": "${new Date().toISOString().split('T')[0]}"
  }
  
  REGLA: Incluye 4 productos reales y 3 FAQs.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "Eres experto en SEO B2B. Responde SOLO con el objeto JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    return cleanJSON(completion.choices[0].message.content);
  } catch (error) {
    if (error.status === 429) {
      // Si el error pide esperar demasiado, lanzamos un error especial para abortar el lote
      const waitTime = error.headers?.['retry-after'] || 10;
      console.warn(`⏳ Groq saturado. Tiempo sugerido: ${waitTime}s.`);
      if (parseInt(waitTime) > 60) throw new Error("STOP_BATCH");
      throw error;
    }
    throw error;
  }
}

async function main() {
  console.log(`🚀 Iniciando AutoGrow V3.1 con motor ${MODEL}...`);
  
  const cats = JSON.parse(await fs.readFile(CATS_PATH, 'utf-8'));
  const niches = JSON.parse(await fs.readFile(NICHES_PATH, 'utf-8'));
  
  await fs.mkdir(MATRIX_DIR, { recursive: true });

  const pending = [];
  for (const c of cats) {
    for (const n of niches) {
      if (n.sector === c.slug) {
        const key = `${c.slug}--${n.slug}`;
        try {
          await fs.access(path.join(MATRIX_DIR, `${key}.json`));
        } catch {
          pending.push({ c, n });
        }
      }
    }
  }

  if (pending.length === 0) {
    console.log("✅ Web al 100%. No hay más páginas que crear.");
    return;
  }

  const batch = pending.sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE);
  console.log(`📦 Lote actual: ${batch.length} páginas.`);

  for (const item of batch) {
    const key = `${item.c.slug}--${item.n.slug}`;
    console.log(`📝 Procesando: ${key}`);
    
    try {
      const entry = await generateEntry(item.c, item.n);
      await fs.writeFile(
        path.join(MATRIX_DIR, `${key}.json`),
        JSON.stringify(entry, null, 2)
      );
      console.log(`✅ Guardado con éxito.`);
      await delay(5000); // Respiro de 5 segundos entre llamadas
    } catch (e) {
      if (e.message === "STOP_BATCH") {
        console.warn("🛑 Límite de Groq excedido. Parando ejecución para evitar bloqueos largos.");
        break;
      }
      console.error(`❌ Fallo en ${key}:`, e.message);
    }
  }
  console.log("🏁 Proceso terminado.");
}

main().catch(console.error);
