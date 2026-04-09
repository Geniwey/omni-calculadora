import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')

const GROQ_API_KEY = process.env.GROQ_API_KEY
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10)
const GROQ_MODEL = 'llama3-70b-8192' 

async function readIndex() {
  const raw = await fs.readFile(path.join(DATA_DIR, 'index.json'), 'utf-8')
  return JSON.parse(raw)
}

async function getExistingCombinations() {
  const index = await readIndex()
  return new Set(index.pairs.map((p) => `${p.categoria}|${p.nicho}`))
}

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })
  const data = await res.json()
  return data.choices[0].message.content
}

async function generateNewCombinations(existing, batchSize) {
  const existingList = [...existing].slice(0, 30).join(', ')

  const prompt = `Eres un experto en SEO programático B2B para el mercado hispanohablante.
Ya existen estas combinaciones: ${existingList}
Genera exactamente ${batchSize} NUEVAS combinaciones únicas de (software SaaS × nicho profesional) en español.
Responde ÚNICAMENTE con un JSON válido, con este formato exacto:
{
  "nuevasCombinaciones": [
    {
      "categoria": "crm",
      "categoriaLabel": "CRM",
      "nicho": "fisioterapeutas",
      "nichoLabel": "Fisioterapeutas",
      "productosPrincipales": [
        {
          "id": "hubspot",
          "nombre": "HubSpot CRM",
          "descripcion": "Descripción específica para el nicho.",
          "precio": "Gratis / desde 45€/mes",
          "puntuacion": 4.8,
          "ventajas": ["v1", "v2", "v3"],
          "desventajas": ["d1", "d2"],
          "afiliado": { "red": "partnerstack", "url": "https://partnerstack.com", "comision": "20% recurrente" }
        }
      ],
      "painPoints": ["p1", "p2", "p3"],
      "preguntasFrecuentes": [
        { "pregunta": "P?", "respuesta": "R." }
      ]
    }
  ]
}`

  const raw = await callGroq(prompt)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('LLM no devolvió JSON válido')
  return JSON.parse(jsonMatch[0])
}

async function persistData(nuevasCombinaciones, existingIndex) {
  let added = 0
  for (const combo of nuevasCombinaciones) {
    const key = `${combo.categoria}|${combo.nicho}`
    const catPath = path.join(DATA_DIR, 'categorias', `${combo.categoria}.json`)
    let catData
    try {
      catData = JSON.parse(await fs.readFile(catPath, 'utf-8'))
    } catch {
      catData = { slug: combo.categoria, nombre: combo.categoriaLabel, productos: [] }
    }
    for (const prod of combo.productosPrincipales) {
      if (!catData.productos.find((p) => p.id === prod.id)) catData.productos.push(prod)
    }
    await fs.writeFile(catPath, JSON.stringify(catData, null, 2))
    const nichoPath = path.join(DATA_DIR, 'nichos', `${combo.nicho}.json`)
    const nichoData = {
      slug: combo.nicho,
      nombre: combo.nichoLabel,
      nombreSingular: combo.nichoLabel.replace(/s$/, ''),
      sectorProfesional: combo.nichoLabel,
      painPoints: combo.painPoints,
      preguntasFrecuentes: combo.preguntasFrecuentes
    }
    await fs.writeFile(nichoPath, JSON.stringify(nichoData, null, 2))
    existingIndex.pairs.push({ categoria: combo.categoria, nicho: combo.nicho })
    added++
  }
  await fs.writeFile(path.join(DATA_DIR, 'index.json'), JSON.stringify(existingIndex, null, 2))
  return added
}

async function main() {
  const index = await readIndex()
  const existing = await getExistingCombinations()
  const { nuevasCombinaciones } = await generateNewCombinations(existing, BATCH_SIZE)
  const added = await persistData(nuevasCombinaciones, index)
  console.log(`🎉 AutoGrow completado: ${added} páginas nuevas`)
}
main().catch(console.error)
