import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !webhookSecret || !supabaseUrl || !serviceRole) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret);
  const supabaseAdmin = createClient(supabaseUrl, serviceRole);

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, tier } = session.metadata ?? {};

    if (userId && tier) {
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_tier: tier, updated_at: new Date().toISOString() })
        .eq('id', userId);

      await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? 'usd',
        status: 'completed',
        stripe_session_id: session.id,
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_tier: 'free', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  }

  return NextResponse.json({ received: true });
}
