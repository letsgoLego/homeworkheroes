import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's family
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('family_id')
      .eq('user_id', user.id)
      .not('family_id', 'is', null)
      .limit(1);

    const familyId = roles?.[0]?.family_id;

    // Check if we can use cached data (unless force refresh requested)
    let body: any = {};
    try { body = await req.json(); } catch {}
    const forceRefresh = body?.force === true;

    if (familyId && !forceRefresh) {
      const { data: familyData } = await supabaseClient
        .from('families')
        .select('subscription_override, subscription_status, subscription_end, subscription_interval, subscription_checked_at')
        .eq('id', familyId)
        .maybeSingle();

      // Gifted → return immediately
      if (familyData?.subscription_override === 'gifted') {
        logStep("Family has gifted override, returning early");
        return new Response(JSON.stringify({
          subscribed: true,
          status: 'gifted',
          subscription_end: null,
          interval: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check if cache is still fresh
      if (familyData?.subscription_checked_at) {
        const checkedAt = new Date(familyData.subscription_checked_at).getTime();
        const age = Date.now() - checkedAt;
        if (age < CACHE_MAX_AGE_MS) {
          logStep("Returning cached subscription data", { ageMinutes: Math.round(age / 60000) });
          const cachedStatus = familyData.subscription_status || 'free';
          const cachedEnd = familyData.subscription_end;
          const isSubscribed = cachedStatus === 'active' || 
            (cachedStatus === 'canceled' && cachedEnd && new Date(cachedEnd) > new Date());
          return new Response(JSON.stringify({
            subscribed: isSubscribed,
            status: cachedStatus,
            subscription_end: cachedEnd,
            interval: familyData.subscription_interval,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // Cache is stale or missing — query Stripe
    logStep("Cache stale, querying Stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      // Update cache
      if (familyId) {
        await supabaseClient.from('families').update({
          subscription_status: 'free',
          subscription_end: null,
          subscription_interval: null,
          subscription_checked_at: new Date().toISOString(),
        }).eq('id', familyId);
      }
      return new Response(JSON.stringify({ subscribed: false, status: 'free', subscription_end: null, interval: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const canceledSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "canceled",
      limit: 1,
    });

    let subscribed = false;
    let subscriptionEnd: string | null = null;
    let resultStatus: "free" | "active" | "canceled" = "free";
    let interval: string | null = null;

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      subscribed = true;
      resultStatus = "active";
      subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      interval = sub.items.data[0]?.price?.recurring?.interval || null;
      logStep("Active subscription found", { subscriptionId: sub.id, interval });
    } else if (canceledSubs.data.length > 0) {
      const sub = canceledSubs.data[0];
      const endDate = new Date(sub.current_period_end * 1000);
      if (endDate > new Date()) {
        subscribed = true;
        resultStatus = "canceled";
        subscriptionEnd = endDate.toISOString();
        interval = sub.items.data[0]?.price?.recurring?.interval || null;
        logStep("Canceled but still active subscription", { endDate: subscriptionEnd });
      }
    }

    // Update cache
    if (familyId) {
      await supabaseClient.from('families').update({
        subscription_status: resultStatus,
        subscription_end: subscriptionEnd,
        subscription_interval: interval,
        subscription_checked_at: new Date().toISOString(),
      }).eq('id', familyId);
      logStep("Cache updated");
    }

    return new Response(JSON.stringify({
      subscribed,
      status: resultStatus,
      subscription_end: subscriptionEnd,
      interval,
    }), {
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
