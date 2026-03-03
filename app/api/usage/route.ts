import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUsageSummary } from '@/lib/usage';
import { PlanKey } from '@/lib/stripe';
import { verifyToken } from '@/lib/jwt';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

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
  } catch (error) {
    if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
