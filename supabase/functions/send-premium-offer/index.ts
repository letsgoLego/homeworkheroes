import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Admin-only: sends the 3-month Premium offer via Resend to every prepared,
// not-yet-sent, not-unsubscribed offer. One email per family, never twice.

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const FROM = 'Elias på Läxhjälp <elias@hej.laxhjalp.app>'
const REPLY_TO = 'elias.nordblad@gmail.com'
const SITE = 'https://laxhjalp.app'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function html(familyName: string, link: string, unsub: string) {
  const p = 'margin:0 0 16px;font-size:16px;line-height:1.55;color:#1f2937'
  return `<!doctype html><html lang="sv"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:28px 22px">
<p style="${p}">Hej ${esc(familyName)}!</p>
<p style="${p}">Vad roligt att ni hittade Läxhjälp! Vi har märkt att ni inte varit inne så mycket på sistone – och det vill vi gärna lära oss av. Läxhjälp är byggt av en förälder som själv ville ha bättre koll på läxor, prov och packning, och vi vill att det ska bli lika enkelt för er.</p>
<p style="${p}">Därför vill vi bjuda er på <strong>3 månader Premium helt gratis</strong> – i utbyte mot att ni berättar vad vi kan göra bättre, både nu och under tiden ni använder appen. Vad saknade ni? Var blev det krångligt? Era svar går direkt till mig och påverkar vad vi bygger härnäst.</p>
<p style="margin:24px 0"><a href="${link}" style="background:#20c4b6;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:12px;display:inline-block">Ja tack – aktivera Premium gratis</a></p>
<ul style="padding-left:20px;${p}">
<li>Inget kort behövs</li>
<li>Förnyas inte automatiskt – efter 3 månader väljer ni själva om ni vill fortsätta</li>
<li>Några korta frågor i appen då och då, max en minut</li>
</ul>
<p style="${p}"><strong>Tips:</strong> Lägg Läxhjälp på hemskärmen så öppnas den som en app. iPhone/iPad: Dela → Lägg till på hemskärmen. Android: menyn ⋮ → Lägg till på startskärmen.</p>
<p style="${p}">Varma hälsningar,<br>Elias, Läxhjälp</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 12px">
<p style="font-size:12px;color:#6b7280;margin:0">Du får det här mejlet för att du har ett konto på Läxhjälp. Vill du inte få fler erbjudanden? <a href="${unsub}" style="color:#6b7280">Avregistrera dig</a>.</p>
</div></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!lovableKey || !resendKey) return json({ error: 'E-posttjänsten är inte konfigurerad' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const { data: claims } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
  const userId = claims?.claims?.sub
  if (!userId) return json({ error: 'Unauthorized' }, 401)
  const { data: isAdmin } = await userClient.rpc('has_role', { _user_id: userId, _role: 'admin' })
  if (!isAdmin) return json({ error: 'Forbidden' }, 403)

  let dryRun = false
  try { dryRun = (await req.json())?.dryRun === true } catch { /* empty body */ }

  // Prepare (as the admin user so the RPC's role check passes), then send with service role.
  const { data: offers, error: prepErr } = await userClient.rpc('admin_prepare_premium_offers')
  if (prepErr) return json({ error: prepErr.message }, 500)
  const pending = (offers ?? []).filter((o: any) => !o.sent_at && !o.accepted_at && !o.unsubscribed_at && o.recipient_email)
  if (dryRun) return json({ pending: pending.length })

  const admin = createClient(url, service)
  const results: { email: string; ok: boolean; status?: number; details?: string }[] = []
  for (const o of pending) {
    const link = `${SITE}/erbjudande?token=${o.token}`
    const unsub = `${SITE}/erbjudande/avregistrera?token=${o.token}`
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': resendKey,
        'Idempotency-Key': `premium-offer-${o.family_id}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [o.recipient_email],
        reply_to: REPLY_TO,
        subject: 'En gåva till er familj – 3 månader Premium gratis',
        html: html(o.family_name || 'där', link, unsub),
        headers: { 'List-Unsubscribe': `<${unsub}>` },
      }),
    })
    if (res.ok) {
      await admin.from('premium_offers').update({ sent_at: new Date().toISOString() }).eq('family_id', o.family_id)
      results.push({ email: o.recipient_email, ok: true })
    } else {
      const details = await res.text()
      console.error(`Resend failed [${res.status}]: ${details}`)
      results.push({ email: o.recipient_email, ok: false, status: res.status, details })
      if (res.status === 403 || res.status === 401) break // domain/key problem — stop instead of failing every row
    }
    await new Promise((r) => setTimeout(r, 600)) // stay under Resend's rate limit
  }
  return json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok), total: pending.length })
})
