import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'creatorflow-jwt-secret-change-me';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const result = await query(
      `SELECT u.id, u.name, u.email, u.stripe_customer_id,
              s.plan, s.status as subscription_status, s.current_period_end, s.cancel_at_period_end
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        subscriptionStatus: user.subscription_status,
        currentPeriodEnd: user.current_period_end,
        cancelAtPeriodEnd: user.cancel_at_period_end,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
