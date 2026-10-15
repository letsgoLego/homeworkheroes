import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// AI-assistent för att lägga in läxor: tolkar fritt tal/text och foton av
// läxpapper, frågar efter det som saknas och föreslår ett pluggupplägg.

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/responses'
const MODEL = 'openai/gpt-6-astra'
const SUBJECTS = ['math', 'science', 'language', 'history', 'art', 'music', 'english', 'other']

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const nullable = (t: string) => ({ type: [t, 'null'] })

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'subject', 'homework_type', 'due_date', 'description', 'bring_items', 'study_sessions', 'study_plan', 'question', 'quick_replies', 'ready'],
  properties: {
    title: nullable('string'),
    subject: { type: ['string', 'null'], enum: [...SUBJECTS, null] },
    homework_type: { type: ['string', 'null'], enum: ['inlamning', 'forhor', null] },
    due_date: nullable('string'),
    description: nullable('string'),
    bring_items: { type: 'array', items: { type: 'string' } },
    study_sessions: nullable('integer'),
    study_plan: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'date'],
        properties: { title: { type: 'string' }, date: { type: 'string' } },
      },
    },
    question: nullable('string'),
    quick_replies: { type: 'array', items: { type: 'string' } },
    ready: { type: 'boolean' },
  },
}

function instructions(today: string, weekday: string, busy: string) {
  return `Du är en varm och peppande pluggcoach i appen Läxhjälp för föräldrar och barn i grundskolan.
Din coachning grundar sig i den svenska läroplanen (Lgr22: kursplanernas syfte, centrala innehåll och kunskapskrav per ämne och stadium) och Skolverkets forskning om lärande (förstå, aktiv återhämtning/självförhör, utspridd repetition).
Som coach: koppla gärna kort läxan till vad eleven ska lära sig enligt kursplanen (t.ex. "I SO åk 4–6 ingår Nordens geografi"), ge 1 konkret pluggtips anpassat till ämnet i passens titlar, och uppmuntra. Gissa inte årskurs om den inte framgår; fråga hellre om det påverkar upplägget. Påstå aldrig specifika formuleringar ur läroplanen du inte är säker på.
Idag är ${weekday} ${today}. Användaren beskriver en läxa fritt (talat, ofta rörigt) och/eller skickar ett foto av ett läxpapper/veckobrev.
Uppgift: fyll i läxkortet och returnera ALLTID hela det aktuella kortet (behåll tidigare ifyllda värden om inget ändrats).
- subject: math, science (NO/biologi/kemi/fysik), language (svenska), history (SO/historia/geografi/samhälle/religion), art, music, english, other.
- homework_type: "forhor" för prov/förhör/glosförhör/test, annars "inlamning".
- due_date: YYYY-MM-DD. Tolka "på fredag", "nästa vecka" osv relativt idag. Datum får inte ligga före idag.
- title: kort, t.ex. "Glosor kapitel 4" eller "Prov Norden".
- description: viktiga detaljer (sidor, kapitel, glosor) kort.
- Om något viktigt saknas (först datum, sedan vad som ska läras), ställ EN kort följdfråga i "question" och ge 2-4 korta "quick_replies" (t.ex. veckodagar med datum som "Fre 24/10").
- För förhör: om användaren inte sagt hur många gånger hen vill plugga, fråga det och föreslå 2, 3 eller 4 pass (rekommendera 3 om minst 3 dagar finns). När antal är känt: fyll study_sessions och skapa study_plan med ett pass per datum mellan idag och dagen före provet, enligt Skolverkets forskning: första pass "Förstå: ...", mitten "Träna: förhör dig själv ...", sista "Repetera: ...". Sprid passen, undvik upptagna dagar (${busy || 'inga kända'}) och helst helger.
- För inlämning: study_plan kan innehålla 1-2 arbetspass före inlämningsdagen om det passar, annars tom.
- ready=true när titel, typ och datum finns och (för förhör) en study_plan finns. Då ska question vara en kort sammanfattning som "Ser det bra ut? Tryck Spara." och quick_replies tom.
- Var kort, varm och skriv på svenska. Hitta aldrig på innehåll som inte nämnts eller syns på bilden.`
}

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const ev = JSON.parse(data)
        if (ev.type === 'response.output_text.delta') text += ev.delta ?? ''
        if (ev.type === 'response.failed' || ev.type === 'error') {
          throw new Error(ev.response?.error?.message ?? ev.message ?? 'AI-fel')
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }
  return text
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: claims, error: authErr } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''))
  if (authErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401)

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) return json({ error: 'AI är inte konfigurerat' }, 500)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Ogiltig förfrågan' }, 400) }

  // Röstinmatning: tolka inspelat ljud till text via gatewayens transkribering
  if (body?.action === 'transcribe') {
    const audio = typeof body.audio === 'string' ? body.audio : ''
    const mime = String(body.mimeType ?? 'audio/webm').slice(0, 50)
    if (!audio || audio.length > 8_000_000) return json({ error: 'Inget ljud' }, 400)
    const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0))
    const ext = mime.includes('mp4') || mime.includes('aac') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm'
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: mime }), `ljud.${ext}`)
    form.append('model', 'openai/gpt-transcribe')
    form.append('language', 'sv')
    const tRes = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      signal: req.signal,
      headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'fetch' },
      body: form,
    })
    if (!tRes.ok) {
      const details = await tRes.text()
      console.error(`Transcribe failed [${tRes.status}]: ${details}`)
      const msg = tRes.status === 429 ? 'För många förfrågningar just nu, försök igen om en stund.'
        : tRes.status === 402 ? 'AI-krediterna är slut.' : 'Kunde inte tolka ljudet.'
      return json({ error: msg, status: tRes.status, details }, tRes.status)
    }
    const tData = await tRes.json()
    const text = String(tData?.text ?? '').trim()
    if (!text) return json({ error: 'Hörde inget – försök igen.' }, 422)
    return json({ text })
  }

  const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : []
  if (!messages.length) return json({ error: 'Inget meddelande' }, 400)
  const today = String(body.today ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
  const weekday = String(body.weekday ?? '').slice(0, 20)
  const busy = Array.isArray(body.busyDates) ? body.busyDates.slice(0, 30).join(', ') : ''

  const input: any[] = []
  for (const m of messages) {
    const text = String(m?.text ?? '').slice(0, 4000)
    if (m?.role === 'assistant') {
      input.push({ role: 'assistant', content: [{ type: 'output_text', text }] })
      continue
    }
    const content: any[] = []
    if (text) content.push({ type: 'input_text', text })
    const img = typeof m?.image === 'string' && m.image.startsWith('data:image/') && m.image.length < 6_000_000 ? m.image : null
    if (img) content.push({ type: 'input_image', image_url: img })
    if (content.length) input.push({ role: 'user', content })
  }
  if (body.current) {
    input.push({ role: 'user', content: [{ type: 'input_text', text: `Nuvarande läxkort (JSON): ${JSON.stringify(body.current).slice(0, 3000)}` }] })
  }

  const res = await fetch(GATEWAY, {
    method: 'POST',
    signal: req.signal,
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: MODEL,
      instructions: instructions(today, weekday, busy),
      input,
      stream: true,
      store: false,
      reasoning: { effort: 'low' },
      text: { format: { type: 'json_schema', name: 'homework_card', strict: true, schema: SCHEMA } },
    }),
  })

  if (!res.ok) {
    const details = await res.text()
    console.error(`Gateway failed [${res.status}]: ${details}`)
    const msg = res.status === 429 ? 'För många förfrågningar just nu, försök igen om en stund.'
      : res.status === 402 ? 'AI-krediterna är slut.' : 'AI-assistenten kunde inte svara.'
    return json({ error: msg, status: res.status, details }, res.status)
  }

  try {
    const text = await readStream(res)
    const card = JSON.parse(text)
    return json({ card })
  } catch (e) {
    console.error('Parse/stream error', e)
    return json({ error: 'AI-assistenten gav inget giltigt svar. Försök igen.' }, 502)
  }
})
