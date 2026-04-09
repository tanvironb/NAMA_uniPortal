import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  nationality: string;
  gender: string;
  level_of_study: string;
  preferred_country: string;
  field_of_study: string;
  selected_universities: Array<{ university_name: string; country: string }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!supabaseServiceKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const {
      email,
      password,
      first_name,
      last_name,
      nationality,
      gender,
      level_of_study,
      preferred_country,
      field_of_study,
      selected_universities
    }: RegisterRequest = await req.json();

    console.log('Creating user:', { email, first_name, last_name });

    // Create user with confirmed email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    console.log('User created with ID:', authData.user.id);

    // Create student record
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: authData.user.id,
        email,
        first_name,
        last_name,
        nationality,
        gender,
        level_of_study,
        preferred_country,
        field_of_study,
        status: 'pending'
      });

    if (studentError) {
      console.error('Student record error:', studentError);
      throw studentError;
    }

    console.log('Student record created');

    // Insert university selections
    for (const university of selected_universities) {
      const { error: selectionError } = await supabaseAdmin
        .from('student_university_selections')
        .insert({
          student_id: authData.user.id,
          university_name: university.university_name,
          country: university.country
        });

      if (selectionError) {
        console.error('University selection error:', selectionError);
        // Don't throw here, continue with other selections
      }
    }

    console.log('University selections added');

    return new Response(
      JSON.stringify({ success: true, user_id: authData.user.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in register-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);