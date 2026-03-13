import { create } from 'zustand';
import { db } from '../services/persistence/db';
import { generateId } from '../lib/id';
import type { ValidationQuestion, AnnotationResult, ExpertProfile, ConsensusResult } from '../types/annotation';
import type { OntologyConcept, OntologyRelation } from '../types/ontology';
import type { Workflow } from '../types/workflow';

interface AnnotationState {
  questions: ValidationQuestion[];
  results: AnnotationResult[];
  experts: ExpertProfile[];
  consensusResults: ConsensusResult[];
  currentQuestionIndex: number;
  currentExpert: ExpertProfile | null;
  isGenerating: boolean;

  generateQuestions: (
    projectId: string,
    concepts: OntologyConcept[],
    relations: OntologyRelation[],
    workflows: Workflow[],
    maxQuestions?: number,
  ) => Promise<void>;
  loadAnnotations: (projectId: string) => Promise<void>;
  setCurrentExpert: (expert: ExpertProfile) => void;
  addExpert: (expert: Omit<ExpertProfile, 'id' | 'createdAt' | 'updatedAt' | 'credibilityWeight' | 'totalAnnotations' | 'averageResponseTime'>) => Promise<ExpertProfile>;
  submitAnswer: (questionId: string, answer: AnnotationResult['answer'], notes?: string, durationMs?: number) => Promise<void>;
  skipQuestion: (questionId: string) => Promise<void>;
  nextQuestion: () => void;
  prevQuestion: () => void;
  calculateConsensus: (threshold?: number) => ConsensusResult[];
  loadExperts: () => Promise<void>;
  reset: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  questions: [],
  results: [],
  experts: [],
  consensusResults: [],
  currentQuestionIndex: 0,
  currentExpert: null,
  isGenerating: false,

  generateQuestions: async (projectId, concepts, relations, workflows, maxQuestions = 30) => {
    set({ isGenerating: true });
    const questions: ValidationQuestion[] = [];

    // Boolean questions from relations
    for (const relation of relations) {
      if (questions.length >= maxQuestions) break;
      const source = concepts.find(c => c.id === relation.sourceConceptId);
      const target = concepts.find(c => c.id === relation.targetConceptId);
      if (!source || !target) continue;

      questions.push({
        id: generateId(),
        projectId,
        questionType: 'boolean',
        text: `以下关系是否正确："${source.name}" ${relation.name} "${target.name}"？`,
        difficulty: (relation.confidence ?? 1) < 0.7 ? 'hard' : (relation.confidence ?? 1) < 0.9 ? 'medium' : 'easy',
        domains: [source.ontologyLayer, target.ontologyLayer],
        relatedConceptIds: [source.id, target.id],
        relatedRelationIds: [relation.id],
        relatedWorkflowIds: [],
        generatedFrom: 'relation',
        createdAt: Date.now(),
      });
    }

    // Multiple choice for relations
    for (const relation of relations.slice(0, 5)) {
      if (questions.length >= maxQuestions) break;
      const source = concepts.find(c => c.id === relation.sourceConceptId);
      const target = concepts.find(c => c.id === relation.targetConceptId);
      if (!source || !target) continue;

      questions.push({
        id: generateId(),
        projectId,
        questionType: 'multiple_choice',
        text: `"${source.name}" 和 "${target.name}" 之间的关系最准确的描述是？`,
        options: [
          { id: 'a', text: '包含 (contains)' },
          { id: 'b', text: '关联 (associated with)' },
          { id: 'c', text: '继承 (inherits from)' },
          { id: 'd', text: '组成部分 (part of)' },
          { id: 'e', text: '无直接关系' },
          { id: 'f', text: '其他（请在备注中说明）' },
        ],
        difficulty: 'medium',
        domains: [source.ontologyLayer],
        relatedConceptIds: [source.id, target.id],
        relatedRelationIds: [relation.id],
        relatedWorkflowIds: [],
        generatedFrom: 'relation',
        createdAt: Date.now(),
      });
    }

    // Ranking questions by layer
    const layers = [...new Set(concepts.map(c => c.ontologyLayer))];
    for (const layer of layers) {
      if (questions.length >= maxQuestions) break;
      const layerConcepts = concepts.filter(c => c.ontologyLayer === layer).slice(0, 8);
      if (layerConcepts.length < 3) continue;

      questions.push({
        id: generateId(),
        projectId,
        questionType: 'ranking',
        text: `请按重要性排列以下概念（最重要的排在前面）：`,
        rankingItems: layerConcepts.map(c => ({ id: c.id, text: c.name })),
        difficulty: 'hard',
        domains: [layer],
        relatedConceptIds: layerConcepts.map(c => c.id),
        relatedRelationIds: [],
        relatedWorkflowIds: [],
        generatedFrom: 'concept',
        createdAt: Date.now(),
      });
    }

    // Open-ended for workflows
    for (const workflow of workflows) {
      if (questions.length >= maxQuestions) break;
      questions.push({
        id: generateId(),
        projectId,
        questionType: 'open_ended',
        text: `您认为 "${workflow.name}" 工作流还缺少哪些步骤或考虑因素？`,
        context: `当前步骤：${workflow.steps.map(s => s.name).join(' → ')}`,
        difficulty: 'hard',
        domains: ['workflow'],
        relatedConceptIds: [],
        relatedRelationIds: [],
        relatedWorkflowIds: [workflow.id],
        generatedFrom: 'workflow',
        createdAt: Date.now(),
      });
    }

    // Save to DB
    for (const q of questions) {
      await db.validationQuestions.put(q);
    }
    set({ questions, isGenerating: false, currentQuestionIndex: 0 });
  },

