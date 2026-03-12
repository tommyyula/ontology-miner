import type { ILLMProvider, LLMProviderType } from '../../types/llm';
import { MockProvider } from './MockProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';

export function createLLMProvider(type: LLMProviderType): ILLMProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'mock':
      return new MockProvider();
  }
}

export { MockProvider, OpenAIProvider, AnthropicProvider };
