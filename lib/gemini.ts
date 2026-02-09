// Server-side only — this file should NEVER be imported by client components
import { GoogleGenAI } from "@google/genai";
import { Message, AgentId } from "@/types";

const isQuotaError = (err: any) => {
  const status = err?.status || err?.code || err?.cause?.status;
  const msg = String(err?.message || err?.cause?.message || '');
  return status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('quota');
};

const getAgentConfig = (agentId: string) => {
    let temperature = 0.7;
    let useThinking = false;
    let useSearch = false;

    switch (agentId) {
        case AgentId.SCRIPT_GENERATOR:
        case AgentId.STORYBOARD_GENERATOR:
        case AgentId.BUDGET_PRICING:
            temperature = 0.8;
            useThinking = true;
            break;
        case AgentId.COST_CALCULATOR:
        case AgentId.MEDIA_ASSISTANT:
        case AgentId.EDITING_IDEA:
        case AgentId.YOUTUBE_SEO:
            temperature = 0.4;
            useSearch = true;
            break;
        case AgentId.BUDGET_SHEET:
        case AgentId.EDITING_SHORTCUTS:
            temperature = 0.1;
            break;
        case AgentId.VIDEO_PROMPTS:
            temperature = 0.9;
            break;
        default:
            temperature = 0.7;
    }

    return { temperature, useThinking, useSearch };
};

/**
 * Transcreve um áudio base64 para texto usando o Gemini
 */
export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = audioBase64.split(',')[1];
    const mimeType = audioBase64.split(';')[0].split(':')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [
          { text: "Transcreva este áudio exatamente como falado. Retorne apenas o texto transcrito, sem comentários, sem pontuação extra ou explicações. Se houver ruído, ignore e foque na fala." },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }]
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro na transcrição:", error);
    throw error;
  }
};

