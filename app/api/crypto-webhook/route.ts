import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Blockchain.com calls this URL when payment is confirmed
// It passes: value (satoshis/wei), confirmations, transaction_hash
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId    = searchParams.get('userId');
  const tier      = searchParams.get('tier');
  const secret    = searchParams.get('secret');
  const confirmations = parseInt(searchParams.get('confirmations') ?? '0');

  // Validate webhook secret
  if (secret !== process.env.CRYPTO_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Require at least 1 confirmation
  if (confirmations < 1) {
    return new NextResponse('*ok*'); // Blockchain.com expects *ok* to stop retrying
  }

  if (!userId || !tier) {
    return new NextResponse('*ok*');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    return new NextResponse('*ok*');
  }
  const supabaseAdmin = createClient(supabaseUrl, serviceRole);

  // Upgrade user subscription
  await supabaseAdmin
    .from('profiles')
    .update({ subscription_tier: tier, updated_at: new Date().toISOString() })
    .eq('id', userId);

  // Notify user
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'system',
    title: 'Subscription Activated',
    message: `Your ${tier.toUpperCase()} subscription has been activated. Welcome to the next level!`,
    is_read: false,
  });

  // Blockchain.com expects plain text *ok* to stop retrying
  return new NextResponse('*ok*');
}
