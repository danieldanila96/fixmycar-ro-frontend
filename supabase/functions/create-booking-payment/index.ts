import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

interface PaymentRequest {
  quoteId: string;
  jobId: string;
  amount: number;
  garageName: string;
  jobDescription: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { quoteId, jobId, amount, garageName, jobDescription }: PaymentRequest = await req.json();
    logStep("Payment request received", { quoteId, jobId, amount, garageName });

    if (!quoteId || !jobId || !amount) {
      throw new Error("Missing required fields: quoteId, jobId, or amount");
    }

    // Verify the quote exists and belongs to this job
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .select('id, price, garage_id, status')
      .eq('id', quoteId)
      .eq('job_id', jobId)
      .single();

    if (quoteError || !quote) {
      throw new Error("Quote not found or does not match job");
    }

    if (quote.status !== 'sent') {
      throw new Error("Quote has already been processed");
    }

    logStep("Quote verified", { quotePrice: quote.price });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://uroascmshcvsnyhzinjw.lovableproject.com";
    
    // Create checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'ron',
            product_data: {
              name: `Reparație auto - ${garageName}`,
              description: jobDescription.substring(0, 200),
            },
            unit_amount: Math.round(amount * 100), // Convert to bani (RON cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&quote_id=${quoteId}&job_id=${jobId}`,
      cancel_url: `${origin}/cereri/${jobId}`,
      metadata: {
        quoteId,
        jobId,
        userId: user.id,
        garageId: quote.garage_id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
