import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToAgent } from '@/lib/gemini';
import { AgentId } from '@/types';

const VALID_AGENT_IDS = new Set(Object.values(AgentId));
const MAX_HISTORY_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 50000; // 50k chars

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, message, image, audio, history, systemInstruction, imageSize } = body;

    // Validate required fields
    if (!agentId || (!message && !audio && !image)) {
      return NextResponse.json(
        { error: 'agentId e message/audio/image são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate agentId
    if (!VALID_AGENT_IDS.has(agentId)) {
      return NextResponse.json(
        { error: 'Agente inválido.' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message && typeof message === 'string' && message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: 'Mensagem muito longa.' },
        { status: 400 }
      );
    }

    // Validate history
    if (history && Array.isArray(history) && history.length > MAX_HISTORY_LENGTH) {
      return NextResponse.json(
        { error: 'Histórico muito longo. Inicie uma nova conversa.' },
        { status: 400 }
      );
    }

    // Validate imageSize
    const validSizes = ['1K', '2K', '4K'];
    if (imageSize && !validSizes.includes(imageSize)) {
      return NextResponse.json(
        { error: 'Tamanho de imagem inválido.' },
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /chat error:', errorMessage);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
