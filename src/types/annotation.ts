export type QuestionType = 'boolean' | 'multiple_choice' | 'ranking' | 'open_ended';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExpertLevel = 'junior' | 'mid' | 'senior' | 'principal';

export interface ValidationQuestion {
  id: string;
  projectId: string;
  questionType: QuestionType;
  text: string;
  context?: string;
  options?: { id: string; text: string }[];
  rankingItems?: { id: string; text: string }[];
  difficulty: Difficulty;
  domains: string[];
  relatedConceptIds: string[];
  relatedRelationIds: string[];
  relatedWorkflowIds: string[];
  generatedFrom: 'relation' | 'concept' | 'workflow' | 'hierarchy';
  createdAt: number;
}

export interface AnnotationResult {
  id: string;
  questionId: string;
  projectId: string;
  expertId: string;
  answer: {
    booleanValue?: boolean | null;
    selectedOptionId?: string;
    rankedItemIds?: string[];
    openEndedText?: string;
  };
  notes?: string;
  skipped: boolean;
  durationMs: number;
  createdAt: number;
}

export interface ExpertProfile {
  id: string;
  name: string;
  email: string;
  domains: string[];
  experienceYears: number;
  level: ExpertLevel;
  credibilityWeight: number;
  totalAnnotations: number;
  averageResponseTime: number;
  createdAt: number;
  updatedAt: number;
}

export interface ConsensusResult {
  questionId: string;
  totalResponses: number;
  simpleAgreement: number;
  weightedAgreement: number;
  fleissKappa: number;
  isConsensus: boolean;
  isDisputed: boolean;
  consensusThreshold: number;
  consensusAnswer: unknown;
  distribution: Record<string, number>;
  escalated: boolean;
  escalationReason?: string;
}

export interface AnnotationReport {
  projectId: string;
  generatedAt: number;
  overview: {
    totalQuestions: number;
    totalExperts: number;
    completionRate: number;
    averageConsensus: number;
    disputedCount: number;
  };
  byQuestionType: Record<QuestionType, {
    count: number;
    avgConsensus: number;
    disputedCount: number;
  }>;
  byDifficulty: Record<Difficulty, {
    count: number;
    avgConsensus: number;
  }>;
  modifications: {
    conceptsModified: number;
    relationsModified: number;
    relationsRemoved: number;
    workflowsModified: number;
  };
  expertStats: {
    expertId: string;
    name: string;
    questionsAnswered: number;
    avgResponseTime: number;
    agreementWithConsensus: number;
  }[];
}