export const sendMessageToAgent = async (
  agentId: string,
  message: string,
  image: string | null,
  history: Message[],
  systemInstruction: string,
  audio: string | null = null,
  imageSize: "1K" | "2K" | "4K" = "1K"
): Promise<{ text: string; generatedImage?: string }> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { text: "⚠️ API Key não encontrada. Configure GEMINI_API_KEY no servidor." };
    }
    const ai = new GoogleGenAI({ apiKey });
    const { temperature, useThinking, useSearch } = getAgentConfig(agentId);

    const isProVisual = agentId === AgentId.STORYBOARD_GENERATOR;

    let modelId = 'gemini-3-flash-preview';
    if (isProVisual) {
        modelId = 'gemini-3-pro-image-preview';
    } else if (useThinking) {
        modelId = 'gemini-3-pro-preview';
    }

    const baseContents: any[] = [];

    history.forEach(msg => {
        const parts: any[] = [{ text: msg.text }];
        if (msg.image && msg.image.includes(',')) {
            const base64Data = msg.image.split(',')[1];
            const mimeType = msg.image.split(';')[0].split(':')[1];
            parts.push({ inlineData: { mimeType, data: base64Data } });
        }
        if (msg.audio && msg.audio.includes(',')) {
            const base64Data = msg.audio.split(',')[1];
            const mimeType = msg.audio.split(';')[0].split(':')[1];
            parts.push({ inlineData: { mimeType, data: base64Data } });
        }
        baseContents.push({ role: msg.role, parts });
    });

    const currentParts: any[] = [{ text: message || (audio ? "Por favor, processe este áudio." : "") }];

    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      currentParts.push({ inlineData: { mimeType, data: base64Data } });
    }

    if (audio) {
      const base64Data = audio.split(',')[1];
      const mimeType = audio.split(';')[0].split(':')[1];
      currentParts.push({ inlineData: { mimeType, data: base64Data } });
    }

    baseContents.push({ role: 'user', parts: currentParts });

    let contents = baseContents;
    if (isProVisual && systemInstruction) {
        contents = [
            {
                role: 'user',
                parts: [{ text: `INSTRUÇÕES DE ESTILO E CONTEXTO:\n${systemInstruction}\n\nAja de acordo com as instruções acima para as gerações visuais.` }]
            },
            { role: 'model', parts: [{ text: "Entendido. Aplicarei o estilo solicitado nas ilustrações do storyboard." }] },
            ...baseContents
        ];
    }

    const config: any = {
        temperature: temperature,
    };

    if (isProVisual) {
        config.imageConfig = {
            aspectRatio: "9:16",
            imageSize: imageSize
        };
    } else {
        config.systemInstruction = systemInstruction;
    }

    if (useThinking && !isProVisual) {
        config.thinkingConfig = { thinkingBudget: 16000 };
    }

    if (useSearch) {
        config.tools = [{ googleSearch: {} }];
    }

    const runGenerate = async (model: string, cfg: any, contentsToUse: any[] = contents) => {
      return ai.models.generateContent({
        model,
        config: cfg,
        contents: contentsToUse
      });
    };

    let usedFallback = false;
    let response;
    try {
      response = await runGenerate(modelId, config);
    } catch (err: any) {
      if (isProVisual && isQuotaError(err)) {
        const fallbackConfig = {
          ...config,
          systemInstruction: `${systemInstruction}\n\nIMPORTANTE: a geração de IMAGENS está indisponível por limite de cota. Gere APENAS o storyboard textual completo (3 blocos) e indique que as imagens poderão ser geradas quando a cota Pro estiver ativa novamente.`,
        };
        delete fallbackConfig.imageConfig;
        const fallbackContents = [...baseContents];
        response = await runGenerate('gemini-3-flash-preview', fallbackConfig, fallbackContents);
        usedFallback = true;
      } else if (!isProVisual && isQuotaError(err) && modelId !== 'gemini-3-flash-preview') {
        const fallbackConfig = { ...config };
        delete fallbackConfig.thinkingConfig;
        fallbackConfig.temperature = Math.min(temperature, 0.7);
        response = await runGenerate('gemini-3-flash-preview', fallbackConfig);
        usedFallback = true;
      } else {
        throw err;
      }
    }

    let responseText = "";
    let generatedImage = undefined;

    if (response.candidates?.[0]) {
        const groundingMetadata = response.candidates[0].groundingMetadata;
        if (response.candidates[0].content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.text) responseText += part.text;
                if (part.inlineData) {
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    generatedImage = `data:${mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        if (groundingMetadata?.groundingChunks) {
             const sources = groundingMetadata.groundingChunks
                .map((chunk: any) => chunk.web?.uri ? `[${chunk.web.title}](${chunk.web.uri})` : null)
                .filter(Boolean);
             if (sources.length > 0) {
                 responseText += `\n\n**Fontes consultadas:**\n${sources.join('\n')}`;
             }
        }
    }

    if (!responseText && !generatedImage && response.text) {
        responseText = response.text;
    }

    if (usedFallback) {
      responseText += `\n\n_(Usei o modelo Flash devido ao limite de cota do Pro.)_`;
    }

    if (responseText || generatedImage) {
      return { text: responseText, generatedImage };
    } else {
      throw new Error("No response content received from Gemini.");
    }
  } catch (error: any) {
    console.error("Error communicating with Gemini:", error);
    if (error.message?.includes("Requested entity was not found")) {
        return { text: "ERRO_KEY: É necessário selecionar uma API Key com faturamento ativo para usar modelos Pro." };
    }
    if (isQuotaError(error)) {
      return { text: "⚠️ Limite de uso da API Gemini excedido (cota/429). Ative o billing na Google AI Studio ou aguarde o reset da cota. Se você está usando o modelo Pro, ele precisa de faturamento ativo." };
    }
    const status = error?.status || error?.code || error?.cause?.status;
    const rawMessage = error?.message || error?.cause?.message || "Erro desconhecido";
    const hint = rawMessage.includes("API key") || rawMessage.includes("API_KEY") || rawMessage.includes("invalid")
      ? "Verifique se a chave está correta, com o serviço Gemini API habilitado e sem restrições de HTTP Referrer."
      : "Tente novamente e confira sua conexão.";
    return { text: `Desculpe, ocorreu um erro ao processar sua solicitação.${status ? ` (Código: ${status})` : ""}\n\nDetalhes: ${rawMessage}\n${hint}` };
  }
};
