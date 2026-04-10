// scripts/autogrow.mjs — versión con manejo de errores robusto
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MATRIX_DIR = path.join(__dirname, '..', 'data', 'matrix')
const CATEGORIES_PATH = path.join(__dirname, '..', 'data', 'categories.json')
const NICHES_PATH = path.join(__dirname, '..', 'data', 'niches.json')

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const BATCH_SIZE = 10

// ─── Helpers de log con prefijos claros para leer en Actions ───────────────
const log = {
  info:    (...a) => console.log('ℹ️ [INFO]   ', ...a),
  ok:      (...a) => console.log('✅ [OK]     ', ...a),
  warn:    (...a) => console.warn('⚠️ [WARN]   ', ...a),
  error:   (...a) => console.error('❌ [ERROR]  ', ...a),
  section: (...a) => console.log('\n──────────────────────────────────────\n🔷', ...a),
}

// ─── Guard: falla RÁPIDO si falta la API key ────────────────────────────────
// Sin este check el script corre 10 iteraciones, falla en cada fetch
// y sale con exit 0 porque el catch del loop no relanza
if (!GROQ_API_KEY) {
  log.error('GROQ_API_KEY no está definida.')
  log.error('→ Ve a tu repo: Settings → Secrets → Actions → New secret')
  log.error('→ Nombre: GROQ_API_KEY  |  Valor: gsk_xxxx...')
  process.exit(1) // <-- exit 1 marca el step como FAILED en Actions
}

// ─── Llamada a Groq con diagnóstico completo ────────────────────────────────
async function callGroq(prompt) {
  log.info('Llamando a Groq API...')

  let res
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres experto en SEO programático B2B. Respondes SOLO con JSON válido, sin markdown, sin explicaciones.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })
  } catch (networkErr) {
    // fetch() lanza aquí si no hay red, DNS falla, timeout, etc.
    throw new Error(`Red/DNS: no se pudo conectar a Groq. Detalle: ${networkErr.message}`)
  }

  // ── Diagnóstico por código HTTP ──────────────────────────────────────────
  if (!res.ok) {
    const body = await res.text().catch(() => '(cuerpo ilegible)')

    const hint = {
      401: '→ API key inválida o revocada. Genera una nueva en console.groq.com',
      403: '→ Sin permiso para este modelo. Prueba con llama3-8b-8192',
      429: '→ Rate limit alcanzado. Sube el delay entre llamadas o reduce BATCH_SIZE',
      500: '→ Error interno de Groq. Reintenta en unos minutos',
      503: '→ Groq en mantenimiento. Consulta status.groq.com',
    }[res.status] ?? '→ Error desconocido'

    throw new Error(
      `HTTP ${res.status} ${res.statusText}\n` +
      `  ${hint}\n` +
      `  Respuesta: ${body.slice(0, 300)}`
    )
  }

  const data = await res.json().catch(parseErr => {
    throw new Error(`Groq devolvió HTTP 200 pero el body no es JSON: ${parseErr.message}`)
  })

  const raw = data?.choices?.[0]?.message?.content
  if (!raw) {
    throw new Error(
      `Groq respondió OK pero sin contenido.\n` +
      `  Respuesta completa: ${JSON.stringify(data).slice(0, 300)}`
    )
  }

  log.ok(`Groq respondió (${raw.length} chars)`)
  return raw
}

// ─── Parse defensivo del JSON que devuelve el LLM ──────────────────────────
function parseGroqJson(raw, key) {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // Vuelca el texto para que puedas ver exactamente qué escupió el LLM
    log.error(`JSON inválido recibido para "${key}":`)
    log.error('── Inicio del texto recibido ──')
    console.error(cleaned.slice(0, 500))
    log.error('── Fin (500 chars) ──')
    throw new Error(`JSON.parse falló: ${e.message}`)
  }
}

// ─── Validación estructural mínima ─────────────────────────────────────────
function validateEntry(entry, key) {
  const required = ['titulo_h1', 'meta_title', 'meta_description', 'intro', 'productos', 'faq']
  const missing = required.filter(f => !entry[f])
  if (missing.length > 0) {
    throw new Error(`Campos ausentes en "${key}": ${missing.join(', ')}`)
  }
  if (!Array.isArray(entry.productos) || entry.productos.length < 2) {
    throw new Error(`"${key}" tiene menos de 2 productos (recibidos: ${entry.productos?.length ?? 0})`)
  }
}

