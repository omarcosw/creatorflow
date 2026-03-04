import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

// TEMPORARY endpoint — remove after use
// POST /api/admin/fix-passwords with { secret: "CrF1ow2026xPr0dK9m" }
export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    if (secret !== 'CrF1ow2026xPr0dK9m') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newPassword = 'Teste2026!';
    const hash = await bcrypt.hash(newPassword, 12);
    const results: string[] = [];

    for (let i = 1; i <= 10; i++) {
      const email = `teste${i}@teste.com`;
      const res = await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email',
        [hash, email]
      );
      if (res.rows.length > 0) {
        results.push(`Updated: ${email}`);
      } else {
        results.push(`Not found: ${email}`);
      }
    }

    return NextResponse.json({ success: true, password: newPassword, results });
  } catch (error) {
    console.error('Fix passwords error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
