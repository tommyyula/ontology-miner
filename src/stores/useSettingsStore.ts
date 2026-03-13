import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMProviderType } from '../types/llm';
import type { DebateConfig } from '../types/debate';
import { DEFAULT_DEBATE_CONFIG } from '../types/debate';

interface SettingsState {
  provider: LLMProviderType;
  model: string;
  apiKey: string;
  language: 'zh' | 'en' | 'auto';
  maxCQCount: number;
  maxDepth: number;
  defaultMode: 'auto' | 'manual';
  debateConfig: DebateConfig;
  // Annotation
  maxQuestions: number;
  consensusThreshold: number;
  // Data source
  corsProxyUrl: string;
  maxFileSize: number;

  setProvider: (provider: LLMProviderType) => void;
  setModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setLanguage: (lang: 'zh' | 'en' | 'auto') => void;
  setMaxCQCount: (count: number) => void;
  setMaxDepth: (depth: number) => void;
  setDefaultMode: (mode: 'auto' | 'manual') => void;
  setDebateConfig: (config: Partial<DebateConfig>) => void;
  setMaxQuestions: (n: number) => void;
  setConsensusThreshold: (t: number) => void;
  setCorsProxyUrl: (url: string) => void;
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
      maxCQCount: 15,
      maxDepth: 10,
      defaultMode: 'manual',
      debateConfig: DEFAULT_DEBATE_CONFIG,
      maxQuestions: 30,
      consensusThreshold: 0.7,
      corsProxyUrl: 'https://api.allorigins.win/raw?url=',
      maxFileSize: 50 * 1024 * 1024,

      setProvider: (provider) =>
        set({ provider, model: PROVIDER_MODELS[provider][0] }),
      setModel: (model) => set({ model }),
      setApiKey: (apiKey) => set({ apiKey }),
      setLanguage: (language) => set({ language }),
      setMaxCQCount: (maxCQCount) => set({ maxCQCount }),
      setMaxDepth: (maxDepth) => set({ maxDepth }),
      setDefaultMode: (defaultMode) => set({ defaultMode }),
      setDebateConfig: (partial) =>
        set(s => ({ debateConfig: { ...s.debateConfig, ...partial } })),
      setMaxQuestions: (maxQuestions) => set({ maxQuestions }),
      setConsensusThreshold: (consensusThreshold) => set({ consensusThreshold }),
      setCorsProxyUrl: (corsProxyUrl) => set({ corsProxyUrl }),
    }),
    { name: 'ontology-miner-settings' },
  ),
);
