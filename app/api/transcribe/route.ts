import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/gemini';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // ~25MB in base64 chars

export async function POST(request: NextRequest) {
  try {
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
