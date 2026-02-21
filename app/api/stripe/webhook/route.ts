import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // TODO: Activate subscription in database (Phase 4 - Supabase)
      console.log('Checkout completed:', session.id, session.customer_email);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      // TODO: Update subscription status in database
      console.log('Subscription updated:', subscription.id, subscription.status);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      // TODO: Deactivate subscription in database
      console.log('Subscription cancelled:', subscription.id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      // TODO: Handle failed payment (notify user, grace period)
      console.log('Payment failed:', invoice.id);
      break;
    }
    default:
      console.log('Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}
