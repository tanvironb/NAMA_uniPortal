import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  serial_code: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { serial_code }: VerificationRequest = await req.json();

    if (!serial_code) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Serial code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Verifying serial code: ${serial_code}`);

    // Lookup certificate by serial code
    const { data: certificate, error: certError } = await supabaseClient
      .from('certificates')
      .select(`
        id,
        serial_code,
        auth_signature,
        application_id,
        created_at
      `)
      .eq('serial_code', serial_code)
      .maybeSingle();

    if (certError) {
      console.error('Certificate lookup error:', certError);
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!certificate) {
      console.log('Certificate not found');
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recompute auth signature to verify authenticity
    const { data: computedSig, error: sigError } = await supabaseClient
      .rpc('compute_auth_signature', {
        serial: certificate.serial_code,
        app_id: certificate.application_id
      });

    if (sigError || computedSig !== certificate.auth_signature) {
      console.error('Signature mismatch or error:', sigError);
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch limited application details
    const { data: application, error: appError } = await supabaseClient
      .from('scholarship_applications')
      .select(`
        full_name,
        university_name,
        course_title,
        level_of_study,
        education_field
      `)
      .eq('id', certificate.application_id)
      .single();

    if (appError || !application) {
      console.error('Application lookup error:', appError);
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return limited details
    return new Response(
      JSON.stringify({
        valid: true,
        studentName: application.full_name,
        universityName: application.university_name,
        courseTitle: application.course_title,
        fieldOfStudy: application.education_field || application.level_of_study,
        issueDate: new Date(certificate.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
