import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-appointment-reminders function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Checking for appointments on: ${tomorrowStr}`);

    // Fetch confirmed appointments for tomorrow
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", tomorrowStr)
      .eq("status", "confirmed");

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    console.log(`Found ${appointments?.length || 0} appointments for tomorrow`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No appointments to remind", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const appointment of appointments) {
      try {
        // Fetch customer info
        const { data: customer } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", appointment.customer_id)
          .single();

        // Fetch customer email
        const { data: customerAuth } = await supabase.auth.admin.getUserById(
          appointment.customer_id
        );

        if (!customerAuth?.user?.email) {
          console.error(`No email for customer: ${appointment.customer_id}`);
          continue;
        }

        // Fetch garage info
        const { data: garage } = await supabase
          .from("profiles")
          .select("business_name, phone, business_address")
          .eq("user_id", appointment.garage_id)
          .single();

        const customerName = customer?.full_name || "Client";
        const customerEmail = customerAuth.user.email;
        const garageName = garage?.business_name || "Service Auto";
        const garagePhone = garage?.phone || "";
        const garageAddress = garage?.business_address || "";

        const formattedDate = new Date(appointment.appointment_date).toLocaleDateString("ro-RO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const SERVICE_TYPES: Record<string, string> = {
          revizie: 'Revizie & Întreținere',
          mecanica: 'Mecanică generală',
          electrica: 'Electrică auto',
          caroserie: 'Tinichigerie & Vopsitorie',
          diagnoza: 'Diagnoză computerizată',
          clima: 'Aer condiționat',
          frane: 'Sistem de frânare',
          suspensie: 'Suspensie & Direcție',
          itp: 'Pregătire ITP',
          altele: 'Altele',
        };

        const serviceLabel = SERVICE_TYPES[appointment.service_type] || appointment.service_type;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">⏰ Reminder: Programare mâine!</h1>
            <p>Bună ${customerName},</p>
            <p>Îți reamintim că ai o programare mâine la ${garageName}.</p>
            
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Detalii programare:</h3>
              <p><strong>📅 Data:</strong> ${formattedDate}</p>
              <p><strong>🕐 Ora:</strong> ${appointment.appointment_time}</p>
              <p><strong>🔧 Serviciu:</strong> ${serviceLabel}</p>
              <p><strong>🏢 Service:</strong> ${garageName}</p>
              ${garageAddress ? `<p><strong>📍 Adresă:</strong> ${garageAddress}</p>` : ""}
              ${garagePhone ? `<p><strong>📞 Telefon:</strong> ${garagePhone}</p>` : ""}
            </div>
            
            <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
              <strong>💡 Sfat:</strong> Te rugăm să ajungi cu 5-10 minute înainte de ora programată.
            </p>
            
            <p>Dacă nu poți ajunge, te rugăm să contactezi service-ul cât mai curând pentru reprogramare.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Cu stimă,<br>Echipa ServiceAuto
            </p>
          </div>
        `;

        const emailResult = await resend.emails.send({
          from: "ServiceAuto <onboarding@resend.dev>",
          to: [customerEmail],
          subject: `⏰ Reminder: Programare mâine la ${garageName}`,
          html: emailHtml,
        });

        console.log(`Reminder sent to ${customerEmail}:`, emailResult);
        sentCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Error sending reminder for appointment ${appointment.id}:`, errorMsg);
        errors.push(`Appointment ${appointment.id}: ${errorMsg}`);
      }
    }

    console.log(`Sent ${sentCount} reminders, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentCount} reminder emails`,
        count: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
