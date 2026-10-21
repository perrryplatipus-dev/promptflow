import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateMockResponse, streamText, calculateScores } from './mockLLM';
import { EvaluationScores } from './storage';

interface StreamOptions {
  prompt: string;
  variables: Record<string, string>;
  apiKey?: string;
  provider: 'openai' | 'gemini' | 'mock';
  onToken: (token: string) => void;
}

export async function runPromptStream(options: StreamOptions): Promise<{
  fullText: string;
  tokensCount: number;
  cost: number;
  latency: number;
}> {
  const start = Date.now();
  let fullText = '';
  
  // Replace variables in the prompt
  let renderedPrompt = options.prompt;
  for (const [key, value] of Object.entries(options.variables)) {
    renderedPrompt = renderedPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
  }

  const handleToken = (token: string) => {
    fullText += token;
    options.onToken(token);
  };

  try {
    if (options.provider === 'openai' && options.apiKey) {
      const openai = new OpenAI({ apiKey: options.apiKey });
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: renderedPrompt }],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          handleToken(text);
        }
      }
    } else if (options.provider === 'gemini' && options.apiKey) {
      const genAI = new GoogleGenerativeAI(options.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContentStream(renderedPrompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          handleToken(text);
        }
      }
    } else {
      // Fallback to mock streaming
      const mockResult = generateMockResponse(options.prompt, options.variables);
      await streamText(mockResult, handleToken);
    }
  } catch (error) {
    console.error(`Error streaming from ${options.provider}:`, error);
    // Stream error message to user
    const errorMsg = `\n\n**Error [${options.provider.toUpperCase()}]:** ${(error as Error).message || 'Failed to call LLM provider. Check your API keys and internet connection.'}`;
    await streamText(errorMsg, handleToken);
  }

  const latency = Date.now() - start;
  
  // Basic token estimation (1 token ~ 4 chars)
  const tokensCount = Math.ceil(fullText.length / 4);
  
  // Cost estimation:
  // OpenAI gpt-4o-mini: input ~$0.15/M, output ~$0.60/M
  // Gemini 1.5 Flash: input ~$0.075/M, output ~$0.30/M
  let cost = 0;
  if (options.provider === 'openai') {
    cost = (tokensCount * 0.60) / 1000000;
  } else if (options.provider === 'gemini') {
    cost = (tokensCount * 0.30) / 1000000;
  } else {
    // Mock cost
    cost = (tokensCount * 0.20) / 1000000;
  }

  return {
    fullText,
    tokensCount,
    cost,
    latency
  };
}

export function runAutomatedEvaluation(
  outputA: string,
  outputB: string,
  promptA: string,
  promptB: string
): EvaluationScores {
  return calculateScores(outputA, outputB, promptA, promptB);
}
