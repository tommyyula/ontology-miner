import { create } from 'zustand';
import { db } from '../services/persistence/db';
import { generateId } from '../lib/id';
import { createLLMProvider } from '../services/llm';
import {
  CQ_GENERATION_SYSTEM, cqGenerationUser,
  CQ_EXPANSION_SYSTEM, cqExpansionUser,
  ONTOLOGY_EXTRACTION_SYSTEM, ontologyExtractionUser,
  ONTOLOGY_DRILL_DOWN_SYSTEM, ontologyDrillDownUser,
  WORKFLOW_EXTRACTION_SYSTEM, workflowExtractionUser,
  RELATION_INFERENCE_SYSTEM, relationInferenceUser,
  COMPLETENESS_CHECK_SYSTEM, completenessCheckUser,
} from '../services/mining/prompts';
import { MiningPhase, PHASE_ORDER } from '../types/mining';
import type { MiningProject } from '../types/project';
import type { CompetencyQuestion, ExpandedCQ, CQCategory } from '../types/cq';
import type { OntologyConcept, OntologyRelation, OntologyLayer, ConceptProperty } from '../types/ontology';
import type { Workflow } from '../types/workflow';
import type { ILLMProvider } from '../types/llm';
import { useSettingsStore } from './useSettingsStore';

interface ReviewIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  affectedElements: string[];
}

interface MiningState {
  // Current project
  currentProject: MiningProject | null;
  currentPhase: MiningPhase;

  // Phase data
  domainDescription: string;
  competencyQuestions: CompetencyQuestion[];
  selectedCQIds: string[];
  expandedCQs: ExpandedCQ[];

  // Ontology data
  concepts: OntologyConcept[];
  relations: OntologyRelation[];
  workflows: Workflow[];

  // Review
  reviewIssues: ReviewIssue[];

  // UI state
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Actions
  loadProject: (projectId: string) => Promise<void>;
  setDomainDescription: (desc: string) => void;
  generateCQs: () => Promise<void>;
  toggleCQ: (id: string) => void;
  selectCQs: (ids: string[]) => void;
  addCustomCQ: (text: string, category: CQCategory) => void;
  expandCQs: () => Promise<void>;
  confirmExpansion: (cqId: string, confirmed: boolean) => void;
  updateExpansion: (cqId: string, updates: Partial<ExpandedCQ>) => void;
  extractOntology: () => Promise<void>;
  drillDown: (conceptId: string) => Promise<void>;
  extractWorkflows: () => Promise<void>;
  inferRelations: () => Promise<void>;
  confirmRelation: (id: string, confirmed: boolean) => void;
  runCompletenessCheck: () => Promise<void>;

  // Concept editing
  addConcept: (concept: Partial<OntologyConcept>) => void;
  updateConcept: (id: string, updates: Partial<OntologyConcept>) => void;
  deleteConcept: (id: string) => void;
  addRelation: (relation: Partial<OntologyRelation>) => void;
  updateRelation: (id: string, updates: Partial<OntologyRelation>) => void;
  deleteRelation: (id: string) => void;

  // Workflow editing
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;

  // Navigation
  advancePhase: () => void;
  goToPhase: (phase: MiningPhase) => void;

  // Persistence
  saveAll: () => Promise<void>;

  // Reset
  reset: () => void;
}

function getProvider(): ILLMProvider {
  const settings = useSettingsStore.getState();
  const provider = createLLMProvider(settings.provider);
  provider.configure({
    apiKey: settings.apiKey,
    model: settings.model,
  });
  return provider;
}

async function safeParse<T>(provider: ILLMProvider, systemPrompt: string, userPrompt: string): Promise<T> {
  const response = await provider.complete({
    systemPrompt,
    userPrompt,
    responseFormat: 'json',
    temperature: 0.7,
  });
  try {
    return JSON.parse(response.content) as T;
  } catch {
    // Try to extract JSON from the response
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error('Failed to parse LLM response as JSON');
  }
}

