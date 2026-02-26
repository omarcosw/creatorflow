import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { getUsageSummary } from '@/lib/usage';
import { PlanKey } from '@/lib/stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'creatorflow-jwt-secret-change-me';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get user's plan
    const result = await query(
      `SELECT s.plan FROM subscriptions s
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC LIMIT 1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
    }

    const plan = result.rows[0].plan as PlanKey;
    const usage = await getUsageSummary(decoded.userId, plan);

    return NextResponse.json({
      plan,
      ...usage,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
