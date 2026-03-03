import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateAndCheckCRM, isAuthenticated } from '@/lib/auth-helpers';

const VALID_DATA_TYPES = new Set([
  'kanban', 'agenda', 'roteiros', 'entregas',
  'meetings', 'invoices', 'metrics', 'saved_ideas',
]);

// GET /api/clients/:clientId/data/:dataType
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; dataType: string }> }
) {
  const auth = await authenticateAndCheckCRM(req);
  if (!isAuthenticated(auth)) return auth;

  const { clientId, dataType } = await params;

  if (!VALID_DATA_TYPES.has(dataType)) {
    return NextResponse.json({ error: 'Tipo de dado inválido' }, { status: 400 });
  }

  try {
    // Verify client ownership
    const clientCheck = await query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, auth.userId]
    );
    if (clientCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const result = await query(
      'SELECT data FROM client_data WHERE client_id = $1 AND data_type = $2',
      [clientId, dataType]
    );

    const data = result.rows.length > 0 ? result.rows[0].data : [];
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`GET /api/clients/${clientId}/data/${dataType} error:`, error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT /api/clients/:clientId/data/:dataType
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; dataType: string }> }
) {
  const auth = await authenticateAndCheckCRM(req);
  if (!isAuthenticated(auth)) return auth;

  const { clientId, dataType } = await params;

  if (!VALID_DATA_TYPES.has(dataType)) {
    return NextResponse.json({ error: 'Tipo de dado inválido' }, { status: 400 });
  }

  try {
    // Verify client ownership
    const clientCheck = await query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, auth.userId]
    );
    if (clientCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { data } = body;

    if (data === undefined) {
      return NextResponse.json({ error: 'Campo "data" é obrigatório' }, { status: 400 });
    }

    await query(
      `INSERT INTO client_data (client_id, user_id, data_type, data)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (client_id, data_type)
       DO UPDATE SET data = $4::jsonb, updated_at = NOW()`,
      [clientId, auth.userId, dataType, JSON.stringify(data)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PUT /api/clients/${clientId}/data/${dataType} error:`, error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
