import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  jobId: string;
  quoteId: string;
  customerId: string;
  garageId: string;
  price: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, quoteId, customerId, garageId, price }: BookingConfirmationRequest = await req.json();
    
    console.log("Processing booking confirmation:", { jobId, quoteId, customerId, garageId });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, car_make, car_model, car_year, category, description")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job:", jobError);
      throw new Error("Job not found");
    }

    // Get customer info
    const { data: customerAuth } = await supabase.auth.admin.getUserById(customerId);
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", customerId)
      .single();

    // Get garage info
    const { data: garageAuth } = await supabase.auth.admin.getUserById(garageId);
    const { data: garageProfile } = await supabase
      .from("profiles")
      .select("business_name, full_name, phone, business_address, city, county")
      .eq("user_id", garageId)
      .single();

    if (!customerAuth?.user?.email || !garageAuth?.user?.email) {
      throw new Error("Email addresses not found");
    }

    const customerName = customerProfile?.full_name || "Client";
    const customerEmail = customerAuth.user.email;
    const customerPhone = customerProfile?.phone || "N/A";
    
    const garageName = garageProfile?.business_name || garageProfile?.full_name || "Service Auto";
    const garageEmail = garageAuth.user.email;
    const garagePhone = garageProfile?.phone || "N/A";
    const garageAddress = [garageProfile?.business_address, garageProfile?.city, garageProfile?.county]
      .filter(Boolean)
      .join(", ");
    
    const carInfo = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(" ");

    // Email to Customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rezervare Confirmată</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✅ Rezervare Confirmată!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Bună ${customerName},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Rezervarea ta a fost confirmată cu succes! <strong>${garageName}</strong> va efectua lucrarea pentru vehiculul tău.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #16a34a; font-size: 18px;">Detalii Rezervare</h3>
            
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
                <td style="padding: 8px 0; color: #64748b;">Preț convenit:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #16a34a; font-size: 18px;">${price} RON</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">📍 Detalii Service</h3>
            <p style="margin: 0 0 8px 0; font-weight: 600;">${garageName}</p>
            ${garageAddress ? `<p style="margin: 0 0 8px 0; color: #64748b;">${garageAddress}</p>` : ''}
            ${garagePhone !== 'N/A' ? `<p style="margin: 0;"><a href="tel:${garagePhone}" style="color: #16a34a;">📞 ${garagePhone}</a></p>` : ''}
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
            Service-ul te va contacta în curând pentru a stabili data și ora programării.
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

    // Email to Garage
    const garageEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouă Rezervare</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Nouă Rezervare!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Bună ziua,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Ai primit o nouă rezervare! Clientul a acceptat oferta ta și a efectuat plata.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">Detalii Lucrare</h3>
            
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
                <td style="padding: 8px 0; color: #64748b;">Preț convenit:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #16a34a; font-size: 18px;">${price} RON</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bfdbfe;">
            <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">👤 Detalii Client</h3>
            <p style="margin: 0 0 8px 0; font-weight: 600;">${customerName}</p>
            <p style="margin: 0 0 8px 0;"><a href="mailto:${customerEmail}" style="color: #3b82f6;">📧 ${customerEmail}</a></p>
            ${customerPhone !== 'N/A' ? `<p style="margin: 0;"><a href="tel:${customerPhone}" style="color: #3b82f6;">📞 ${customerPhone}</a></p>` : ''}
          </div>
          
          <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
              ⚡ Te rugăm să contactezi clientul pentru a stabili data și ora programării
            </p>
          </div>
        </div>
        
        <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            Acest email a fost trimis automat. Te rugăm să nu răspunzi direct la acest mesaj.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email to customer
    const { error: customerEmailError } = await resend.emails.send({
      from: "AutoService <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `✅ Rezervare confirmată - ${carInfo}`,
      html: customerEmailHtml,
    });

    if (customerEmailError) {
      console.error("Error sending customer email:", customerEmailError);
    } else {
      console.log("Customer confirmation email sent to:", customerEmail);
    }

    // Send email to garage
    const { error: garageEmailError } = await resend.emails.send({
      from: "AutoService <onboarding@resend.dev>",
      to: [garageEmail],
      subject: `🎉 Nouă rezervare - ${carInfo}`,
      html: garageEmailHtml,
    });

    if (garageEmailError) {
      console.error("Error sending garage email:", garageEmailError);
    } else {
      console.log("Garage notification email sent to:", garageEmail);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Booking confirmation emails sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
