import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToAgent } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, message, image, audio, history, systemInstruction, imageSize } = body;

    if (!agentId || (!message && !audio && !image)) {
      return NextResponse.json(
        { error: 'agentId e message/audio/image são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await sendMessageToAgent(
      agentId,
      message || '',
      image || null,
      history || [],
      systemInstruction || '',
      audio || null,
      imageSize || '1K'
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /chat error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
