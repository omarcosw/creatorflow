import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// ─── DEV BYPASS ───────────────────────────────────────────────────────────────
const DEV_USER_ID = 'dev-user-00000000-0000-0000-0000-000000000001';
const DEV_ME_RESPONSE = {
  user: {
    id: DEV_USER_ID,
    name: 'Usuário Teste',
    email: 'teste@creatorflow.com',
    plan: 'agency',
    subscriptionStatus: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // DEV BYPASS: skip DB for the dev test user
    if (process.env.NODE_ENV !== 'production' && decoded.userId === DEV_USER_ID) {
      return NextResponse.json(DEV_ME_RESPONSE);
    }

    const result = await query(
      `SELECT u.id, u.name, u.email, u.stripe_customer_id,
              s.plan, s.status as subscription_status, s.current_period_end, s.cancel_at_period_end
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
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
        subscriptionStatus: user.subscription_status || 'inactive',
        currentPeriodEnd: user.current_period_end,
        cancelAtPeriodEnd: user.cancel_at_period_end,
      },
    });
  } catch (error) {
    if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    console.error('Auth /me error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
