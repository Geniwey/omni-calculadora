import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname       = path.dirname(fileURLToPath(import.meta.url))
const ROOT            = path.join(__dirname, '..')
const MATRIX_DIR      = path.join(ROOT, 'data', 'matrix')
const CATEGORIES_PATH = path.join(ROOT, 'data', 'categories.json')
const NICHES_PATH     = path.join(ROOT, 'data', 'niches.json')
const HISTORY_PATH    = path.join(ROOT, 'data', 'history.log')

const GROQ_API_KEY   = process.env.GROQ_API_KEY
const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL          = 'llama-3.3-70b-versatile'

const BATCH_SIZE     = 8
const DELAY_MS       = 15_000
const RETRY_DELAY_MS = 35_000
const MAX_RETRIES    = 3

// ─── Logger con timestamp ─────────────────────────────────────────────────
const ts  = () => new Date().toISOString()
const log = {
  info:    (...a) => console.log (`[${ts()}] ℹ️  INFO    `, ...a),
  ok:      (...a) => console.log (`[${ts()}] ✅ OK      `, ...a),
  warn:    (...a) => console.warn(`[${ts()}] ⚠️  WARN    `, ...a),
  error:   (...a) => console.error(`[${ts()}] ❌ ERROR   `, ...a),
  section: (...a) => console.log (`\n${'═'.repeat(60)}\n[${ts()}] 🔷`, ...a),
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── Historial persistente ────────────────────────────────────────────────
// Acumula un log de cada ejecución en data/history.log
const historyLines = []
function hlog(line) {
  const entry = `[${ts()}] ${line}`
  historyLines.push(entry)
  // También lo saca por consola para que Actions lo muestre
  console.log(entry)
}

function flushHistory(summary) {
  hlog('─'.repeat(50))
  hlog(`RESUMEN: ${summary}`)
  hlog('─'.repeat(50))

  // Append al fichero (no sobreescribe el historial previo)
  try {
    fs.appendFileSync(HISTORY_PATH, historyLines.join('\n') + '\n', 'utf-8')
    log.ok(`Historial guardado en data/history.log`)
  } catch (e) {
    log.warn(`No se pudo guardar el historial: ${e.message}`)
  }
}

// ─── Guard API key ────────────────────────────────────────────────────────
if (!GROQ_API_KEY) {
  log.error('GROQ_API_KEY no definida.')
  log.error('→ GitHub repo → Settings → Secrets → Actions → GROQ_API_KEY')
  process.exit(1)
}

// ─── Limpieza agresiva de strings JSON del LLM ───────────────────────────
// El LLM puede devolver: ```json ... ```, texto antes/después, comillas
// mal escapadas, caracteres de control, truncados, etc.
function extractJson(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Respuesta vacía o no es string')

  let s = raw.trim()

  // 1. Elimina bloques markdown de código (```json ... ``` o ``` ... ```)
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  // 2. Si hay texto antes del primer '{' o '[', lo elimina
  const firstBrace  = s.indexOf('{')
  const firstBracket = s.indexOf('[')
  let start = -1
  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error('No se encontró ningún objeto JSON en la respuesta')
  } else if (firstBrace === -1) {
    start = firstBracket
  } else if (firstBracket === -1) {
    start = firstBrace
  } else {
    start = Math.min(firstBrace, firstBracket)
  }
  s = s.slice(start)

  // 3. Trunca tras el último '}' o ']' que cierre el objeto raíz
  //    (elimina texto que el LLM añada después del JSON)
  const lastBrace   = s.lastIndexOf('}')
  const lastBracket = s.lastIndexOf(']')
  const end = Math.max(lastBrace, lastBracket)
  if (end === -1) throw new Error('JSON sin cierre de objeto/array')
  s = s.slice(0, end + 1)

  // 4. Elimina caracteres de control invisibles (excepto \n \t que son válidos)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 5. Intento de parseo directo
  try {
    return JSON.parse(s)
  } catch (firstErr) {

    // 6. Reparaciones heurísticas para JSONs casi válidos
    let fixed = s
      // Trailing commas antes de } o ]
      .replace(/,\s*([}\]])/g, '$1')
      // Comillas simples → dobles (solo en claves y valores string simples)
      .replace(/'([^'\\]*)'/g, '"$1"')
      // Saltos de línea literales dentro de strings (JSON no los permite)
      .replace(/"([^"]*)\n([^"]*)"/g, (_, a, b) => `"${a}\\n${b}"`)

    try {
      return JSON.parse(fixed)
    } catch (secondErr) {
      // Vuelca los primeros 500 chars para diagnóstico
      log.error('JSON irreparable. Primeros 500 chars:')
      console.error(s.slice(0, 500))
      throw new Error(`JSON inválido tras limpieza: ${firstErr.message}`)
    }
  }
}

