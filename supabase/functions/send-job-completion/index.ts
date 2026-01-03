import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobCompletionRequest {
  jobId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId }: JobCompletionRequest = await req.json();
    
    console.log("Processing job completion notification:", { jobId });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job details with accepted quote
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, car_make, car_model, car_year, category, description, user_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job:", jobError);
      throw new Error("Job not found");
    }

    // Get accepted quote with garage info
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, price, garage_id")
      .eq("job_id", jobId)
      .eq("status", "accepted")
      .single();

    if (quoteError || !quote) {
      console.error("Error fetching accepted quote:", quoteError);
      throw new Error("Accepted quote not found");
    }

    // Check garage notification preferences
    const { data: garagePrefs } = await supabase
      .from("notification_preferences")
      .select("email_quote_accepted")
      .eq("user_id", quote.garage_id)
      .single();

    // If garage has disabled this notification, skip sending
    if (garagePrefs && !garagePrefs.email_quote_accepted) {
      console.log("Garage has disabled job completion notifications, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped - disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get customer info
    const { data: customerAuth } = await supabase.auth.admin.getUserById(job.user_id);
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", job.user_id)
      .single();

    // Get garage info
    const { data: garageAuth } = await supabase.auth.admin.getUserById(quote.garage_id);
    const { data: garageProfile } = await supabase
      .from("profiles")
      .select("business_name, full_name")
      .eq("user_id", quote.garage_id)
      .single();

    if (!garageAuth?.user?.email) {
      throw new Error("Garage email not found");
    }

    const customerName = customerProfile?.full_name || "Client";
    const garageName = garageProfile?.business_name || garageProfile?.full_name || "Service Auto";
    const garageEmail = garageAuth.user.email;
    const carInfo = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(" ");

    // Email to Garage about job completion
    const garageEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lucrare Finalizată</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Lucrare Finalizată cu Succes!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Bună ziua,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Clientul <strong>${customerName}</strong> a marcat lucrarea ca finalizată! Felicitări pentru un serviciu de calitate! 🌟
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #16a34a; font-size: 18px;">Detalii Lucrare</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Vehicul:</td>
                <td style="padding: 8px 0; font-weight: 600;">${carInfo}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Categorie:</td>
                <td style="padding: 8px 0; font-weight: 600;">${job.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Preț:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #16a34a; font-size: 18px;">${quote.price} RON</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 18px;">⭐ Recenzie în Așteptare</p>
            <p style="margin: 0; color: #166534; font-size: 14px;">
              Clientul poate acum să lase o recenzie pentru serviciul tău. Recenziile pozitive ajută la creșterea vizibilității tale!
            </p>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
            Mulțumim că faci parte din comunitatea noastră de service-uri auto de încredere!
          </p>
        </div>
        
        <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            Acest email a fost trimis automat. Te rugăm să nu răspunzi direct la acest mesaj.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email to garage
    const { error: emailError } = await resend.emails.send({
      from: "AutoService <onboarding@resend.dev>",
      to: [garageEmail],
      subject: `🎉 Lucrare finalizată - ${carInfo}`,
      html: garageEmailHtml,
    });

    if (emailError) {
      console.error("Error sending garage email:", emailError);
      throw new Error("Failed to send email");
    }

    console.log("Job completion email sent to:", garageEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Job completion notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-job-completion:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
