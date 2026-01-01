import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KYCNotificationRequest {
  garageId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { garageId, status, rejectionReason }: KYCNotificationRequest = await req.json();
    
    console.log(`Processing KYC notification for garage: ${garageId}, status: ${status}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch garage profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, full_name')
      .eq('user_id', garageId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Could not fetch garage profile");
    }

    // Fetch user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(garageId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user email:", userError);
      throw new Error("Could not fetch user email");
    }

    const userEmail = userData.user.email;
    const businessName = profile.business_name || profile.full_name || 'Service-ul dumneavoastră';

    let subject: string;
    let emailHtml: string;

    if (status === 'approved') {
      subject = '✅ Verificarea KYC a fost aprobată - AutoService';
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .benefit-item { display: flex; align-items: center; margin: 10px 0; }
            .check-icon { color: #22c55e; margin-right: 10px; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .cta-button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Felicitări!</h1>
              <p>Verificarea KYC a fost finalizată cu succes</p>
            </div>
            <div class="content">
              <div class="success-box">
                <strong>Contul ${businessName} a fost verificat și aprobat!</strong>
              </div>
              
              <p>Bună ziua,</p>
              <p>Suntem încântați să vă anunțăm că verificarea documentelor pentru <strong>${businessName}</strong> a fost finalizată cu succes.</p>
              
              <div class="benefits">
                <h3>Ce înseamnă asta pentru dumneavoastră:</h3>
                <div class="benefit-item">
                  <span class="check-icon">✓</span>
                  <span>Badge-ul "Verificat" va fi afișat pe profilul dumneavoastră</span>
                </div>
                <div class="benefit-item">
                  <span class="check-icon">✓</span>
                  <span>Clienții vor avea mai multă încredere în serviciile dumneavoastră</span>
                </div>
                <div class="benefit-item">
                  <span class="check-icon">✓</span>
                  <span>Profilul dumneavoastră va fi prioritizat în rezultatele căutării</span>
                </div>
              </div>
              
              <p>Vă mulțumim că faceți parte din comunitatea AutoService!</p>
              
              <p>Cu stimă,<br>Echipa AutoService</p>
              
              <div class="footer">
                <p>Acest email a fost trimis automat. Dacă aveți întrebări, contactați-ne.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = '❌ Verificarea KYC necesită atenție - AutoService';
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .reason-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .next-steps { background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .cta-button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Atenție necesară</h1>
              <p>Verificarea KYC nu a putut fi finalizată</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>Verificarea pentru ${businessName} a fost respinsă.</strong>
              </div>
              
              <p>Bună ziua,</p>
              <p>Din păcate, verificarea documentelor pentru <strong>${businessName}</strong> nu a putut fi finalizată.</p>
              
              <div class="reason-box">
                <h3>Motivul respingerii:</h3>
                <p>${rejectionReason || 'Nu a fost specificat un motiv detaliat.'}</p>
              </div>
              
              <div class="next-steps">
                <h3>Pași următori:</h3>
                <ol>
                  <li>Verificați documentele încărcate conform motivului de mai sus</li>
                  <li>Asigurați-vă că toate documentele sunt lizibile și valide</li>
                  <li>Încărcați documentele corectate în contul dumneavoastră</li>
                  <li>Trimiteți din nou cererea de verificare</li>
                </ol>
              </div>
              
              <p>Dacă aveți întrebări sau considerați că a existat o eroare, vă rugăm să ne contactați.</p>
              
              <p>Cu stimă,<br>Echipa AutoService</p>
              
              <div class="footer">
                <p>Acest email a fost trimis automat. Dacă aveți întrebări, contactați-ne.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    console.log(`Sending KYC ${status} email to ${userEmail}`);

    const { error: emailError } = await resend.emails.send({
      from: "AutoService <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log(`KYC notification email sent successfully to ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-kyc-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
