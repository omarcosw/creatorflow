import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'creatorflow-jwt-secret-change-me';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const result = await query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.stripe_customer_id,
              s.plan, s.status as subscription_status, s.current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.email = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    if (user.subscription_status !== 'active') {
      return NextResponse.json({
        error: 'Assinatura inativa',
        subscriptionStatus: user.subscription_status,
        requiresPayment: true,
      }, { status: 403 });
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        subscriptionStatus: user.subscription_status,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        subscriptionStatus: user.subscription_status,
        currentPeriodEnd: user.current_period_end,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
