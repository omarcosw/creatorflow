import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/gemini';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // ~25MB in base64 chars

const ALLOWED_ORIGINS = [
  'https://creatorflowia.com',
  'https://www.creatorflowia.com',
  'http://localhost:3000',
];

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (!origin && !referer) return true;
  if (origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return true;
  if (referer && ALLOWED_ORIGINS.some(o => referer.startsWith(o))) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { audio } = body;

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json(
        { error: 'audio (base64) é obrigatório' },
        { status: 400 }
      );
    }

    // Validate base64 data URI format
    if (!audio.startsWith('data:audio/')) {
      return NextResponse.json(
        { error: 'Formato de áudio inválido.' },
        { status: 400 }
      );
    }

    // Validate size
    if (audio.length > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: 'Áudio muito grande. Máximo 25MB.' },
        { status: 413 }
      );
    }

    const transcript = await transcribeAudio(audio);

    return NextResponse.json({ transcript });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /transcribe error:', errorMessage);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
