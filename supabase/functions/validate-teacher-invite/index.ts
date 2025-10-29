import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { inviteCode } = await req.json()

    if (!inviteCode || typeof inviteCode !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid invite code format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client with service role for validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Hash the provided code
    const encoder = new TextEncoder()
    const data = encoder.encode(inviteCode)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Check if the hashed code exists and is active
    const { data: inviteData, error } = await supabase
      .from('teacher_invite_codes')
      .select('is_active')
      .eq('code_hash', codeHash)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ valid: false, error: 'Validation failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const isValid = inviteData?.is_active === true

    return new Response(
      JSON.stringify({ valid: isValid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in validate-teacher-invite:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
