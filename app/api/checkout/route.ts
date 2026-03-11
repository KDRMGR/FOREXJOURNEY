import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });

const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC!,
  premium: process.env.STRIPE_PRICE_PREMIUM!,
  vip: process.env.STRIPE_PRICE_VIP!,
};

export async function POST(req: NextRequest) {
  const { tier, userId, userEmail } = await req.json();

  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, tier },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?upgrade=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