// ─── Llamada base a Groq ──────────────────────────────────────────────────
async function callGroq(prompt) {
  let res
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:    MODEL,
        messages: [
          {
            role:    'system',
            content: 'Eres experto en SEO programático B2B en España. IMPORTANTE: Respondes ÚNICAMENTE con el objeto JSON solicitado. Sin markdown, sin explicaciones, sin texto antes ni después del JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.72,
        max_tokens:  4096,
      }),
    })
  } catch (netErr) {
    throw new Error(`RED/DNS: ${netErr.message}`)
  }

  if (res.status === 429) {
    const err   = new Error('HTTP 429 Rate Limit')
    err.is429   = true
    const retry = res.headers.get('retry-after')
    err.retryAfter = retry ? parseInt(retry, 10) * 1000 : RETRY_DELAY_MS
    throw err
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const hint = {
      401: 'API key inválida. Ve a console.groq.com y genera una nueva.',
      403: 'Sin permiso para el modelo. Prueba con mixtral-8x7b-32768',
      500: 'Error interno de Groq. Reintenta en unos minutos.',
      503: 'Groq en mantenimiento. Consulta status.groq.com',
    }[res.status] ?? 'Error desconocido'
    throw new Error(`HTTP ${res.status}: ${hint}\n  Respuesta: ${body.slice(0, 300)}`)
  }

  const data = await res.json().catch(e => {
    throw new Error(`Respuesta HTTP 200 pero body no es JSON: ${e.message}`)
  })

  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error(`Groq OK pero sin contenido. Body: ${JSON.stringify(data).slice(0, 200)}`)
  }

  return content
}

// ─── Wrapper con reintentos ───────────────────────────────────────────────
async function callGroqWithRetry(prompt, context = '') {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGroq(prompt)
    } catch (err) {
      if (err.is429) {
        const wait = err.retryAfter ?? RETRY_DELAY_MS
        log.warn(`429 en "${context}" — intento ${attempt}/${MAX_RETRIES}. Esperando ${wait / 1000}s...`)
        if (attempt < MAX_RETRIES) { await sleep(wait); continue }
        throw new Error(`429 persistente tras ${MAX_RETRIES} intentos.`)
      }
      throw err
    }
  }
}

// ─── Validación estructural de una entrada de matriz ─────────────────────
function validateEntry(entry, key) {
  const required = ['titulo_h1', 'meta_title', 'meta_description', 'intro', 'productos', 'faq', 'theme']
  const missing  = required.filter(f => !entry[f])
  if (missing.length) throw new Error(`Campos ausentes en "${key}": ${missing.join(', ')}`)

  if (!Array.isArray(entry.productos) || entry.productos.length < 2) {
    throw new Error(`"${key}" tiene menos de 2 productos (recibidos: ${entry.productos?.length ?? 0})`)
  }

  for (const p of entry.productos) {
    if (!p.nombre || !p.url_afiliado) {
      throw new Error(`Producto sin nombre o url_afiliado en "${key}"`)
    }
  }

  if (!Array.isArray(entry.faq) || entry.faq.length < 1) {
    throw new Error(`"${key}" no tiene FAQs`)
  }
}

