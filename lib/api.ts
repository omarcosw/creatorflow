// Client-side API functions — calls the Next.js API routes instead of Gemini directly
import { Message } from '@/types';

export interface LimitReachedData {
  message: string;
  feature: string;
  used: number;
  limit: number;
  upgradeUrl: string;
}

export const sendMessageToAgent = async (
  agentId: string,
  message: string,
  image: string | null,
  history: Message[],
  systemInstruction: string,
  audio: string | null = null,
  imageSize: "1K" | "2K" | "4K" = "1K"
): Promise<{ text: string; generatedImage?: string; limitReached?: LimitReachedData }> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentId,
        message,
        image,
        audio,
        history,
        systemInstruction,
        imageSize,
      }),
    });

    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return {
        text: '',
        limitReached: {
          message: data.message || 'Limite do plano atingido.',
          feature: data.feature || '',
          used: data.used || 0,
          limit: data.limit || 0,
          upgradeUrl: data.upgradeUrl || '/#precos',
        },
      };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        text: `Desculpe, ocorreu um erro ao processar sua solicitação. (Código: ${response.status})\n\nDetalhes: ${errorData.details || errorData.error || 'Erro desconhecido'}`
      };
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Erro ao comunicar com API:', error);
    return {
      text: 'Erro de conexão com o servidor. Verifique sua conexão e tente novamente.'
    };
  }
};

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64 }),
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    return data.transcript || '';
  } catch (error) {
    console.error('Erro na transcrição:', error);
    throw error;
  }
};
