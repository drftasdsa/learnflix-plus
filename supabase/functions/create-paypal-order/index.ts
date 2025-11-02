import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency } = await req.json();
    
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const PAYPAL_API_URL = Deno.env.get('PAYPAL_MODE') === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    console.log('Creating PayPal order for amount:', amount, currency);

    // Get PayPal access token
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
    const tokenResponse = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const { access_token } = await tokenResponse.json();

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency || 'USD',
            value: amount.toString(),
          },
          description: 'Premium Subscription - 1 Month',
        }],
        application_context: {
          return_url: `${req.headers.get('origin')}/dashboard`,
          cancel_url: `${req.headers.get('origin')}/dashboard`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error('PayPal order creation failed:', error);
      throw new Error('Failed to create PayPal order');
    }

    const order = await orderResponse.json();
    console.log('PayPal order created:', order.id);

    return new Response(
      JSON.stringify({ orderId: order.id, approveUrl: order.links.find((l: any) => l.rel === 'approve')?.href }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
