import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { PLANS } from '@/lib/stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'creatorflow-jwt-secret-change-me';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get user's current plan
    const result = await query(
      `SELECT s.plan, s.status FROM subscriptions s
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC LIMIT 1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
    }

    const planKey = result.rows[0].plan as keyof typeof PLANS;
    const plan = PLANS[planKey];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 500 });
    }

    return NextResponse.json({
      plan: planKey,
      name: plan.name,
      limits: plan.limits,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
