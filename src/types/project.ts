import type { MiningPhase } from './mining';
import type { LLMProviderType } from './llm';

export interface ProjectSettings {
  llmProvider: LLMProviderType;
  llmModel: string;
  language: 'zh' | 'en' | 'auto';
  maxCQCount: number;
  maxDepth: number;
}

export interface MiningProject {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  currentPhase: MiningPhase;
  currentStepId: string | null;
  settings: ProjectSettings;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  llmProvider: 'mock',
  llmModel: 'mock',
  language: 'zh',
  maxCQCount: 10,
  maxDepth: 10,
};
