export interface ILLMProvider {
  readonly name: string;
  configure(config: LLMProviderConfig): void;
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<LLMChunk>;
  validate(): Promise<boolean>;
}

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'error';
}

export interface LLMChunk {
  delta: string;
  done: boolean;
}

export type LLMProviderType = 'openai' | 'anthropic' | 'mock';
