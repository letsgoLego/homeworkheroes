import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Admin-only: sends the appropriate next-step onboarding email to every
// registered family, based on where they actually are in the flow.
// One email per parent email address; idempotent per family+step.

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
  const caller = u?.user
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: caller.id, _role: 'admin' })
  if (!isAdmin) return json({ error: 'Forbidden' }, 403)

  // All parent/admin roles with a family, joined to the auth email.
  const { data: roles } = await admin.from('user_roles').select('user_id, family_id')
    .in('role', ['parent', 'admin']).not('family_id', 'is', null)
  const results: Array<Record<string, unknown>> = []
  const emailed = new Set<string>()

  for (const role of roles || []) {
    const { data: usr } = await admin.auth.admin.getUserById(role.user_id)
    const email = usr?.user?.email
    if (!email || email.endsWith('@laxhjalpen.child') || emailed.has(email)) continue

    const { data: kids } = await admin.from('children').select('id, name, username, has_account')
      .eq('family_id', role.family_id).order('created_at')
    const children = kids || []
    const ids = children.map((c) => c.id)
    const { count: hwCount } = ids.length
      ? await admin.from('homework').select('id', { count: 'exact', head: true }).in('child_id', ids)
      : { count: 0 }

    let template: string
    let templateData: Record<string, unknown>
    if (children.length === 0) {
      template = 'welcome-parent'
      templateData = {}
    } else if (!children.some((c) => c.has_account)) {
      template = 'onboarding-child-login'
      templateData = { childName: children[0].name }
    } else if ((hwCount ?? 0) === 0) {
      template = 'onboarding-first-homework'
      templateData = { childName: children[0].name }
    } else if ((hwCount ?? 0) < 3) {
      template = 'onboarding-first-homework'
      templateData = { childName: children[0].name }
    } else {
      template = 'onboarding-power-tips'
      templateData = {}
    }

    try {
      const result = await sendTemplateEmail(template, email, {
        templateData,
        idempotencyKey: `catchup-${template}-${role.family_id}`,
      })
      results.push({ email, template, sent: result.sent, reason: result.reason })
      if (result.sent) emailed.add(email)
    } catch (e) {
      results.push({ email, template, sent: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return json({ results })
})
