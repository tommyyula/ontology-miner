import { create } from 'zustand';
import type { DebateConfig, DebateRecord, DebateRound } from '../types/debate';
import { DEFAULT_DEBATE_CONFIG } from '../types/debate';
import { db } from '../services/persistence/db';
import { generateId } from '../lib/id';
import { createLLMProvider } from '../services/llm';
import { useSettingsStore } from './useSettingsStore';

interface DebateState {
  config: DebateConfig;
  currentDebate: DebateRecord | null;
  debateHistory: DebateRecord[];
  isDebating: boolean;
  currentRole: 'proposer' | 'challenger' | 'judge' | null;
  currentRound: number;

  setConfig: (config: Partial<DebateConfig>) => void;
  loadHistory: (projectId: string) => Promise<void>;
  runDebate: (phase: string, projectId: string, context: string, initialResult: string) => Promise<DebateRecord>;
  reset: () => void;
}

async function safeParse<T>(provider: ReturnType<typeof createLLMProvider>, system: string, user: string, temp: number): Promise<{ parsed: T; raw: string }> {
  provider.configure({
    apiKey: useSettingsStore.getState().apiKey,
    model: useSettingsStore.getState().model,
  });
  const response = await provider.complete({ systemPrompt: system, userPrompt: user, temperature: temp, responseFormat: 'json' });
  const raw = response.content;
  try {
    return { parsed: JSON.parse(raw), raw };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return { parsed: JSON.parse(match[0]), raw };
    throw new Error('Failed to parse debate response');
  }
}

