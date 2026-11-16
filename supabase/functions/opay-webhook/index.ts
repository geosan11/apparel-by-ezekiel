// Supabase Edge Function: opay-webhook
// Deno TypeScript runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-opay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Compute HMAC-SHA512 hex string
 */
async function computeHmacSha512(keyStr: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyStr),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string equality check to mitigate timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req: Request) => {
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
    const rawBody = await req.text();

    const opaySecretKey = Deno.env.get('OPAY_SECRET_KEY') || '';
    const opayMerchantId = Deno.env.get('OPAY_MERCHANT_ID') || '';
    const opayEnv = (Deno.env.get('OPAY_ENV') || 'sandbox').toLowerCase();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!opaySecretKey) {
      console.error('Server misconfigured: OPAY_SECRET_KEY missing');
      return new Response(JSON.stringify({ error: 'Missing OPAY_SECRET_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract signature from headers or payload
    const rawAuthHeader = req.headers.get('x-opay-signature') || req.headers.get('authorization') || '';
    const receivedSignature = rawAuthHeader.replace(/^Bearer\s+/i, '').trim();

    // Compute expected HMAC-SHA512
    const calculatedSignature = await computeHmacSha512(opaySecretKey, rawBody);

    let isSignatureValid = false;
    if (receivedSignature) {
      isSignatureValid = timingSafeEqual(
        calculatedSignature.toLowerCase(),
        receivedSignature.toLowerCase()
      );
    }

    let parsedBody: Record<string, any> = {};
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Also check if signature is provided in payload.sha512
    if (!isSignatureValid && parsedBody.sha512) {
      isSignatureValid = timingSafeEqual(
        calculatedSignature.toLowerCase(),
        String(parsedBody.sha512).toLowerCase()
      );
    }

    if (!isSignatureValid) {
      console.warn('OPay webhook signature verification failed.');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract order reference
    const reference =
      parsedBody.payload?.reference ||
      parsedBody.reference ||
      parsedBody.data?.reference;

    if (!reference) {
      console.error('Webhook payload missing transaction reference:', parsedBody);
      return new Response(JSON.stringify({ error: 'Missing reference in payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Re-query OPay payment status directly before modifying order state
    const isLive = opayEnv === 'live';
    const opayBaseUrl = isLive
      ? 'https://liveapi.opaycheckout.com'
      : 'https://testapi.opaycheckout.com';
    const statusQueryEndpoint = `${opayBaseUrl}/api/v1/international/cashier/status`;

    // Query payload (sorted keys for HMAC-SHA512 signature authentication)
    const statusPayload = { country: 'NG', reference };
    const statusPayloadString = JSON.stringify(statusPayload);
    const querySignature = await computeHmacSha512(opaySecretKey, statusPayloadString);

    let opayStatus = parsedBody.payload?.status || '';
    let statusQueryData: any = null;

    try {
      const statusResponse = await fetch(statusQueryEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'MerchantId': opayMerchantId,
          'Authorization': `Bearer ${querySignature}`
        },
        body: statusPayloadString
      });

      if (statusResponse.ok) {
        statusQueryData = await statusResponse.json();
        if (statusQueryData?.data?.status) {
          opayStatus = statusQueryData.data.status;
        }
      } else {
        console.warn(`OPay status query returned status ${statusResponse.status}`);
      }
    } catch (queryErr) {
      console.warn('Failed to re-query OPay status, falling back to verified webhook payload:', queryErr);
    }

    // Map OPay status to our internal order status
    let finalStatus: 'pending' | 'paid' | 'failed' = 'pending';
    const normalizedStatus = String(opayStatus).toUpperCase();

    if (normalizedStatus === 'SUCCESS') {
      finalStatus = 'paid';
    } else if (['FAIL', 'FAILED', 'CLOSE', 'CLOSED'].includes(normalizedStatus)) {
      finalStatus = 'failed';
    }

    // Update public.orders in database
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: finalStatus,
          raw_response: {
            webhook: parsedBody,
            queriedStatus: statusQueryData,
            verifiedAt: new Date().toISOString()
          }
        })
        .eq('reference', reference);

      if (updateError) {
        console.error('Failed to update order status in Supabase:', updateError);
      }
    }

    // Return 200 SUCCESS as expected by OPay
    return new Response(JSON.stringify({ status: 'SUCCESS' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Exception in opay-webhook handler:', err);
    return new Response(JSON.stringify({ error: err.message || 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
