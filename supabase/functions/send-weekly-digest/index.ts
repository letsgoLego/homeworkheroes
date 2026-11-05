import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Sunday evening "Inför veckan" email to parents, sent via Resend from
// hej.laxhjalp.app (never through the app-email helper). Runs from cron.
// Deduped per user per ISO week; recipients can unsubscribe with one click.

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const FROM = 'Läxhjälp <veckan@hej.laxhjalp.app>'
const REPLY_TO = 'elias.nordblad@gmail.com'
const SITE = 'https://laxhjalp.app'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return `${t.getUTCFullYear()}-W${Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7)}`
}

const DAYS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
const fmt = (iso: string) => { const d = new Date(iso + 'T12:00:00Z'); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}` }

type Hw = { title: string; due_date: string; homework_type: string | null }

function html(kids: { name: string; items: Hw[] }[], unsub: string) {
  const p = 'margin:0 0 14px;font-size:16px;line-height:1.55;color:#1f2937'
  const any = kids.some((k) => k.items.length > 0)
  const blocks = kids.map((k) => {
    const rows = k.items.length
      ? k.items.map((h) => `<li style="margin:0 0 6px">${h.homework_type === 'forhor' ? '📝 Förhör/prov:' : '📚'} <strong>${esc(h.title)}</strong> – ${fmt(h.due_date)}</li>`).join('')
      : '<li style="margin:0 0 6px;color:#6b7280">Inget inlagt ännu</li>'
    return `<p style="${p};margin-bottom:6px"><strong>${esc(k.name)}</strong></p><ul style="padding-left:20px;margin:0 0 16px;font-size:15px;color:#1f2937">${rows}</ul>`
  }).join('')
  return `<!doctype html><html lang="sv"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:28px 22px">
<p style="${p}">Hej! Här är veckan som kommer:</p>
${blocks}
<p style="${p}">${any
    ? 'Har ni ett prov eller glosor på gång? Berätta för Pluggcoachen, så lägger den upp lagom korta pluggpass under veckan.'
    : 'Vet ni redan vad som kommer i veckan? Prata in det i appen på 20 sekunder, så lägger Pluggcoachen upp en plan.'}</p>
<p style="margin:22px 0"><a href="${SITE}/add?ny=1" style="background:#20c4b6;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:12px;display:inline-block">Planera veckan</a></p>
<p style="${p}">Ha en fin vecka!<br>Läxhjälp</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 12px">
<p style="font-size:12px;color:#6b7280;margin:0">Du får det här veckobrevet för att du har ett konto på Läxhjälp. <a href="${unsub}" style="color:#6b7280">Sluta få veckobrevet</a>.</p>
</div></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!lovableKey || !resendKey) return json({ error: 'Email not configured' }, 500)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const week = isoWeek(new Date())
  const today = new Date().toISOString().slice(0, 10)
  const end = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10)

  const { data: roles } = await admin.from('user_roles').select('user_id, family_id').in('role', ['parent']).not('family_id', 'is', null)
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? '']))
  const { data: prefs } = await admin.from('digest_preferences').select('user_id, weekly_digest, unsub_token, last_sent_week')
  const prefById = new Map((prefs ?? []).map((p) => [p.user_id, p]))

  const seen = new Set<string>()
  let sent = 0, skipped = 0
  for (const r of roles ?? []) {
    if (seen.has(r.user_id)) continue
    seen.add(r.user_id)
    const email = emailById.get(r.user_id)
    if (!email || email.endsWith('@laxhjalpen.child')) { skipped++; continue }

    let pref = prefById.get(r.user_id)
    if (!pref) {
      const { data } = await admin.from('digest_preferences').insert({ user_id: r.user_id }).select().single()
      pref = data!
    }
    if (!pref.weekly_digest || pref.last_sent_week === week) { skipped++; continue }

    const { data: kids } = await admin.from('children').select('id, name').eq('family_id', r.family_id).order('created_at')
    if (!kids?.length) { skipped++; continue }
    const { data: hw } = await admin.from('homework').select('child_id, title, due_date, homework_type')
      .in('child_id', kids.map((k) => k.id)).eq('completed', false).gte('due_date', today).lte('due_date', end).order('due_date')
    const groups = kids.map((k) => ({ name: k.name, items: (hw ?? []).filter((h) => h.child_id === k.id) as Hw[] }))

    const unsub = `${SITE}/veckobrev/avregistrera?token=${pref.unsub_token}`
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': resendKey,
        'Idempotency-Key': `weekly-digest-${r.user_id}-${week}`,
      },
      body: JSON.stringify({
        from: FROM, to: [email], reply_to: REPLY_TO,
        subject: 'Inför veckan – läxor och prov',
        html: html(groups, unsub),
        headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }),
    })
    if (res.ok) {
      await admin.from('digest_preferences').update({ last_sent_week: week }).eq('user_id', r.user_id)
      sent++
    } else {
      console.error(`Resend failed [${res.status}]: ${await res.text()}`)
      if (res.status === 401 || res.status === 403) break
    }
    await new Promise((res) => setTimeout(res, 600))
  }
  return json({ week, sent, skipped })
})
