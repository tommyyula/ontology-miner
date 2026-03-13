export interface AgentRoleConfig {
  provider: 'openai' | 'anthropic' | 'mock';
  model: string;
  apiKey?: string;
  temperature: number;
  systemPromptOverride?: string;
}

export interface DebateConfig {
  enabled: boolean;
  rounds: number;
  proposer: AgentRoleConfig;
  challenger: AgentRoleConfig;
  judge: AgentRoleConfig;
  enabledSteps: {
    ontologyExtraction: boolean;
    drillDown: boolean;
    relationInference: boolean;
    cqGeneration: boolean;
    workflowExtraction: boolean;
  };
  presets: 'quick' | 'standard' | 'deep' | 'custom';
}

export interface DebateRecord {
  id: string;
  projectId: string;
  stepId: string;
  phase: string;
  config: DebateConfig;
  rounds: DebateRound[];
  finalResult: unknown;
  summary: {
    totalRounds: number;
    consensusItems: number;
    debatedItems: number;
    unresolvedItems: number;
    totalTokens: number;
    totalDurationMs: number;
  };
  createdAt: number;
}

export interface DebateRound {
  roundNumber: number;
  role: 'proposer' | 'challenger' | 'judge';
  agentName: string;
  modelUsed: string;
  input: string;
  output: string;
  parsedOutput: unknown;
  challenges?: DebateChallenge[];
  agreements?: string[];
  additions?: string[];
  responses?: DebateChallengeResponse[];
  verdicts?: DebateVerdict[];
  tokenUsage: { prompt: number; completion: number; total: number };
  durationMs: number;
  timestamp: number;
}

export interface DebateChallenge {
  target: string;
  issue: string;
  severity: 'critical' | 'major' | 'minor';
  suggestion: string;
  evidence: string;
}

export interface DebateChallengeResponse {
  challengeTarget: string;
  decision: 'accept' | 'reject' | 'modify';
  reasoning: string;
  modification?: string;
}

export interface DebateVerdict {
  item: string;
  consensusType: 'unanimous' | 'debated' | 'unresolved';
  finalDecision: string;
  reasoning: string;
  confidence: number;
}

export interface DebateProgressEvent {
  type: 'round_start' | 'streaming' | 'round_complete' | 'debate_complete';
  role: 'proposer' | 'challenger' | 'judge';
  round: number;
  totalRounds: number;
  delta?: string;
  result?: DebateRound;
}

export const DEFAULT_DEBATE_CONFIG: DebateConfig = {
  enabled: false,
  rounds: 3,
  proposer: { provider: 'mock', model: 'mock', temperature: 0.7 },
  challenger: { provider: 'mock', model: 'mock', temperature: 0.5 },
  judge: { provider: 'mock', model: 'mock', temperature: 0.3 },
  enabledSteps: {
    ontologyExtraction: true,
    drillDown: true,
    relationInference: true,
    cqGeneration: false,
    workflowExtraction: false,
  },
  presets: 'standard',
};
