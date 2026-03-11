import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const { tier, userId, userEmail } = await req.json();

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceBasic = process.env.STRIPE_PRICE_BASIC;
  const pricePremium = process.env.STRIPE_PRICE_PREMIUM;
  const priceVip = process.env.STRIPE_PRICE_VIP;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!secret || !priceBasic || !pricePremium || !priceVip) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const PRICE_IDS: Record<string, string> = {
    basic: priceBasic,
    premium: pricePremium,
    vip: priceVip,
  };

  const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS];
  if (!priceId || !userEmail) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, tier },
    success_url: `${appUrl}/dashboard/profile?upgrade=success`,
    cancel_url: `${appUrl}/dashboard/profile?upgrade=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
