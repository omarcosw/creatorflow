import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// TEMPORARY endpoint — creates missing tables
// POST /api/admin/setup-db with { secret: "CrF1ow2026xPr0dK9m" }
export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    if (secret !== 'CrF1ow2026xPr0dK9m') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    // Create user_data table
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
    `, []);
    results.push('Created table: user_data');

    await query('CREATE INDEX IF NOT EXISTS idx_user_data_user ON user_data(user_id)', []);
    await query('CREATE INDEX IF NOT EXISTS idx_user_data_type ON user_data(user_id, data_type)', []);
    results.push('Created indexes for user_data');

    // Ensure clients + client_data tables exist
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
    `, []);
    results.push('Ensured table: clients');

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
    `, []);
    results.push('Ensured table: client_data');

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Setup DB error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
