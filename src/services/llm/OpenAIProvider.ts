import type { ILLMProvider, LLMProviderConfig, LLMRequest, LLMResponse, LLMChunk } from '../../types/llm';

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'OpenAI';
  private config: LLMProviderConfig = { apiKey: '', model: 'gpt-4o' };

  configure(config: LLMProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const body = this.buildBody(request, false);
    const res = await fetch(this.config.baseUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0].finish_reason === 'stop' ? 'stop' : 'length',
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMChunk> {
    const body = this.buildBody(request, true);
    const res = await fetch(this.config.baseUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
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
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          yield { delta: '', done: true };
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            yield { delta, done: false };
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }

  async validate(): Promise<boolean> {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private buildBody(request: LLMRequest, stream: boolean) {
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream,
    };
    if (request.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }
    return body;
  }
}
