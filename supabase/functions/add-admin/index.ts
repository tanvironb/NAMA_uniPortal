import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify requester is admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !requester) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc('is_admin', { uid: requester.id })
    if (adminCheckError || !isAdmin) {
      console.error('Admin check failed:', adminCheckError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email } = await req.json()
    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Lookup user by email in Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to lookup user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!targetUser) {
      return new Response(
        JSON.stringify({ ok: false, error: 'not_found', message: 'No Supabase user with this email. Ask them to sign up first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert or update admin_users
    const { error: insertError } = await supabaseAdmin
      .from('admin_users')
      .upsert(
        { 
          user_id: targetUser.id, 
          email: targetUser.email,
          role: 'admin' 
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )

    if (insertError) {
      console.error('Error inserting admin:', insertError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to add admin' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully added admin: ${email}`)
    
    return new Response(
      JSON.stringify({ ok: true, message: 'Admin added successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
