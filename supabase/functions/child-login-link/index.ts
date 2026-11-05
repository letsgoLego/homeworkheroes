import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'

// Password-free child sign-in.
// action "create" (parent, authenticated): ensures the child has an account and
//   returns a single-use link token valid for 30 minutes.
// action "redeem" (public): exchanges the token for a one-time sign-in token hash
//   that the child's device verifies with supabase.auth.verifyOtp.

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), childId: z.string().uuid() }),
  z.object({ action: z.literal('redeem'), token: z.string().min(20).max(100) }),
])

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const randomToken = () => {
  const b = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const slug = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 12) || 'barn'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let parsed
  try { parsed = Body.safeParse(await req.json()) } catch { return json({ error: 'Invalid body' }, 400) }
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    if (parsed.data.action === 'create') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
      const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
      const { data: u } = await userClient.auth.getUser()
      if (!u?.user) return json({ error: 'Unauthorized' }, 401)

      const childId = parsed.data.childId
      const { data: child } = await admin.from('children').select('id, family_id, name, username, has_account').eq('id', childId).maybeSingle()
      if (!child) return json({ error: 'Child not found' }, 404)

      const { data: role } = await admin.from('user_roles').select('id').eq('user_id', u.user.id)
        .eq('family_id', child.family_id).in('role', ['parent', 'admin']).limit(1).maybeSingle()
      if (!role) return json({ error: 'Forbidden' }, 403)

      // Ensure the child has a login account (auto-created, no password to remember).
      const { data: linked } = await admin.from('user_roles').select('user_id').eq('child_id', childId).eq('role', 'child').limit(1).maybeSingle()
      if (!linked) {
        let created = null
        for (let i = 0; i < 5 && !created; i++) {
          const username = `${slug(child.name)}${Math.floor(1000 + Math.random() * 9000)}`
          const { data, error } = await admin.auth.admin.createUser({
            email: `${username}@laxhjalpen.child`,
            password: randomToken(),
            email_confirm: true,
          })
          if (!error && data.user) created = { id: data.user.id, username }
        }
        if (!created) return json({ error: 'Kunde inte skapa konto' }, 500)
        await admin.from('user_roles').insert({ user_id: created.id, role: 'child', family_id: child.family_id, child_id: childId })
        await admin.from('children').update({ username: created.username, has_account: true }).eq('id', childId)
      }

      const token = randomToken()
      const { error } = await admin.from('child_login_links').insert({
        token_hash: await sha256(token),
        child_id: childId,
        created_by: u.user.id,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      if (error) throw error
      return json({ token, childName: child.name })
    }

    // redeem
    const hash = await sha256(parsed.data.token)
    const { data: link } = await admin.from('child_login_links').select('id, child_id, expires_at, used_at').eq('token_hash', hash).maybeSingle()
    if (!link || link.used_at || new Date(link.expires_at) < new Date()) {
      return json({ error: 'expired' }, 410)
    }
    const { data: claimed } = await admin.from('child_login_links').update({ used_at: new Date().toISOString() })
      .eq('id', link.id).is('used_at', null).select('id').maybeSingle()
    if (!claimed) return json({ error: 'expired' }, 410)

    const { data: linked } = await admin.from('user_roles').select('user_id').eq('child_id', link.child_id).eq('role', 'child').limit(1).maybeSingle()
    if (!linked) return json({ error: 'no_account' }, 404)
    const { data: au } = await admin.auth.admin.getUserById(linked.user_id)
    const email = au?.user?.email
    if (!email) return json({ error: 'no_account' }, 404)

    const { data: gl, error: glErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (glErr || !gl?.properties?.hashed_token) throw glErr ?? new Error('No token')
    return json({ tokenHash: gl.properties.hashed_token })
  } catch (e) {
    console.error('child-login-link failed', e instanceof Error ? e.message : String(e))
    return json({ error: 'Internal error' }, 500)
  }
})