const initialState = {
  currentProject: null,
  currentPhase: MiningPhase.DOMAIN_INPUT,
  domainDescription: '',
  competencyQuestions: [],
  selectedCQIds: [],
  expandedCQs: [],
  concepts: [],
  relations: [],
  workflows: [],
  reviewIssues: [],
  isLoading: false,
  streamingContent: '',
  error: null,
  saveStatus: 'idle' as const,
};

export const useMiningStore = create<MiningState>((set, get) => ({
  ...initialState,

  loadProject: async (projectId: string) => {
    const project = await db.projects.get(projectId);
    if (!project) throw new Error('Project not found');

    const concepts = await db.concepts.where('projectId').equals(projectId).toArray();
    const relations = await db.relations.where('projectId').equals(projectId).toArray();
    const workflows = await db.workflows.where('projectId').equals(projectId).toArray();

    set({
      currentProject: project,
      currentPhase: project.currentPhase,
      domainDescription: project.domainDescription || project.description,
      competencyQuestions: project.competencyQuestions || [],
      selectedCQIds: project.selectedCQIds || [],
      expandedCQs: project.expandedCQs || [],
      concepts,
      relations,
      workflows,
      error: null,
    });
  },

  setDomainDescription: (desc: string) => {
    set({ domainDescription: desc });
  },

  generateCQs: async () => {
    const { domainDescription } = get();
    set({ isLoading: true, error: null, streamingContent: '' });

    try {
      const settings = useSettingsStore.getState();
      const provider = getProvider();
      const data = await safeParse<{ cqs: Array<{
        text: string;
        category: string;
        importance: string;
        relatedConcepts: string[];
      }> }>(
        provider,
        CQ_GENERATION_SYSTEM,
        cqGenerationUser(domainDescription, settings.maxCQCount, settings.language),
      );

      const cqs: CompetencyQuestion[] = data.cqs.map((cq) => ({
        id: generateId(),
        text: cq.text,
        category: cq.category as CQCategory,
        importance: cq.importance as 'high' | 'medium' | 'low',
        selected: false,
        relatedConcepts: cq.relatedConcepts || [],
      }));

      set({
        competencyQuestions: cqs,
        currentPhase: MiningPhase.CQ_SELECTION,
        isLoading: false,
      });
      await get().saveAll();
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  toggleCQ: (id: string) => {
    const { selectedCQIds } = get();
    const newIds = selectedCQIds.includes(id)
      ? selectedCQIds.filter(i => i !== id)
      : [...selectedCQIds, id];
    set({ selectedCQIds: newIds });
  },

  selectCQs: (ids: string[]) => {
    set({ selectedCQIds: ids });
  },

  addCustomCQ: (text: string, category: CQCategory) => {
    const cq: CompetencyQuestion = {
      id: generateId(),
      text,
      category,
      importance: 'medium',
      selected: true,
      relatedConcepts: [],
    };
    set(state => ({
      competencyQuestions: [...state.competencyQuestions, cq],
      selectedCQIds: [...state.selectedCQIds, cq.id],
    }));
  },

  expandCQs: async () => {
    const { domainDescription, competencyQuestions, selectedCQIds } = get();
    const selectedCQs = competencyQuestions.filter(cq => selectedCQIds.includes(cq.id));
    if (selectedCQs.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const provider = getProvider();
      const data = await safeParse<{ expansions: Array<{
        cqIndex: number;
        expansion: string;
        subQuestions: string[];
        extractedConcepts: string[];
        extractedRelations: string[];
      }> }>(
        provider,
        CQ_EXPANSION_SYSTEM,
        cqExpansionUser(domainDescription, selectedCQs),
      );

      const expandedCQs: ExpandedCQ[] = data.expansions.map((exp) => {
        const cq = selectedCQs[exp.cqIndex] || selectedCQs[0];
        return {
          cqId: cq.id,
          originalText: cq.text,
          expansion: exp.expansion,
          subQuestions: exp.subQuestions || [],
          extractedConcepts: exp.extractedConcepts || [],
          extractedRelations: exp.extractedRelations || [],
          confirmed: false,
          userNotes: '',
        };
      });

      set({
        expandedCQs,
        currentPhase: MiningPhase.CQ_CONFIRMATION,
        isLoading: false,
      });
      await get().saveAll();
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  confirmExpansion: (cqId: string, confirmed: boolean) => {
    set(state => ({
      expandedCQs: state.expandedCQs.map(eq =>
        eq.cqId === cqId ? { ...eq, confirmed } : eq
      ),
    }));
  },

  updateExpansion: (cqId: string, updates: Partial<ExpandedCQ>) => {
    set(state => ({
      expandedCQs: state.expandedCQs.map(eq =>
        eq.cqId === cqId ? { ...eq, ...updates } : eq
      ),
    }));
  },

  extractOntology: async () => {
    const { domainDescription, expandedCQs } = get();
    const confirmedCQs = expandedCQs.filter(eq => eq.confirmed);
    if (confirmedCQs.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const provider = getProvider();
      const project = get().currentProject;
      const projectId = project?.id || '';

      const data = await safeParse<{
        concepts: Array<{
          name: string;
          description: string;
          aliases: string[];
          ontologyLayer: string;
          properties: Array<{
            name: string;
            description: string;
            dataType: string;
            isRequired: boolean;
            exampleValues?: string[];
          }>;
        }>;
        relations: Array<{
          name: string;
          description: string;
          sourceConcept: string;
          targetConcept: string;
          cardinality: string;
          relationType: string;
        }>;
      }>(
        provider,
        ONTOLOGY_EXTRACTION_SYSTEM,
        ontologyExtractionUser(domainDescription, confirmedCQs),
      );

      // Build concepts
      const concepts: OntologyConcept[] = data.concepts.map((c) => ({
        id: generateId(),
        projectId,
        name: c.name,
        description: c.description,
        aliases: c.aliases || [],
        parentId: null,
        depth: 0,
        ontologyLayer: c.ontologyLayer as OntologyLayer,
        properties: (c.properties || []).map(p => ({
          id: generateId(),
          name: p.name,
          description: p.description,
          dataType: p.dataType as ConceptProperty['dataType'],
          isRequired: p.isRequired,
          exampleValues: p.exampleValues,
        })),
        sourceCQIds: confirmedCQs.map(cq => cq.cqId),
        sourceStepIds: [],
        status: 'generated' as const,
        isExpanded: false,
      }));

      // Build concept name → id map
      const nameToId = new Map<string, string>();
      concepts.forEach(c => nameToId.set(c.name, c.id));

      // Build relations
      const relations: OntologyRelation[] = data.relations
        .filter(r => nameToId.has(r.sourceConcept) && nameToId.has(r.targetConcept))
        .map((r) => ({
          id: generateId(),
          projectId,
          name: r.name,
          description: r.description || '',
          sourceConceptId: nameToId.get(r.sourceConcept)!,
          targetConceptId: nameToId.get(r.targetConcept)!,
          cardinality: r.cardinality as OntologyRelation['cardinality'],
          relationType: r.relationType as OntologyRelation['relationType'],
          properties: [],
          sourceCQIds: [],
          sourceStepIds: [],
          status: 'generated' as const,
        }));

      set({
        concepts,
        relations,
        currentPhase: MiningPhase.ONTOLOGY_REFINEMENT,
        isLoading: false,
      });
      await get().saveAll();
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  drillDown: async (conceptId: string) => {
    const { concepts, currentProject, domainDescription } = get();
    const concept = concepts.find(c => c.id === conceptId);
    if (!concept || !currentProject) return;

    set({ isLoading: true, error: null });

    try {
      const provider = getProvider();
      const data = await safeParse<{
        shouldContinue: boolean;
        stopReason: string | null;
        subConcepts: Array<{
          name: string;
          description: string;
          ontologyLayer: string;
          properties: Array<{
            name: string;
            description: string;
            dataType: string;
            isRequired: boolean;
          }>;
        }>;
        newRelations: Array<{
          name: string;
          sourceConcept: string;
          targetConcept: string;
          cardinality: string;
          relationType: string;
        }>;
        additionalParentProperties: Array<{
          name: string;
          description: string;
          dataType: string;
          isRequired: boolean;
        }>;
      }>(
        provider,
        ONTOLOGY_DRILL_DOWN_SYSTEM,
        ontologyDrillDownUser(concept, concepts, domainDescription, concept.depth + 1),
      );

      const newConcepts: OntologyConcept[] = data.subConcepts.map(sc => ({
        id: generateId(),
        projectId: currentProject.id,
        name: sc.name,
        description: sc.description,
        aliases: [],
        parentId: conceptId,
        depth: concept.depth + 1,
        ontologyLayer: sc.ontologyLayer as OntologyLayer,
        properties: (sc.properties || []).map(p => ({
          id: generateId(),
          name: p.name,
          description: p.description,
          dataType: p.dataType as ConceptProperty['dataType'],
          isRequired: p.isRequired,
        })),
        sourceCQIds: [],
        sourceStepIds: [],
        status: 'generated' as const,
        isExpanded: false,
      }));

      // Build name map including new concepts
      const allConcepts = [...concepts, ...newConcepts];
      const nameToId = new Map<string, string>();
      allConcepts.forEach(c => nameToId.set(c.name, c.id));

      const newRelations: OntologyRelation[] = (data.newRelations || [])
        .filter(r => nameToId.has(r.sourceConcept) && nameToId.has(r.targetConcept))
        .map(r => ({
          id: generateId(),
          projectId: currentProject.id,
          name: r.name,
          description: '',
          sourceConceptId: nameToId.get(r.sourceConcept)!,
          targetConceptId: nameToId.get(r.targetConcept)!,
          cardinality: r.cardinality as OntologyRelation['cardinality'],
          relationType: r.relationType as OntologyRelation['relationType'],
          properties: [],
          sourceCQIds: [],
          sourceStepIds: [],
          status: 'generated' as const,
        }));

      // Add is_a relations from sub-concepts to parent
      newConcepts.forEach(nc => {
        newRelations.push({
          id: generateId(),
          projectId: currentProject.id,
          name: '是',
          description: `${nc.name} 是 ${concept.name} 的子类型`,
          sourceConceptId: nc.id,
          targetConceptId: conceptId,
          cardinality: '1:1',
          relationType: 'is_a' as OntologyRelation['relationType'],
          properties: [],
          sourceCQIds: [],
          sourceStepIds: [],
          status: 'generated' as const,
        });
      });

      // Mark parent as expanded
      const updatedConcepts = concepts.map(c =>
        c.id === conceptId ? { ...c, isExpanded: true } : c
      );

      set(state => ({
        concepts: [...updatedConcepts, ...newConcepts],
        relations: [...state.relations, ...newRelations],
        isLoading: false,
      }));
      await get().saveAll();
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  extractWorkflows: async () => {
    const { domainDescription, concepts, relations, currentProject } = get();
    if (!currentProject) return;

    set({ isLoading: true, error: null });

    try {
      const provider = getProvider();
      const data = await safeParse<{
        workflows: Array<{
          name: string;
          description: string;
          steps: Array<{
            name: string;
            description: string;
            order: number;
            actorConcept: string | null;
            inputConcepts: string[];
            outputConcepts: string[];
            conditions?: string;
            rules?: string;
          }>;
          involvedConcepts: string[];
        }>;
      }>(
        provider,
        WORKFLOW_EXTRACTION_SYSTEM,
        workflowExtractionUser(domainDescription, concepts, relations),
      );

      const nameToId = new Map<string, string>();
      concepts.forEach(c => nameToId.set(c.name, c.id));

      const workflows: Workflow[] = data.workflows.map(w => ({
        id: generateId(),
        projectId: currentProject.id,
        name: w.name,
        description: w.description,
        steps: w.steps.map(s => ({
          id: generateId(),
          name: s.name,
          description: s.description,
          order: s.order,
          actorConceptId: s.actorConcept ? (nameToId.get(s.actorConcept) || null) : null,
          inputConceptIds: (s.inputConcepts || []).map(c => nameToId.get(c) || c),
          outputConceptIds: (s.outputConcepts || []).map(c => nameToId.get(c) || c),
          conditions: s.conditions,
          rules: s.rules,
        })),
        involvedConcepts: (w.involvedConcepts || []).map(c => nameToId.get(c) || c),
        sourceCQIds: [],
        sourceStepIds: [],
        status: 'generated' as const,
      }));

      set({
        workflows,
        currentPhase: MiningPhase.RELATION_MAPPING,
        isLoading: false,
      });
      await get().saveAll();
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  inferRelations: async () => {
    const { concepts, relations, workflows, currentProject } = get();
    if (!currentProject) return;

    set({ isLoading: true, error: null });

    try {
      const provider = getProvider();
      const data = await safeParse<{
        inferredRelations: Array<{
          name: string;
          sourceConcept: string;
          targetConcept: string;
          cardinality: string;
          relationType: string;
          reasoning: string;
        }>;
      }>(
        provider,
        RELATION_INFERENCE_SYSTEM,
        relationInferenceUser(concepts, relations, workflows),
      );

      const nameToId = new Map<string, string>();
      concepts.forEach(c => nameToId.set(c.name, c.id));

      const newRelations: OntologyRelation[] = (data.inferredRelations || [])
        .filter(r => nameToId.has(r.sourceConcept) && nameToId.has(r.targetConcept))
        .map(r => ({
          id: generateId(),
          projectId: currentProject.id,
          name: r.name,
          description: r.reasoning || '',
          sourceConceptId: nameToId.get(r.sourceConcept)!,
          targetConceptId: nameToId.get(r.targetConcept)!,
          cardinality: r.cardinality as OntologyRelation['cardinality'],
          relationType: r.relationType as OntologyRelation['relationType'],
          properties: [],
          sourceCQIds: [],
          sourceStepIds: [],
          status: 'generated' as const,
          reasoning: r.reasoning,
        }));

      set(state => ({
        relations: [...state.relations, ...newRelations],
        isLoading: false,
      }));
      await get().saveAll();
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  confirmRelation: (id: string, confirmed: boolean) => {
    set(state => ({
      relations: state.relations.map(r =>
        r.id === id ? { ...r, status: confirmed ? 'confirmed' as const : 'deprecated' as const } : r
      ),
    }));
  },

  runCompletenessCheck: async () => {
    const { concepts, relations, workflows } = get();
    set({ isLoading: true, error: null });

    try {
      const provider = getProvider();
      const data = await safeParse<{
        issues: ReviewIssue[];
      }>(
        provider,
        COMPLETENESS_CHECK_SYSTEM,
        completenessCheckUser(concepts, relations, workflows),
      );

      set({ reviewIssues: data.issues || [], isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  // Concept editing
  addConcept: (partial: Partial<OntologyConcept>) => {
    const { currentProject, concepts } = get();
    if (!currentProject) return;
    const concept: OntologyConcept = {
      id: generateId(),
      projectId: currentProject.id,
      name: partial.name || '新概念',
      description: partial.description || '',
      aliases: partial.aliases || [],
      parentId: partial.parentId || null,
      depth: partial.depth || 0,
      ontologyLayer: partial.ontologyLayer || ('domain' as OntologyLayer),
      properties: partial.properties || [],
      sourceCQIds: [],
      sourceStepIds: [],
      status: 'modified',
      isExpanded: false,
    };
    set({ concepts: [...concepts, concept] });
  },

  updateConcept: (id: string, updates: Partial<OntologyConcept>) => {
    set(state => ({
      concepts: state.concepts.map(c =>
        c.id === id ? { ...c, ...updates, status: 'modified' as const } : c
      ),
    }));
  },

  deleteConcept: (id: string) => {
    set(state => ({
      concepts: state.concepts.filter(c => c.id !== id),
      relations: state.relations.filter(r => r.sourceConceptId !== id && r.targetConceptId !== id),
    }));
  },

  addRelation: (partial: Partial<OntologyRelation>) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const relation: OntologyRelation = {
      id: generateId(),
      projectId: currentProject.id,
      name: partial.name || '新关系',
      description: partial.description || '',
      sourceConceptId: partial.sourceConceptId || '',
      targetConceptId: partial.targetConceptId || '',
      cardinality: partial.cardinality || '1:N',
      relationType: partial.relationType || ('associated_with' as OntologyRelation['relationType']),
      properties: [],
      sourceCQIds: [],
      sourceStepIds: [],
      status: 'modified',
    };
    set(state => ({ relations: [...state.relations, relation] }));
  },

  updateRelation: (id: string, updates: Partial<OntologyRelation>) => {
    set(state => ({
      relations: state.relations.map(r =>
        r.id === id ? { ...r, ...updates, status: 'modified' as const } : r
      ),
    }));
  },

  deleteRelation: (id: string) => {
    set(state => ({
      relations: state.relations.filter(r => r.id !== id),
    }));
  },

  updateWorkflow: (id: string, updates: Partial<Workflow>) => {
    set(state => ({
      workflows: state.workflows.map(w =>
        w.id === id ? { ...w, ...updates, status: 'modified' as const } : w
      ),
    }));
  },

  deleteWorkflow: (id: string) => {
    set(state => ({
      workflows: state.workflows.filter(w => w.id !== id),
    }));
  },

  advancePhase: () => {
    const { currentPhase } = get();
    const idx = PHASE_ORDER.indexOf(currentPhase);
    if (idx < PHASE_ORDER.length - 1) {
      set({ currentPhase: PHASE_ORDER[idx + 1] });
      get().saveAll();
    }
  },

  goToPhase: (phase: MiningPhase) => {
    set({ currentPhase: phase });
    get().saveAll();
  },

  saveAll: async () => {
    const state = get();
    if (!state.currentProject) return;
    set({ saveStatus: 'saving' });

    try {
      await db.transaction('rw', [db.projects, db.concepts, db.relations, db.workflows], async () => {
        await db.projects.put({
          ...state.currentProject!,
          currentPhase: state.currentPhase,
          description: state.domainDescription || state.currentProject!.description,
          domainDescription: state.domainDescription,
          competencyQuestions: state.competencyQuestions,
          selectedCQIds: state.selectedCQIds,
          expandedCQs: state.expandedCQs,
          updatedAt: Date.now(),
        });

        // Sync concepts
        await db.concepts.where('projectId').equals(state.currentProject!.id).delete();
        if (state.concepts.length > 0) {
          await db.concepts.bulkPut(state.concepts);
        }

        // Sync relations
        await db.relations.where('projectId').equals(state.currentProject!.id).delete();
        if (state.relations.length > 0) {
          await db.relations.bulkPut(state.relations);
        }

        // Sync workflows
        await db.workflows.where('projectId').equals(state.currentProject!.id).delete();
        if (state.workflows.length > 0) {
          await db.workflows.bulkPut(state.workflows);
        }
      });

      set({ saveStatus: 'saved' });
      setTimeout(() => {
        if (get().saveStatus === 'saved') set({ saveStatus: 'idle' });
      }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
