import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Sends the parent welcome email after onboarding.
// The recipient is always derived from the authenticated caller's JWT — the
// browser can never pass an arbitrary recipient or template.

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !anonKey) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData?.user

  if (userError || !user?.email) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let familyName: string | undefined
  let childName: string | undefined
  try {
    const body = await req.json()
    familyName = typeof body?.familyName === 'string' ? body.familyName.slice(0, 100) : undefined
    childName = typeof body?.childName === 'string' ? body.childName.slice(0, 100) : undefined
  } catch {
    // Body is optional — the template has fallbacks for both fields.
  }

  try {
    const result = await sendTemplateEmail('welcome-parent', user.email, {
      templateData: { familyName, childName },
      // One welcome email per parent account, even if onboarding is retried.
      idempotencyKey: `welcome-parent-${user.id}`,
    })

    if (!result.sent) {
      console.log('Welcome email not sent', { reason: result.reason })
      return jsonResponse({ sent: false, reason: result.reason })
    }

    return jsonResponse({ sent: true })
  } catch (error) {
    console.error('Welcome email failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return jsonResponse({ error: 'Failed to send welcome email' }, 500)
  }
})
