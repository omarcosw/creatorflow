import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audio } = body;

    if (!audio) {
      return NextResponse.json(
        { error: 'audio (base64) é obrigatório' },
        { status: 400 }
      );
    }

    const transcript = await transcribeAudio(audio);

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error('API /transcribe error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
