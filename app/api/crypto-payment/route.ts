import { NextRequest, NextResponse } from 'next/server';

// Blockchain.com Receive Payments v2
// Docs: https://www.blockchain.com/api/api_receive
// Requires: BLOCKCHAIN_API_KEY + BLOCKCHAIN_XPUB_BTC (or ETH)

const TIER_PRICES_USD: Record<string, number> = {
  basic: 49,
  premium: 99,
  vip: 299,
  vvip: 499,
};

export async function POST(req: NextRequest) {
  const { tier, userId, currency = 'BTC' } = await req.json();

  const priceUsd = TIER_PRICES_USD[tier];
  if (!priceUsd) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const BLOCKCHAIN_API_KEY = process.env.BLOCKCHAIN_API_KEY;
  const XPUB_BTC = process.env.BLOCKCHAIN_XPUB_BTC;
  const XPUB_ETH = process.env.BLOCKCHAIN_XPUB_ETH;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!BLOCKCHAIN_API_KEY || !XPUB_BTC || !XPUB_ETH || !process.env.CRYPTO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Crypto gateway not configured' }, { status: 503 });
    }

  const xpub = currency === 'ETH' ? XPUB_ETH : XPUB_BTC;
  const callbackUrl = encodeURIComponent(
    `${APP_URL}/api/crypto-webhook?userId=${userId}&tier=${tier}&currency=${currency}&secret=${process.env.CRYPTO_WEBHOOK_SECRET}`
  );

  // Blockchain.com receive address API
  const endpoint = currency === 'ETH'
    ? `https://api.blockchain.info/v2/eth/receive?xpub=${xpub}&callback=${callbackUrl}&key=${BLOCKCHAIN_API_KEY}`
    : `https://api.blockchain.info/v2/receive?xpub=${xpub}&callback=${callbackUrl}&key=${BLOCKCHAIN_API_KEY}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    const text = await res.text();
    console.error('Blockchain.com error:', text);
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 });
  }

  const data = await res.json();

  return NextResponse.json({
    address: data.address ?? data.account,
    currency,
    tier,
    amount_usd: priceUsd,
    instructions: `Send ${currency} equivalent to $${priceUsd} USD to the address below. Your account will be upgraded automatically once the payment is confirmed (usually within 10-30 minutes).`,
  });
}
