import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteNotificationRequest {
  quoteId: string;
  jobId: string;
  garageId: string;
  price: number;
  estimatedDays?: number;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, jobId, garageId, price, estimatedDays, message }: QuoteNotificationRequest = await req.json();
    
    console.log("Processing quote notification:", { quoteId, jobId, garageId, price });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job details with customer info
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, car_make, car_model, car_year, category, description, user_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job:", jobError);
      throw new Error("Job not found");
    }

    // Get customer email from auth
    const { data: customerAuth, error: customerAuthError } = await supabase.auth.admin.getUserById(job.user_id);
    
    if (customerAuthError || !customerAuth.user?.email) {
      console.error("Error fetching customer auth:", customerAuthError);
      throw new Error("Customer email not found");
    }

    // Get customer profile for name
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", job.user_id)
      .single();

    // Get garage profile
    const { data: garageProfile, error: garageError } = await supabase
      .from("profiles")
      .select("business_name, full_name, city, county, average_rating, total_reviews")
      .eq("user_id", garageId)
      .single();

    if (garageError || !garageProfile) {
      console.error("Error fetching garage:", garageError);
      throw new Error("Garage not found");
    }

    const customerName = customerProfile?.full_name || "Client";
    const customerEmail = customerAuth.user.email;
    const garageName = garageProfile.business_name || garageProfile.full_name || "Service auto";
    const garageLocation = [garageProfile.city, garageProfile.county].filter(Boolean).join(", ");
    const carInfo = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(" ");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ofertă nouă primită</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Ofertă Nouă Primită!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Bună ${customerName},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Vești bune! <strong>${garageName}</strong>${garageLocation ? ` din ${garageLocation}` : ''} a trimis o ofertă pentru cererea ta.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">Detalii Ofertă</h3>
            
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
                <td style="padding: 8px 0; color: #64748b;">Preț oferit:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #16a34a; font-size: 18px;">${price} RON</td>
              </tr>
              ${estimatedDays ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Durată estimată:</td>
                <td style="padding: 8px 0; font-weight: 600;">${estimatedDays} ${estimatedDays === 1 ? 'zi' : 'zile'}</td>
              </tr>
              ` : ''}
            </table>
            
            ${message ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">Mesaj de la service:</p>
              <p style="margin: 0; font-style: italic; color: #475569;">"${message}"</p>
            </div>
            ` : ''}
          </div>
          
          ${garageProfile.average_rating && garageProfile.total_reviews ? `
          <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #92400e;">
              ⭐ ${garageName} are rating ${garageProfile.average_rating}/5 bazat pe ${garageProfile.total_reviews} ${garageProfile.total_reviews === 1 ? 'recenzie' : 'recenzii'}
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://fixmycar-ro-frontend.lovable.app/cereri/${jobId}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Vezi Oferta
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
            Poți vedea toate ofertele primite și le poți compara în contul tău.
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

    const { error: emailError } = await resend.emails.send({
      from: "AutoService <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `💰 Ofertă nouă: ${price} RON pentru ${carInfo}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Quote notification email sent successfully to:", customerEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Quote notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-quote-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
