// Supabase Edge Function: opay-create-payment
// Deno TypeScript runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface RequestPayload {
  productId: string;
  size?: string;
  measurements?: Record<string, any>;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  fitPreference?: string;
  returnUrl?: string;
  callbackUrl?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload: RequestPayload = await req.json();
    const {
      productId,
      size = 'M',
      measurements = {},
      customerName,
      customerPhone,
      customerEmail = '',
      returnUrl,
      callbackUrl
    } = payload;

    if (!productId || !customerName || !customerPhone) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: productId, customerName, and customerPhone are required.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Load Environment Variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const opayMerchantId = Deno.env.get('OPAY_MERCHANT_ID') || '';
    const opayPublicKey = Deno.env.get('OPAY_PUBLIC_KEY') || '';
    const opayEnv = (Deno.env.get('OPAY_ENV') || 'sandbox').toLowerCase();

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!opayMerchantId || !opayPublicKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: OPAY_MERCHANT_ID or OPAY_PUBLIC_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client to query database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read the product and price from database (NEVER trust client price)
    let productQuery = supabase.from('products').select('*');
    if (productId.length > 20 && productId.includes('-')) {
      productQuery = productQuery.eq('id', productId);
    } else {
      productQuery = productQuery.eq('slug', productId);
    }

    const { data: product, error: productError } = await productQuery.maybeSingle();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: `Product not found: ${productId}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Price in Naira converted strictly to integer kobo (Naira * 100)
    const priceNaira = Math.round(Number(product.price) || 0);
    const amountKobo = priceNaira * 100;

    if (amountKobo <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid product price' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique order reference
    const now = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reference = `ABE-${now}-${randomHex}`;

    // Calculate making days and expected ready date
    const makingDays = product.making_days ? Number(product.making_days) : null;
    let expectedReadyDate: string | null = null;
    if (makingDays && makingDays > 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + makingDays);
      expectedReadyDate = targetDate.toISOString().split('T')[0];
    }

    // Insert pending order row into public.orders table
    const { error: insertError } = await supabase.from('orders').insert([
      {
        reference,
        product_id: product.id,
        product_name: product.name,
        amount: amountKobo, // stored in kobo
        currency: 'NGN',
        status: 'pending',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail ? customerEmail.trim() : null,
        size: size || 'M',
        measurements: measurements || {},
        making_days: makingDays,
        expected_ready_date: expectedReadyDate
      }
    ]);

    if (insertError) {
      console.error('Failed to insert orders record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order record', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OPay Cashier / Checkout create-payment API
    const isLive = opayEnv === 'live';
    const opayBaseUrl = isLive
      ? 'https://liveapi.opaycheckout.com'
      : 'https://testapi.opaycheckout.com';
    const cashierCreateEndpoint = `${opayBaseUrl}/api/v1/international/cashier/create`;

    // Construct return, callback and cancel URLs
    const origin = req.headers.get('origin') || 'https://apparelbyezekiel.ng';
    const defaultReturnUrl = `${origin}/#/order/${reference}`;
    const defaultCallbackUrl = `${supabaseUrl}/functions/v1/opay-webhook`;

    const opayRequestBody = {
      country: 'NG',
      reference,
      amount: {
        total: amountKobo,
        currency: 'NGN'
      },
      returnUrl: returnUrl || defaultReturnUrl,
      callbackUrl: callbackUrl || defaultCallbackUrl,
      cancelUrl: `${origin}/#/measure/${product.slug || product.id}`,
      product: {
        name: product.name,
        description: product.description || `Bespoke tailoring order for ${product.name}`
      },
      userInfo: {
        userName: customerName.trim(),
        userPhone: customerPhone.trim(),
        userEmail: customerEmail ? customerEmail.trim() : ''
      }
    };

    const opayResponse = await fetch(cashierCreateEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${opayPublicKey}`,
        'MerchantId': opayMerchantId
      },
      body: JSON.stringify(opayRequestBody)
    });

    const opayResult = await opayResponse.json();

    if (opayResult.code === '00000' && opayResult.data?.cashierUrl) {
      // Update order record with OPay session identifiers
      await supabase
        .from('orders')
        .update({
          opay_order_no: opayResult.data.orderNo || null,
          opay_cashier_url: opayResult.data.cashierUrl,
          raw_response: opayResult
        })
        .eq('reference', reference);

      return new Response(
        JSON.stringify({
          success: true,
          reference,
          cashierUrl: opayResult.data.cashierUrl,
          orderNo: opayResult.data.orderNo,
          amount: amountKobo,
          productName: product.name,
          expectedReadyDate
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('OPay cashier create payment error:', opayResult);
      return new Response(
        JSON.stringify({
          error: opayResult.message || 'OPay checkout initialization failed',
          details: opayResult,
          reference
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (err: any) {
    console.error('Exception in opay-create-payment:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
