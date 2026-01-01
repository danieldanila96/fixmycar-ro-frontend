import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ITPReminder {
  id: string;
  user_id: string;
  vin: string;
  civ: string | null;
  car_make: string | null;
  car_model: string | null;
  itp_expiry_date: string;
  reminder_sent_30_days: boolean;
  reminder_sent_7_days: boolean;
  reminder_sent_1_day: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Fetch reminders that need to be sent
    const { data: reminders, error: fetchError } = await supabase
      .from('itp_reminders')
      .select('*')
      .or(`and(itp_expiry_date.eq.${formatDate(in30Days)},reminder_sent_30_days.eq.false),and(itp_expiry_date.eq.${formatDate(in7Days)},reminder_sent_7_days.eq.false),and(itp_expiry_date.eq.${formatDate(in1Day)},reminder_sent_1_day.eq.false)`);

    if (fetchError) {
      console.error("Error fetching ITP reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${reminders?.length || 0} ITP reminders to process`);

    const results: { sent: number; errors: string[] } = { sent: 0, errors: [] };

    for (const reminder of (reminders as ITPReminder[]) || []) {
      try {
        // Get user email from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(reminder.user_id);
        
        if (userError || !userData?.user?.email) {
          console.error(`Could not get email for user ${reminder.user_id}:`, userError);
          results.errors.push(`User ${reminder.user_id}: Could not get email`);
          continue;
        }

        const userEmail = userData.user.email;
        const expiryDate = new Date(reminder.itp_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        const carInfo = [reminder.car_make, reminder.car_model].filter(Boolean).join(' ') || 'vehiculul dumneavoastră';
        const vinInfo = reminder.vin ? ` (VIN: ${reminder.vin})` : '';

        let urgencyText = '';
        let subjectPrefix = '';
        if (daysUntilExpiry <= 1) {
          urgencyText = 'MÂINE';
          subjectPrefix = '⚠️ URGENT: ';
        } else if (daysUntilExpiry <= 7) {
          urgencyText = `în ${daysUntilExpiry} zile`;
          subjectPrefix = '⏰ ';
        } else {
          urgencyText = `în ${daysUntilExpiry} de zile`;
          subjectPrefix = '';
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .alert-box { background: ${daysUntilExpiry <= 1 ? '#fef2f2' : daysUntilExpiry <= 7 ? '#fffbeb' : '#f0fdf4'}; border-left: 4px solid ${daysUntilExpiry <= 1 ? '#ef4444' : daysUntilExpiry <= 7 ? '#f59e0b' : '#22c55e'}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
              .car-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
              .date-highlight { font-size: 24px; font-weight: bold; color: #f97316; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
              .cta-button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Memento ITP</h1>
                <p>Inspecția Tehnică Periodică</p>
              </div>
              <div class="content">
                <div class="alert-box">
                  <strong>ITP-ul expiră ${urgencyText}!</strong>
                </div>
                
                <p>Bună ziua,</p>
                <p>Vă reamintim că Inspecția Tehnică Periodică pentru <strong>${carInfo}</strong>${vinInfo} expiră în curând.</p>
                
                <div class="car-info">
                  <p><strong>Data expirării:</strong></p>
                  <p class="date-highlight">${expiryDate.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  ${reminder.civ ? `<p><strong>CIV:</strong> ${reminder.civ}</p>` : ''}
                </div>
                
                <p>Vă recomandăm să programați verificarea ITP cât mai curând pentru a evita eventualele penalizări.</p>
                
                <p>Cu stimă,<br>Echipa AutoService</p>
                
                <div class="footer">
                  <p>Acest email a fost trimis automat. Dacă nu doriți să mai primiți aceste notificări, vă rugăm să accesați setările contului.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const { error: emailError } = await resend.emails.send({
          from: "AutoService <onboarding@resend.dev>",
          to: [userEmail],
          subject: `${subjectPrefix}ITP-ul pentru ${carInfo} expiră ${urgencyText}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Error sending email to ${userEmail}:`, emailError);
          results.errors.push(`${userEmail}: ${emailError.message}`);
          continue;
        }

        // Update the reminder flag based on days until expiry
        const updateField = daysUntilExpiry <= 1 
          ? 'reminder_sent_1_day' 
          : daysUntilExpiry <= 7 
            ? 'reminder_sent_7_days' 
            : 'reminder_sent_30_days';

        const { error: updateError } = await supabase
          .from('itp_reminders')
          .update({ [updateField]: true })
          .eq('id', reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
        }

        console.log(`Sent ${daysUntilExpiry}-day ITP reminder to ${userEmail} for ${carInfo}`);
        results.sent++;

      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        results.errors.push(`Reminder ${reminder.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`ITP reminders complete: ${results.sent} sent, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.sent,
        errors: results.errors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-itp-reminders function:", error);
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
