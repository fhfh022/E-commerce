import { NextResponse } from 'next/server';
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  let stripeStatus = 'ok';
  let stripeError = null;
  let geminiStatus = 'ok';
  let geminiError = null;
  let supabaseStatus = 'ok';
  let supabaseError = null;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
  } catch (e) {
    geminiStatus = 'failed';
    geminiError = e.message;
  }

  try {
    const customers = await stripe.customers.list({ limit: 1 });
  } catch (e) {
    stripeStatus = 'failed';
    stripeError = e.message;
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);
    if (error) throw new Error(error.message);
  } catch (e) {
    supabaseStatus = 'failed';
    supabaseError = e.message;
  }

  return NextResponse.json({
    gemini: { status: geminiStatus, error: geminiError },
    stripe: { status: stripeStatus, error: stripeError },
    supabase: { status: supabaseStatus, error: supabaseError },
  });
}
