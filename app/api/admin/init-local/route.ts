import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

// LOCAL DEV ONLY — creates full schema + inserts dev user
// POST /api/admin/init-local with { secret: "CrF1ow2026xPr0dK9m" }
// Blocked in production via NODE_ENV guard.

const DEV_USER_ID    = '00000000-0000-0000-0000-000000000001';
const DEV_USER_EMAIL = 'teste@creatorflow.com';
const DEV_USER_NAME  = 'Usuário Teste';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { secret } = await req.json();
    const adminSecret = process.env.ADMIN_SECRET || 'CrF1ow2026xPr0dK9m';
    if (!secret || secret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    // 1. users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    results.push('users table ensured');

    // 2. subscriptions
    await query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stripe_subscription_id VARCHAR(255),
        stripe_price_id VARCHAR(255),
        plan VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`);
    results.push('subscriptions table ensured');

    // 3. clients
    await query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        brand_name VARCHAR(255) NOT NULL,
        niche VARCHAR(255) DEFAULT '',
        subniche VARCHAR(255) DEFAULT '',
        ideal_client TEXT DEFAULT '',
        main_pains TEXT DEFAULT '',
        main_desires TEXT DEFAULT '',
        voice_tone VARCHAR(50) NOT NULL DEFAULT 'Descontraído',
        visual_style TEXT DEFAULT '',
        default_cta TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id)`);
    results.push('clients table ensured');

    // 4. client_data
    await query(`
      CREATE TABLE IF NOT EXISTS client_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(client_id, data_type)
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_client_data_client ON client_data(client_id)`);
    results.push('client_data table ensured');

    // 5. user_data
    await query(`
      CREATE TABLE IF NOT EXISTS user_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, data_type)
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_data_user ON user_data(user_id)`);
    results.push('user_data table ensured');

    // 6. Dev user — hash password with bcryptjs (no pgcrypto needed)
    const passwordHash = await bcrypt.hash('12345678', 10);
    await query(
      `DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
      [DEV_USER_EMAIL]
    );
    await query(`DELETE FROM users WHERE email = $1`, [DEV_USER_EMAIL]);
    await query(
      `INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)`,
      [DEV_USER_ID, DEV_USER_NAME, DEV_USER_EMAIL, passwordHash]
    );
    results.push('dev user created');

    // 7. Dev subscription
    await query(
      `INSERT INTO subscriptions (user_id, plan, status) VALUES ($1, 'agency', 'active')`,
      [DEV_USER_ID]
    );
    results.push('dev subscription created (agency/active)');

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('init-local error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