// ─── Generación de una entrada ────────────────────────────────────────────
async function generateEntry(categoria, nicho) {
  const themeHint = nicho.theme
    ? JSON.stringify(nicho.theme)
    : `{"colorPrincipal":"blue","estilo":"corporativo","icono":"briefcase"}`

  const prompt = `Genera contenido SEO para "mejor ${categoria.label} para ${nicho.label}" en España.

Devuelve SOLO este JSON, sin markdown ni texto extra:
{
  "categoria": "${categoria.slug}",
  "nicho": "${nicho.slug}",
  "titulo_h1": "El Mejor ${categoria.label} para ${nicho.label} en 2025",
  "meta_title": "Mejor ${categoria.label} para ${nicho.label} 2025 | Top 4 Comparativa",
  "meta_description": "Los 4 mejores ${categoria.label} para ${nicho.label} en España. Comparativa de precios, funciones y opiniones. Guía 2025.",
  "intro": "2-3 frases concretas explicando por qué los ${nicho.label} necesitan ${categoria.label}.",
  "pain_points": ["Problema concreto 1","Problema concreto 2","Problema concreto 3"],
  "theme": ${themeHint},
  "productos": [
    {
      "nombre": "Nombre real del software",
      "slug": "slug-del-software",
      "puntuacion": 4.7,
      "precio_desde": "X€/mes",
      "descripcion": "Beneficio específico para ${nicho.label} en 1 frase.",
      "pros": ["Ventaja específica 1","Ventaja específica 2","Ventaja específica 3"],
      "cons": ["Inconveniente honesto 1","Inconveniente honesto 2"],
      "url_afiliado": "https://example.com",
      "badge": "Más popular"
    }
  ],
  "faq": [
    {"pregunta": "Pregunta frecuente real","respuesta": "Respuesta experta de 2-3 frases."},
    {"pregunta": "Segunda pregunta","respuesta": "Segunda respuesta."},
    {"pregunta": "Tercera pregunta","respuesta": "Tercera respuesta."}
  ],
  "schema_type": "ItemList",
  "last_updated": "${new Date().toISOString().split('T')[0]}"
}

Reglas: 4 productos reales, 3 FAQs, precios en euros, contexto español.`

  const raw    = await callGroqWithRetry(prompt, `${categoria.slug}--${nicho.slug}`)
  const entry  = extractJson(raw)
  validateEntry(entry, `${categoria.slug}--${nicho.slug}`)
  return entry
}

