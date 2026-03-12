import type { ILLMProvider, LLMProviderConfig, LLMRequest, LLMResponse, LLMChunk } from '../../types/llm';

export class AnthropicProvider implements ILLMProvider {
  readonly name = 'Anthropic';
  private config: LLMProviderConfig = { apiKey: '', model: 'claude-sonnet-4-20250514' };

  configure(config: LLMProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const body = this.buildBody(request, false);
    const res = await fetch(this.config.baseUrl || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.content.map((c: { text: string }) => c.text).join('');
    return {
      content,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : 'length',
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMChunk> {
    const body = this.buildBody(request, true);
    const res = await fetch(this.config.baseUrl || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === 'content_block_delta') {
            yield { delta: data.delta?.text || '', done: false };
          }
          if (data.type === 'message_stop') {
            yield { delta: '', done: true };
            return;
          }
        } catch {
          // Skip
        }
      }
    }
  }

  async validate(): Promise<boolean> {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private buildBody(request: LLMRequest, stream: boolean) {
    return {
      model: this.config.model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
      temperature: request.temperature ?? 0.7,
      stream,
    };
  }
}
