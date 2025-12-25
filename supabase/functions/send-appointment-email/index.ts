import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentEmailRequest {
  appointmentId: string;
  type: "new" | "confirmed" | "cancelled";
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-appointment-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, type }: AppointmentEmailRequest = await req.json();
    console.log(`Processing ${type} email for appointment: ${appointmentId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error("Error fetching appointment:", appointmentError);
      throw new Error("Appointment not found");
    }

    // Fetch customer profile
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("full_name, user_id")
      .eq("user_id", appointment.customer_id)
      .single();

    if (customerError) {
      console.error("Error fetching customer:", customerError);
    }

    // Fetch customer email from auth
    const { data: customerAuth, error: customerAuthError } = await supabase.auth.admin.getUserById(
      appointment.customer_id
    );

    if (customerAuthError || !customerAuth?.user?.email) {
      console.error("Error fetching customer email:", customerAuthError);
      throw new Error("Customer email not found");
    }

    // Fetch garage profile
    const { data: garage, error: garageError } = await supabase
      .from("profiles")
      .select("business_name, phone, business_address, user_id")
      .eq("user_id", appointment.garage_id)
      .single();

    if (garageError) {
      console.error("Error fetching garage:", garageError);
    }

    // Fetch garage email
    const { data: garageAuth, error: garageAuthError } = await supabase.auth.admin.getUserById(
      appointment.garage_id
    );

    const customerName = customer?.full_name || "Client";
    const customerEmail = customerAuth.user.email;
    const garageName = garage?.business_name || "Service Auto";
    const garageEmail = garageAuth?.user?.email;
    const garagePhone = garage?.phone || "";
    const garageAddress = garage?.business_address || "";

    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString("ro-RO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let subject = "";
    let customerHtml = "";
    let garageHtml = "";

    if (type === "new") {
      subject = `Programare nouă - ${formattedDate}`;
      
      customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Programare înregistrată!</h1>
          <p>Bună ${customerName},</p>
          <p>Programarea ta a fost înregistrată cu succes și așteaptă confirmare de la service.</p>
          
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalii programare:</h3>
            <p><strong>Service:</strong> ${garageName}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Ora:</strong> ${appointment.appointment_time}</p>
            <p><strong>Serviciu:</strong> ${appointment.service_type}</p>
            ${appointment.notes ? `<p><strong>Note:</strong> ${appointment.notes}</p>` : ""}
          </div>
          
          <p>Vei primi o confirmare prin email când service-ul va accepta programarea.</p>
          
          <p style="color: #666; font-size: 14px;">Cu stimă,<br>Echipa ServiceAuto</p>
        </div>
      `;

      garageHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Programare nouă!</h1>
          <p>Aveți o nouă cerere de programare.</p>
          
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalii programare:</h3>
            <p><strong>Client:</strong> ${customerName}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Ora:</strong> ${appointment.appointment_time}</p>
            <p><strong>Serviciu:</strong> ${appointment.service_type}</p>
            ${appointment.notes ? `<p><strong>Note:</strong> ${appointment.notes}</p>` : ""}
          </div>
          
          <p>Accesați dashboard-ul pentru a confirma sau respinge programarea.</p>
          
          <p style="color: #666; font-size: 14px;">Cu stimă,<br>Echipa ServiceAuto</p>
        </div>
      `;
    } else if (type === "confirmed") {
      subject = `Programare confirmată - ${formattedDate}`;
      
      customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Programare confirmată! ✓</h1>
          <p>Bună ${customerName},</p>
          <p>Programarea ta a fost confirmată de către ${garageName}.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #22c55e;">
            <h3 style="margin-top: 0; color: #166534;">Detalii programare:</h3>
            <p><strong>Service:</strong> ${garageName}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Ora:</strong> ${appointment.appointment_time}</p>
            <p><strong>Serviciu:</strong> ${appointment.service_type}</p>
            ${garageAddress ? `<p><strong>Adresă:</strong> ${garageAddress}</p>` : ""}
            ${garagePhone ? `<p><strong>Telefon:</strong> ${garagePhone}</p>` : ""}
          </div>
          
          <p>Te așteptăm la data și ora programată!</p>
          
          <p style="color: #666; font-size: 14px;">Cu stimă,<br>Echipa ServiceAuto</p>
        </div>
      `;
    } else if (type === "cancelled") {
      subject = `Programare anulată - ${formattedDate}`;
      
      customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Programare anulată</h1>
          <p>Bună ${customerName},</p>
          <p>Din păcate, programarea ta a fost anulată.</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ef4444;">
            <h3 style="margin-top: 0; color: #991b1b;">Detalii programare anulată:</h3>
            <p><strong>Service:</strong> ${garageName}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Ora:</strong> ${appointment.appointment_time}</p>
          </div>
          
          <p>Poți face o nouă programare oricând.</p>
          
          <p style="color: #666; font-size: 14px;">Cu stimă,<br>Echipa ServiceAuto</p>
        </div>
      `;
    }

    // Send email to customer
    const customerEmailResult = await resend.emails.send({
      from: "ServiceAuto <onboarding@resend.dev>",
      to: [customerEmail],
      subject: subject,
      html: customerHtml,
    });
    console.log("Customer email sent:", customerEmailResult);

    // Send email to garage for new appointments
    if (type === "new" && garageEmail) {
      const garageEmailResult = await resend.emails.send({
        from: "ServiceAuto <onboarding@resend.dev>",
        to: [garageEmail],
        subject: `Programare nouă de la ${customerName}`,
        html: garageHtml,
      });
      console.log("Garage email sent:", garageEmailResult);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-email function:", error);
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
