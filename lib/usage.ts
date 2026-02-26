import { query } from '@/lib/db';
import { PLANS, PlanKey } from '@/lib/stripe';

// Feature types that can be tracked
export type TrackableFeature = 'script_generator' | 'proposals' | 'image_analysis' | 'storyboard';

// Map feature names to plan limit keys
const FEATURE_TO_LIMIT: Record<TrackableFeature, keyof typeof PLANS.solo.limits> = {
  script_generator: 'scriptGenerator',
  proposals: 'proposals',
  image_analysis: 'imageAnalysis',
  storyboard: 'storyboard',
};

// Get or create current month's usage record
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateUsage(userId: string): Promise<any> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Try to get existing record
  let result = await query(
    'SELECT * FROM usage WHERE user_id = $1 AND period_start = $2',
    [userId, periodStart]
  );

  if (result.rows.length === 0) {
    // Create new record for this month
    result = await query(
      `INSERT INTO usage (user_id, period_start, period_end)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, period_start) DO NOTHING
       RETURNING *`,
      [userId, periodStart, periodEnd]
    );

    // If ON CONFLICT hit, fetch it
    if (result.rows.length === 0) {
      result = await query(
        'SELECT * FROM usage WHERE user_id = $1 AND period_start = $2',
        [userId, periodStart]
      );
    }
  }

  return result.rows[0];
}

// Check if user can use a feature (returns remaining count or false)
export async function checkLimit(userId: string, plan: PlanKey, feature: TrackableFeature): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const planData = PLANS[plan];
  if (!planData) {
    return { allowed: false, used: 0, limit: 0, remaining: 0 };
  }

  const limitKey = FEATURE_TO_LIMIT[feature];
  const limit = planData.limits[limitKey] as number;

  const usage = await getOrCreateUsage(userId);
  const used = usage[feature] || 0;

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

// Increment usage counter for a feature
export async function incrementUsage(userId: string, feature: TrackableFeature, count: number = 1): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  await query(
    `INSERT INTO usage (user_id, period_start, period_end, ${feature})
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, period_start)
     DO UPDATE SET ${feature} = usage.${feature} + $4, updated_at = NOW()`,
    [userId, periodStart, periodEnd, count]
  );
}

// Get all usage for current month
export async function getUsageSummary(userId: string, plan: PlanKey): Promise<{
  features: Record<string, { used: number; limit: number; remaining: number; percentage: number }>;
  storage: { usedBytes: number; limitBytes: number; percentage: number };
}> {
  const planData = PLANS[plan];
  const usage = await getOrCreateUsage(userId);

  const features: Record<string, { used: number; limit: number; remaining: number; percentage: number }> = {};

  for (const [dbField, limitKey] of Object.entries(FEATURE_TO_LIMIT)) {
    const limit = planData.limits[limitKey as keyof typeof planData.limits] as number;
    const used = usage[dbField] || 0;
    features[dbField] = {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      percentage: limit > 0 ? Math.round((used / limit) * 100) : 0,
    };
  }

  const storageLimit = (planData.limits.storage as number) * 1024 * 1024 * 1024; // GB to bytes
  const storageUsed = usage.storage_used_bytes || 0;

  return {
    features,
    storage: {
      usedBytes: storageUsed,
      limitBytes: storageLimit,
      percentage: storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0,
    },
  };
}
