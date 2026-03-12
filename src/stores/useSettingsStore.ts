import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMProviderType } from '../types/llm';

interface SettingsState {
  provider: LLMProviderType;
  model: string;
  apiKey: string;
  language: 'zh' | 'en' | 'auto';
  maxCQCount: number;
  maxDepth: number;

  setProvider: (provider: LLMProviderType) => void;
  setModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setLanguage: (lang: 'zh' | 'en' | 'auto') => void;
  setMaxCQCount: (count: number) => void;
  setMaxDepth: (depth: number) => void;
}

export const PROVIDER_MODELS: Record<LLMProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
  mock: ['mock'],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: 'mock',
      model: 'mock',
      apiKey: '',
      language: 'zh',
      maxCQCount: 10,
      maxDepth: 10,

      setProvider: (provider) =>
        set({ provider, model: PROVIDER_MODELS[provider][0] }),
      setModel: (model) => set({ model }),
      setApiKey: (apiKey) => set({ apiKey }),
      setLanguage: (language) => set({ language }),
      setMaxCQCount: (maxCQCount) => set({ maxCQCount }),
      setMaxDepth: (maxDepth) => set({ maxDepth }),
    }),
    {
      name: 'ontology-miner-settings',
    }
  )
);
