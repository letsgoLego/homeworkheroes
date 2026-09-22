import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Receives a help question from a logged-in user, stores it in
// help_questions and emails it to the app owner. The recipient is fixed
// in the email template — the browser can never choose where it goes.

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

  const token = authHeader.replace('Bearer ', '')
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
  const userId = claimsData?.claims?.sub
  const userEmail = (claimsData?.claims?.email as string | undefined) ?? null

  if (claimsError || !userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let message: string
  try {
    const body = await req.json()
    if (typeof body?.message !== 'string' || body.message.trim().length < 3) {
      return jsonResponse({ error: 'Meddelandet är för kort' }, 400)
    }
    message = body.message.trim().slice(0, 2000)
  } catch {
    return jsonResponse({ error: 'Ogiltig förfrågan' }, 400)
  }

  const createdAt = new Date().toISOString()

  const { error: insertError } = await supabase
    .from('help_questions')
    .insert({ user_id: userId, email: userEmail, message })

  if (insertError) {
    console.error('Failed to store help question', { message: insertError.message })
    return jsonResponse({ error: 'Kunde inte spara frågan' }, 500)
  }

  try {
    const result = await sendTemplateEmail('help-question', '', {
      templateData: {
        email: userEmail ?? 'Okänd användare',
        message,
        createdAt,
      },
      // Reply goes straight back to the user who asked.
      replyTo: userEmail ?? undefined,
      // One email per stored question; retries of the same submit dedupe.
      idempotencyKey: `help-question-${userId}-${createdAt}`,
    })

    if (!result.sent) {
      console.log('Help question email not sent', { reason: result.reason })
    }
  } catch (error) {
    // The question is safely stored — an email failure should not block the user.
    console.error('Help question email failed', {
      message: error instanceof Error ? error.message : String(error),
    })
  }

  return jsonResponse({ sent: true })
})
