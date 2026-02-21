import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    price: 7900, // R$ 79,00 in centavos
    features: {
      messagesPerDay: 15,
      agents: 5,
      model: 'flash',
      savedSessions: 3,
      support: 'email',
    },
  },
  professional: {
    name: 'Professional',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || '',
    price: 15900, // R$ 159,00 in centavos
    features: {
      messagesPerDay: 80,
      agents: 24,
      model: 'flash+pro',
      storyboardImages: 10,
      savedSessions: -1, // unlimited
      shotListManager: true,
      support: 'priority',
    },
  },
  agency: {
    name: 'Agency',
    priceId: process.env.STRIPE_PRICE_AGENCY || '',
    price: 31900, // R$ 319,00 in centavos
    features: {
      messagesPerDay: -1, // unlimited (fair use)
      agents: 24,
      model: 'flash+pro',
      storyboardImages: -1, // unlimited
      savedSessions: -1,
      shotListManager: true,
      brandKit: true,
      apiAccess: false, // coming soon
      support: 'dedicated',
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
