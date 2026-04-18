// supabase/functions/send-status-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY secret" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, firstName, lastName, status } = await req.json();

    if (!email || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fullName =
      [firstName, lastName].filter(Boolean).join(" ").trim() || "Student";

    let subject = "";
    let html = "";

    if (status === "approved") {
      subject = "Your NAMA Uni Scholarship account has been approved";
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>NAMA Uni Scholarship</h2>
          <p>Dear ${fullName},</p>
          <p>We are pleased to inform you that your account has been <strong>approved</strong>.</p>
          <p>You may now sign in and continue using the portal.</p>
          <p>
            <a href="https://uni-scholarship.namafoundation.org/login"
               style="display:inline-block;padding:10px 16px;background:#1d2a8a;color:#ffffff;text-decoration:none;border-radius:6px;">
              Go to Login
            </a>
          </p>
          <p>Best regards,<br>NAMA Uni Scholarship Team</p>
        </div>
      `;
    } else if (status === "rejected") {
      subject = "Your NAMA Uni Scholarship account application was not approved";
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>NAMA Uni Scholarship</h2>
          <p>Dear ${fullName},</p>
          <p>We regret to inform you that your account application was <strong>not approved</strong> at this time.</p>
          <p>If needed, please contact the administrator for more information.</p>
          <p>Best regards,<br>NAMA Uni Scholarship Team</p>
        </div>
      `;
    } else if (status === "scholarship_approved") {
      subject = "Your scholarship application has been approved";
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>NAMA Uni Scholarship</h2>
          <p>Dear ${fullName},</p>
          <p>We are pleased to inform you that your <strong>scholarship application has been approved</strong>.</p>
          <p>Please sign in to the portal to view your application and continue with the next steps.</p>
          <p>
            <a href="https://uni-scholarship.namafoundation.org/login"
               style="display:inline-block;padding:10px 16px;background:#1d2a8a;color:#ffffff;text-decoration:none;border-radius:6px;">
              Go to Login
            </a>
          </p>
          <p>Best regards,<br>NAMA Uni Scholarship Team</p>
        </div>
      `;
    } else if (status === "scholarship_rejected") {
      subject = "Your scholarship application was not approved";
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>NAMA Uni Scholarship</h2>
          <p>Dear ${fullName},</p>
          <p>We regret to inform you that your <strong>scholarship application was not approved</strong> at this time.</p>
          <p>Please sign in to the portal if you would like to review your application details.</p>
          <p>
            <a href="https://uni-scholarship.namafoundation.org/login"
               style="display:inline-block;padding:10px 16px;background:#1d2a8a;color:#ffffff;text-decoration:none;border-radius:6px;">
              Go to Login
            </a>
          </p>
          <p>Best regards,<br>NAMA Uni Scholarship Team</p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NAMA Uni Scholarship <uni-scholarship@namafoundation.org>",
        to: [email],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, result: resendData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});