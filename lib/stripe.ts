import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null;

export const PLANS = {
  solo: {
    name: 'Solo',
    priceId: process.env.STRIPE_PRICE_SOLO || '',
    price: 4990, // R$ 49,90 in centavos
    features: {
      messagesPerDay: 10,
      agents: 3,
      model: 'flash',
      savedSessions: 1,
      support: 'email',
    },
  },
  maker: {
    name: 'Maker',
    priceId: process.env.STRIPE_PRICE_MAKER || '',
    price: 6790, // R$ 67,90 in centavos
    features: {
      messagesPerDay: 30,
      agents: 10,
      model: 'flash',
      savedSessions: 5,
      support: 'email',
    },
  },
  studio: {
    name: 'Studio',
    priceId: process.env.STRIPE_PRICE_STUDIO || '',
    price: 19790, // R$ 197,90 in centavos
    popular: true,
    features: {
      messagesPerDay: 100,
      agents: 24,
      model: 'flash+pro',
      storyboardImages: 20,
      savedSessions: -1, // unlimited
      shotListManager: true,
      support: 'priority',
    },
  },
  agency: {
    name: 'Agency',
    priceId: process.env.STRIPE_PRICE_AGENCY || '',
    price: 49790, // R$ 497,90 in centavos
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