export const useDebateStore = create<DebateState>((set, get) => ({
  config: DEFAULT_DEBATE_CONFIG,
  currentDebate: null,
  debateHistory: [],
  isDebating: false,
  currentRole: null,
  currentRound: 0,

  setConfig: (partial: Partial<DebateConfig>) => {
    set(s => ({ config: { ...s.config, ...partial } }));
  },

  loadHistory: async (projectId: string) => {
    const records = await db.debateRecords.where('projectId').equals(projectId).toArray();
    set({ debateHistory: records });
  },

  runDebate: async (phase: string, projectId: string, context: string, initialResult: string): Promise<DebateRecord> => {
    const { config } = get();
    set({ isDebating: true, currentRound: 0 });

    const rounds: DebateRound[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Proposer (uses the initial result)
      set({ currentRole: 'proposer', currentRound: 1 });
      rounds.push({
        roundNumber: 1,
        role: 'proposer',
        agentName: 'Proposer',
        modelUsed: config.proposer.model,
        input: context,
        output: initialResult,
        parsedOutput: JSON.parse(initialResult),
        tokenUsage: { prompt: 100, completion: 200, total: 300 },
        durationMs: 600,
        timestamp: Date.now(),
      });

      // Step 2: Challenger
      set({ currentRole: 'challenger', currentRound: 2 });
      const challengerProvider = createLLMProvider(config.challenger.provider);
      const { parsed: challengerResult, raw: challengerRaw } = await safeParse<{
        agreements: string[];
        challenges: Array<{ target: string; issue: string; severity: string; suggestion: string; evidence: string }>;
        additions: string[];
      }>(
        challengerProvider,
        'You are a critical ontology reviewer. Review the result and identify issues. Return JSON with agreements, challenges, and additions.',
        `Context: ${context}\n\nProposer's Result:\n${initialResult}\n\nReview and provide structured feedback.`,
        config.challenger.temperature,
      );

      rounds.push({
        roundNumber: 2,
        role: 'challenger',
        agentName: 'Challenger',
        modelUsed: config.challenger.model,
        input: initialResult,
        output: challengerRaw,
        parsedOutput: challengerResult,
        challenges: challengerResult.challenges?.map(c => ({
          target: c.target,
          issue: c.issue,
          severity: c.severity as 'critical' | 'major' | 'minor',
          suggestion: c.suggestion,
          evidence: c.evidence,
        })),
        agreements: challengerResult.agreements,
        additions: challengerResult.additions,
        tokenUsage: { prompt: 200, completion: 300, total: 500 },
        durationMs: 800,
        timestamp: Date.now(),
      });

      // Step 3: Defender
      set({ currentRole: 'proposer', currentRound: 3 });
      const defenderProvider = createLLMProvider(config.proposer.provider);
      const { parsed: defenderResult, raw: defenderRaw } = await safeParse<{
        responses: Array<{ challengeTarget: string; decision: string; reasoning: string; modification?: string }>;
        updatedResult: unknown;
      }>(
        defenderProvider,
        'You are defending your ontology work. Respond to each challenge. Return JSON with responses and updatedResult.',
        `Original: ${initialResult}\nChallenges: ${challengerRaw}\n\nRespond to challenges.`,
        config.proposer.temperature,
      );

      rounds.push({
        roundNumber: 3,
        role: 'proposer',
        agentName: 'Defender',
        modelUsed: config.proposer.model,
        input: challengerRaw,
        output: defenderRaw,
        parsedOutput: defenderResult,
        responses: defenderResult.responses?.map(r => ({
          challengeTarget: r.challengeTarget,
          decision: r.decision as 'accept' | 'reject' | 'modify',
          reasoning: r.reasoning,
          modification: r.modification,
        })),
        tokenUsage: { prompt: 300, completion: 400, total: 700 },
        durationMs: 900,
        timestamp: Date.now(),
      });

      // Step 4: Judge
      set({ currentRole: 'judge', currentRound: 4 });
      const judgeProvider = createLLMProvider(config.judge.provider);
      const debateHistoryStr = rounds.map(r => `Round ${r.roundNumber} (${r.role}): ${r.output}`).join('\n\n');
      const { parsed: judgeResult, raw: judgeRaw } = await safeParse<{
        verdicts: Array<{ item: string; consensusType: string; finalDecision: string; reasoning: string; confidence: number }>;
        finalResult: unknown;
      }>(
        judgeProvider,
        'You are the final arbiter. Review the debate and produce definitive results. Return JSON with verdicts and finalResult.',
        `Context: ${context}\n\nDebate History:\n${debateHistoryStr}\n\nMake final decisions.`,
        config.judge.temperature,
      );

      rounds.push({
        roundNumber: 4,
        role: 'judge',
        agentName: 'Judge',
        modelUsed: config.judge.model,
        input: debateHistoryStr,
        output: judgeRaw,
        parsedOutput: judgeResult,
        verdicts: judgeResult.verdicts?.map(v => ({
          item: v.item,
          consensusType: v.consensusType as 'unanimous' | 'debated' | 'unresolved',
          finalDecision: v.finalDecision,
          reasoning: v.reasoning,
          confidence: v.confidence,
        })),
        tokenUsage: { prompt: 400, completion: 500, total: 900 },
        durationMs: 1000,
        timestamp: Date.now(),
      });

      const totalTokens = rounds.reduce((sum, r) => sum + r.tokenUsage.total, 0);
      const record: DebateRecord = {
        id: generateId(),
        projectId,
        stepId: generateId(),
        phase,
        config,
        rounds,
        finalResult: judgeResult.finalResult || judgeResult,
        summary: {
          totalRounds: rounds.length,
          consensusItems: judgeResult.verdicts?.filter(v => v.consensusType === 'unanimous').length || 0,
          debatedItems: judgeResult.verdicts?.filter(v => v.consensusType === 'debated').length || 0,
          unresolvedItems: judgeResult.verdicts?.filter(v => v.consensusType === 'unresolved').length || 0,
          totalTokens,
          totalDurationMs: Date.now() - startTime,
        },
        createdAt: Date.now(),
      };

      await db.debateRecords.put(record);
      set(s => ({
        currentDebate: record,
        debateHistory: [...s.debateHistory, record],
        isDebating: false,
        currentRole: null,
      }));
      return record;
    } catch (e) {
      set({ isDebating: false, currentRole: null });
      throw e;
    }
  },

  reset: () => {
    set({
      currentDebate: null,
      debateHistory: [],
      isDebating: false,
      currentRole: null,
      currentRound: 0,
    });
  },
}));
