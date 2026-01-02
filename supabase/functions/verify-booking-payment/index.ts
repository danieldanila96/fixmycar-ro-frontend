import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

interface VerifyRequest {
  sessionId: string;
  quoteId: string;
  jobId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId, quoteId, jobId }: VerifyRequest = await req.json();
    logStep("Verify request received", { sessionId, quoteId, jobId });

    if (!sessionId || !quoteId || !jobId) {
      throw new Error("Missing required fields");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Checkout session retrieved", { 
      status: session.status, 
      paymentStatus: session.payment_status 
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Verify the session metadata matches
    if (session.metadata?.quoteId !== quoteId || session.metadata?.jobId !== jobId) {
      throw new Error("Session metadata mismatch");
    }

    // Update the quote status to accepted
    const { error: quoteUpdateError } = await supabaseClient
      .from('quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    if (quoteUpdateError) {
      logStep("Quote update error", { error: quoteUpdateError });
      throw new Error("Failed to update quote status");
    }
    logStep("Quote status updated to accepted");

    // Reject all other quotes for this job
    const { error: rejectError } = await supabaseClient
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('job_id', jobId)
      .neq('id', quoteId);

    if (rejectError) {
      logStep("Reject other quotes error", { error: rejectError });
    }
    logStep("Other quotes rejected");

    // Update job status to booked
    const { error: jobUpdateError } = await supabaseClient
      .from('jobs')
      .update({ status: 'booked' })
      .eq('id', jobId);

    if (jobUpdateError) {
      logStep("Job update error", { error: jobUpdateError });
      throw new Error("Failed to update job status");
    }
    logStep("Job status updated to booked");

    // Create booking record
    const { data: quote } = await supabaseClient
      .from('quotes')
      .select('garage_id, price')
      .eq('id', quoteId)
      .single();

    const { error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        job_id: jobId,
        quote_id: quoteId,
        payment_status: 'paid',
        payment_intent_id: session.payment_intent as string,
        scheduled_date: new Date().toISOString().split('T')[0], // Default to today, can be updated later
      });

    if (bookingError) {
      logStep("Booking creation error", { error: bookingError });
      // Don't throw here, payment was successful
    } else {
      logStep("Booking record created");
    }

    // Send booking confirmation emails (non-blocking)
    if (quote) {
      logStep("Sending booking confirmation emails");
      
      // Get job owner
      const { data: jobData } = await supabaseClient
        .from('jobs')
        .select('user_id')
        .eq('id', jobId)
        .single();

      if (jobData) {
        // Call the send-booking-confirmation function
        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-confirmation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              jobId,
              quoteId,
              customerId: jobData.user_id,
              garageId: quote.garage_id,
              price: quote.price,
            }),
          }
        );
        
        if (!response.ok) {
          logStep("Booking confirmation email error", { status: response.status });
        } else {
          logStep("Booking confirmation emails sent");
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment verified and booking confirmed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