// ─── Generación de una entrada ─────────────────────────────────────────────
async function generateEntry(categoria, nicho) {
  const prompt = `
Genera una página de comparativa SEO para "mejor ${categoria.label} para ${nicho.label}".

Devuelve EXACTAMENTE este JSON (sin markdown, sin texto extra):
{
  "categoria": "${categoria.slug}",
  "nicho": "${nicho.slug}",
  "titulo_h1": "El Mejor ${categoria.label} para ${nicho.label} en 2025",
  "meta_title": "Mejor ${categoria.label} para ${nicho.label} 2025 | Top 4",
  "meta_description": "Descubre los 4 mejores ${categoria.label} para ${nicho.label}. Comparativa de funciones, precios y opiniones. Guía 2025.",
  "intro": "2-3 frases explicando por qué ${nicho.label} necesitan ${categoria.label}",
  "pain_points": ["problema 1", "problema 2", "problema 3"],
  "productos": [
    {
      "nombre": "nombre real",
      "slug": "slug",
      "puntuacion": 4.7,
      "precio_desde": "X€/mes",
      "descripcion": "beneficio específico para ${nicho.label}",
      "pros": ["ventaja 1", "ventaja 2", "ventaja 3"],
      "cons": ["inconveniente 1", "inconveniente 2"],
      "url_afiliado": "https://example.com",
      "badge": "Más popular"
    }
  ],
  "faq": [
    {"pregunta": "pregunta real", "respuesta": "respuesta experta"},
    {"pregunta": "pregunta 2", "respuesta": "respuesta 2"},
    {"pregunta": "pregunta 3", "respuesta": "respuesta 3"}
  ],
  "schema_type": "ItemList",
  "last_updated": "${new Date().toISOString().split('T')[0]}"
}
Incluye exactamente 4 productos reales y 3 FAQs.`

  const raw = await callGroq(prompt)
  const key = `${categoria.slug}--${nicho.slug}`
  const entry = parseGroqJson(raw, key)
  validateEntry(entry, key)
  return entry
}

// ─── Lógica principal ───────────────────────────────────────────────────────
async function main() {
  log.section('AutoGrow iniciado')
  log.info('Timestamp:', new Date().toISOString())
  log.info('Modelo:', MODEL)
  log.info('Batch size:', BATCH_SIZE)

  // Verifica que los directorios existen antes de arrancar
  if (!fs.existsSync(MATRIX_DIR)) {
    log.error(`Directorio no encontrado: ${MATRIX_DIR}`)
    log.error('→ Crea data/matrix/ y asegúrate de que está commiteado (aunque vacío)')
    log.error('→ Git no versiona carpetas vacías: añade un .gitkeep dentro')
    process.exit(1)
  }

  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf-8'))
  const niches = JSON.parse(fs.readFileSync(NICHES_PATH, 'utf-8'))

  const existingFiles = new Set(
    fs.readdirSync(MATRIX_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  )

  log.info(`Categorías cargadas: ${categories.length}`)
  log.info(`Nichos cargados: ${niches.length}`)
  log.info(`Combinaciones posibles: ${categories.length * niches.length}`)
  log.info(`Ya existentes: ${existingFiles.size}`)

  // Selecciona combinaciones pendientes
  const pending = []
  for (const cat of categories) {
    for (const niche of niches) {
      const key = `${cat.slug}--${niche.slug}`
      if (!existingFiles.has(key)) pending.push({ categoria: cat, nicho: niche })
    }
  }

  if (pending.length === 0) {
    log.ok('Todas las combinaciones ya están generadas.')
    log.info('→ Añade nuevas entradas a categories.json o niches.json para crecer')
    process.exit(0) // Éxito legítimo
  }

  log.info(`Pendientes: ${pending.length} | Generando: ${Math.min(pending.length, BATCH_SIZE)}`)

  const batch = pending.sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE)

  let successCount = 0
  const failedKeys = []

  for (const { categoria, nicho } of batch) {
    const key = `${categoria.slug}--${nicho.slug}`
    log.section(`Procesando: ${key}`)

    try {
      const entry = await generateEntry(categoria, nicho)
      const filePath = path.join(MATRIX_DIR, `${key}.json`)
      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8')
      log.ok(`Escrito: data/matrix/${key}.json`)
      successCount++
    } catch (err) {
      // Logea el error completo pero NO relanza: deja que el batch continúe
      log.error(`Falló "${key}": ${err.message}`)
      failedKeys.push(key)
    }

    // Rate limiting: Groq Free = 6.000 tokens/min con llama-3.3-70b
    await new Promise(r => setTimeout(r, 2500))
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  log.section('Resumen final')
  log.info(`Generadas con éxito: ${successCount} / ${batch.length}`)

  if (failedKeys.length > 0) {
    log.warn(`Fallidas (${failedKeys.length}): ${failedKeys.join(', ')}`)
    log.warn('→ Se reintentarán en la próxima ejecución semanal')
  }

  // CRÍTICO: si NO se generó nada, el step falla visiblemente en Actions
  // Así el commit step siguiente no corre en falso
  if (successCount === 0) {
    log.error('No se generó ningún archivo. Revisa los errores arriba.')
    process.exit(1) // <- Actions marcará este step en ROJO
  }

  log.ok(`Total en matriz: ${existingFiles.size + successCount} entradas`)
}

// ─── Entry point: exit(1) si main() lanza ──────────────────────────────────
main().catch(err => {
  log.error('Error fatal no capturado:')
  console.error(err)
  process.exit(1) // <- NUNCA más un falso positivo
})
