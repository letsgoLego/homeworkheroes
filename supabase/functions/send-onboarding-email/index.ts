import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Sends a one-off onboarding email right after the parent completes a step.
// Recipient = authenticated caller. The step is verified against real data.

const Body = z.object({ step: z.enum(['child-added', 'child-login', 'homework']) })

const json = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: u } = await userClient.auth.getUser()
  const user = u?.user
  if (!user?.email || user.email.endsWith('@laxhjalpen.child')) return json({ error: 'Unauthorized' }, 401)

  let parsed
  try { parsed = Body.safeParse(await req.json()) } catch { return json({ error: 'Invalid body' }, 400) }
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const { step } = parsed.data

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: role } = await admin.from('user_roles').select('family_id')
    .eq('user_id', user.id).in('role', ['parent', 'admin']).not('family_id', 'is', null)
    .order('created_at').limit(1).maybeSingle()
  const familyId = role?.family_id
  if (!familyId) return json({ sent: false, reason: 'no_family' })

  const { data: kids } = await admin.from('children').select('id, name, username, has_account, created_at')
    .eq('family_id', familyId).order('created_at')
  const children = kids || []

  let template: string | null = null
  let templateData: Record<string, unknown> = {}

  if (step === 'child-added') {
    if (children.length === 0) return json({ sent: false, reason: 'not_reached' })
    template = 'onboarding-child-added'
    templateData = { childName: children[0].name }
  } else if (step === 'child-login') {
    const { data: linked } = await admin.from('user_roles').select('child_id')
      .eq('family_id', familyId).eq('role', 'child').not('child_id', 'is', null).limit(1).maybeSingle()
    const withAcc = children.find((c) => c.has_account) || children.find((c) => c.id === linked?.child_id)
    if (!withAcc) return json({ sent: false, reason: 'not_reached' })
    template = 'onboarding-child-login'
    templateData = { childName: withAcc.name, username: withAcc.has_account ? withAcc.username : undefined }
  } else {
    const ids = children.map((c) => c.id)
    if (ids.length === 0) return json({ sent: false, reason: 'not_reached' })
    const { count } = await admin.from('homework').select('id', { count: 'exact', head: true }).in('child_id', ids)
    if (count === 1) { template = 'onboarding-first-homework'; templateData = { childName: children[0].name } }
    else if ((count ?? 0) >= 3) template = 'onboarding-power-tips'
    else return json({ sent: false, reason: 'not_reached' })
  }

  try {
    const result = await sendTemplateEmail(template, user.email, {
      templateData,
      idempotencyKey: `${template}-${familyId}`,
    })
    return json(result.sent ? { sent: true } : { sent: false, reason: result.reason })
  } catch (e) {
    console.error('Onboarding email failed', { template, message: e instanceof Error ? e.message : String(e) })
    return json({ error: 'Failed to send' }, 500)
  }
})