// ─── Expansión infinita del universo ─────────────────────────────────────
async function expandUniverse(categories, niches) {
  log.section('UNIVERSO COMPLETO — Activando expansión infinita')

  const prompt = `Tengo un sitio de comparativas de software B2B en España.
Categorías actuales: ${categories.map(c => c.slug).join(', ')}
Nichos actuales: ${niches.map(n => n.slug).join(', ')}

Devuelve SOLO este JSON:
{
  "nuevas_categorias": [
    {"slug":"slug-nuevo","label":"Nombre","description":"Una frase"}
  ],
  "nuevos_nichos": [
    {
      "slug":"slug-nuevo","label":"Profesional","sector":"sector",
      "theme":{"colorPrincipal":"blue","estilo":"corporativo","icono":"briefcase"}
    }
  ]
}
Inventa exactamente 2 categorías y 5 nichos que NO estén en las listas actuales.
Profesiones reales españolas con necesidades de software claras.`

  const raw  = await callGroqWithRetry(prompt, 'expansion-universo')
  const data = extractJson(raw)

  if (!data.nuevas_categorias?.length || !data.nuevos_nichos?.length) {
    throw new Error('Respuesta de expansión incompleta')
  }

  const newCats   = data.nuevas_categorias.filter(nc => !categories.find(c => c.slug === nc.slug))
  const newNiches = data.nuevos_nichos.filter(nn => !niches.find(n => n.slug === nn.slug))

  const updatedCategories = [...categories, ...newCats]
  const updatedNiches     = [...niches, ...newNiches]

  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(updatedCategories, null, 2), 'utf-8')
  fs.writeFileSync(NICHES_PATH,     JSON.stringify(updatedNiches,     null, 2), 'utf-8')

  hlog(`EXPANSIÓN: +${newCats.length} categorías (${newCats.map(c=>c.slug).join(', ')})`)
  hlog(`EXPANSIÓN: +${newNiches.length} nichos (${newNiches.map(n=>n.slug).join(', ')})`)

  return { categories: updatedCategories, niches: updatedNiches }
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  log.section('AutoGrow V2.1 iniciado')
  hlog(`INICIO: modelo=${MODEL} batch=${BATCH_SIZE}`)

  if (!fs.existsSync(MATRIX_DIR)) {
    log.error(`Directorio no encontrado: ${MATRIX_DIR}`)
    log.error('→ Crea data/matrix/ y añade un archivo .gitkeep dentro')
    process.exit(1)
  }

  let categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf-8'))
  let niches     = JSON.parse(fs.readFileSync(NICHES_PATH,     'utf-8'))

  const existingFiles = new Set(
    fs.readdirSync(MATRIX_DIR)
      .filter(f => f.endsWith('.json') && f !== '.gitkeep')
      .map(f => f.replace('.json', ''))
  )

  log.info(`Categorías: ${categories.length} | Nichos: ${niches.length}`)
  log.info(`Posibles: ${categories.length * niches.length} | Existentes: ${existingFiles.size}`)

  // Calcula pendientes
  let pending = []
  for (const cat of categories) {
    for (const niche of niches) {
      const key = `${cat.slug}--${niche.slug}`
      if (!existingFiles.has(key)) pending.push({ categoria: cat, nicho: niche })
    }
  }

  // ── Expansión infinita si el universo está completo ───────────────────
  if (pending.length === 0) {
    hlog('UNIVERSO COMPLETO: lanzando expansión')
    await sleep(DELAY_MS) // pausa antes de la llamada de expansión
    try {
      const expanded = await expandUniverse(categories, niches)
      categories = expanded.categories
      niches     = expanded.niches
      // Recalcula
      pending = []
      for (const cat of categories) {
        for (const niche of niches) {
          const key = `${cat.slug}--${niche.slug}`
          if (!existingFiles.has(key)) pending.push({ categoria: cat, nicho: niche })
        }
      }
      await sleep(DELAY_MS)
    } catch (err) {
      log.error(`Expansión falló: ${err.message}`)
      hlog(`ERROR_EXPANSION: ${err.message}`)
      // No matamos el proceso; puede que el universo esté genuinamente completo
      flushHistory('Sin cambios — expansión falló')
      process.exit(0)
    }
  }

  const batch = pending.sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE)
  log.info(`Pendientes: ${pending.length} | Esta ejecución: ${batch.length}`)

  let successCount = 0
  const failed     = []

  for (let i = 0; i < batch.length; i++) {
    const { categoria, nicho } = batch[i]
    const key = `${categoria.slug}--${nicho.slug}`
    log.section(`[${i + 1}/${batch.length}] ${key}`)

    try {
      const entry    = await generateEntry(categoria, nicho)
      const filePath = path.join(MATRIX_DIR, `${key}.json`)
      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8')
      log.ok(`Escrito: data/matrix/${key}.json`)
      hlog(`OK: ${key}`)
      successCount++
    } catch (err) {
      // Loguea y CONTINÚA — no detiene el batch
      log.error(`Falló "${key}": ${err.message}`)
      hlog(`FAIL: ${key} — ${err.message}`)
      failed.push(key)
    }

    // Delay estricto entre llamadas (excepto tras la última)
    if (i < batch.length - 1) {
      log.info(`Esperando ${DELAY_MS / 1000}s...`)
      await sleep(DELAY_MS)
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────
  log.section('Resumen de ejecución')
  log.info(`Éxito: ${successCount}/${batch.length}`)
  if (failed.length) log.warn(`Fallidas: ${failed.join(', ')}`)
  log.ok(`Total en matriz: ${existingFiles.size + successCount}`)

  const summaryLine = `OK=${successCount} FAIL=${failed.length} TOTAL=${existingFiles.size + successCount}`
  flushHistory(summaryLine)

  if (successCount === 0) {
    log.error('No se generó ningún archivo. El commit step no correrá.')
    process.exit(1)
  }
}

main().catch(err => {
  log.error('Error fatal no capturado:')
  console.error(err)
  flushHistory(`FATAL: ${err.message}`)
  process.exit(1)
})