  loadAnnotations: async (projectId: string) => {
    const questions = await db.validationQuestions.where('projectId').equals(projectId).toArray();
    const results = await db.annotationResults.where('projectId').equals(projectId).toArray();
    set({ questions, results });
  },

  setCurrentExpert: (expert: ExpertProfile) => {
    set({ currentExpert: expert });
  },

  addExpert: async (data) => {
    const expert: ExpertProfile = {
      id: generateId(),
      ...data,
      credibilityWeight: 1.0,
      totalAnnotations: 0,
      averageResponseTime: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.expertProfiles.put(expert);
    set(s => ({ experts: [...s.experts, expert] }));
    return expert;
  },

  submitAnswer: async (questionId: string, answer, notes, durationMs = 0) => {
    const { currentExpert, questions } = get();
    if (!currentExpert) return;
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const result: AnnotationResult = {
      id: generateId(),
      questionId,
      projectId: question.projectId,
      expertId: currentExpert.id,
      answer,
      notes,
      skipped: false,
      durationMs,
      createdAt: Date.now(),
    };
    await db.annotationResults.put(result);
    set(s => ({ results: [...s.results, result] }));
  },

  skipQuestion: async (questionId: string) => {
    const { currentExpert, questions } = get();
    if (!currentExpert) return;
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const result: AnnotationResult = {
      id: generateId(),
      questionId,
      projectId: question.projectId,
      expertId: currentExpert.id,
      answer: {},
      skipped: true,
      durationMs: 0,
      createdAt: Date.now(),
    };
    await db.annotationResults.put(result);
    set(s => ({ results: [...s.results, result] }));
  },

  nextQuestion: () => {
    set(s => ({
      currentQuestionIndex: Math.min(s.currentQuestionIndex + 1, s.questions.length - 1),
    }));
  },

  prevQuestion: () => {
    set(s => ({
      currentQuestionIndex: Math.max(s.currentQuestionIndex - 1, 0),
    }));
  },

  calculateConsensus: (threshold = 0.7) => {
    const { questions, results, experts } = get();
    const consensusResults: ConsensusResult[] = [];

    for (const q of questions) {
      const qResults = results.filter(r => r.questionId === q.id && !r.skipped);
      if (qResults.length === 0) {
        consensusResults.push({
          questionId: q.id,
          totalResponses: 0,
          simpleAgreement: 0,
          weightedAgreement: 0,
          fleissKappa: 0,
          isConsensus: false,
          isDisputed: false,
          consensusThreshold: threshold,
          consensusAnswer: null,
          distribution: {},
          escalated: false,
        });
        continue;
      }

      if (q.questionType === 'boolean') {
        const counts: Record<string, number> = { true: 0, false: 0, null: 0 };
        qResults.forEach(r => {
          counts[String(r.answer.booleanValue)] = (counts[String(r.answer.booleanValue)] || 0) + 1;
        });
        const total = qResults.length;
        const maxCount = Math.max(...Object.values(counts));
        const simpleAgreement = maxCount / total;

        // Weighted
        let totalWeight = 0;
        const wCounts: Record<string, number> = { true: 0, false: 0, null: 0 };
        qResults.forEach(r => {
          const expert = experts.find(e => e.id === r.expertId);
          const w = expert ? calcWeight(expert, q.domains) : 1;
          wCounts[String(r.answer.booleanValue)] += w;
          totalWeight += w;
        });
        const maxWeighted = Math.max(...Object.values(wCounts));
        const weightedAgreement = totalWeight > 0 ? maxWeighted / totalWeight : 0;

        const consensusKey = Object.entries(wCounts).sort((a, b) => b[1] - a[1])[0][0];
        const consensusAnswer = consensusKey === 'null' ? null : consensusKey === 'true';

        // Simplified Fleiss' Kappa
        const pe = Object.values(counts).reduce((s, c) => s + (c / total) ** 2, 0);
        const kappa = pe < 1 ? (simpleAgreement - pe) / (1 - pe) : 1;

        consensusResults.push({
          questionId: q.id,
          totalResponses: total,
          simpleAgreement,
          weightedAgreement,
          fleissKappa: kappa,
          isConsensus: weightedAgreement >= threshold,
          isDisputed: weightedAgreement < threshold,
          consensusThreshold: threshold,
          consensusAnswer,
          distribution: { '是': counts.true, '否': counts.false, '不确定': counts.null },
          escalated: false,
        });
      } else {
        // Simplified for MC/ranking/open-ended
        consensusResults.push({
          questionId: q.id,
          totalResponses: qResults.length,
          simpleAgreement: 0.5,
          weightedAgreement: 0.5,
          fleissKappa: 0,
          isConsensus: false,
          isDisputed: true,
          consensusThreshold: threshold,
          consensusAnswer: null,
          distribution: {},
          escalated: false,
        });
      }
    }

    set({ consensusResults });
    return consensusResults;
  },

  loadExperts: async () => {
    const experts = await db.expertProfiles.toArray();
    set({ experts });
  },

  reset: () => {
    set({
      questions: [],
      results: [],
      consensusResults: [],
      currentQuestionIndex: 0,
      currentExpert: null,
      isGenerating: false,
    });
  },
}));

function calcWeight(expert: ExpertProfile, domains: string[]): number {
  const levelWeights = { principal: 1.5, senior: 1.2, mid: 1.0, junior: 0.8 };
  const levelW = levelWeights[expert.level] || 1.0;
  const domainMatch = expert.domains.some(d => domains.includes(d));
  return levelW * (domainMatch ? 1.3 : 0.7);
}
