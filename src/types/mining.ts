import type { CompetencyQuestion, ExpandedCQ } from './cq';
import type { OntologyConcept, OntologyRelation, OntologyGraph } from './ontology';
import type { Workflow } from './workflow';

export enum MiningPhase {
  DOMAIN_INPUT = 'domain_input',
  CQ_GENERATION = 'cq_generation',
  CQ_SELECTION = 'cq_selection',
  CQ_EXPANSION = 'cq_expansion',
  CQ_CONFIRMATION = 'cq_confirmation',
  ONTOLOGY_EXTRACTION = 'ontology_extraction',
  ONTOLOGY_REFINEMENT = 'ontology_refinement',
  WORKFLOW_EXTRACTION = 'workflow_extraction',
  RELATION_MAPPING = 'relation_mapping',
  REVIEW = 'review',
  EXPORT = 'export',
}

export const PHASE_ORDER: MiningPhase[] = [
  MiningPhase.DOMAIN_INPUT,
  MiningPhase.CQ_GENERATION,
  MiningPhase.CQ_SELECTION,
  MiningPhase.CQ_EXPANSION,
  MiningPhase.CQ_CONFIRMATION,
  MiningPhase.ONTOLOGY_EXTRACTION,
  MiningPhase.ONTOLOGY_REFINEMENT,
  MiningPhase.WORKFLOW_EXTRACTION,
  MiningPhase.RELATION_MAPPING,
  MiningPhase.REVIEW,
  MiningPhase.EXPORT,
];

export const PHASE_LABELS: Record<MiningPhase, string> = {
  [MiningPhase.DOMAIN_INPUT]: '领域输入',
  [MiningPhase.CQ_GENERATION]: 'CQ 生成',
  [MiningPhase.CQ_SELECTION]: 'CQ 选择',
  [MiningPhase.CQ_EXPANSION]: 'CQ 展开',
  [MiningPhase.CQ_CONFIRMATION]: 'CQ 确认',
  [MiningPhase.ONTOLOGY_EXTRACTION]: '本体提取',
  [MiningPhase.ONTOLOGY_REFINEMENT]: '本体深入',
  [MiningPhase.WORKFLOW_EXTRACTION]: '工作流提取',
  [MiningPhase.RELATION_MAPPING]: '关系推演',
  [MiningPhase.REVIEW]: '审查',
  [MiningPhase.EXPORT]: '导出',
};

export type StepInput =
  | { type: 'domain_input'; description: string }
  | { type: 'cq_generation'; domainDescription: string }
  | { type: 'cq_selection'; cqs: CompetencyQuestion[] }
  | { type: 'cq_expansion'; selectedCQs: CompetencyQuestion[] }
  | { type: 'cq_confirmation'; expandedCQs: ExpandedCQ[] }
  | { type: 'ontology_extraction'; confirmedContent: ExpandedCQ[] }
  | { type: 'ontology_refinement'; parentConcept: OntologyConcept; depth: number }
  | { type: 'workflow_extraction'; concepts: OntologyConcept[]; relations: OntologyRelation[] }
  | { type: 'relation_mapping'; concepts: OntologyConcept[]; workflows: Workflow[] }
  | { type: 'review'; fullOntology: OntologyGraph }
  | { type: 'export'; fullOntology: OntologyGraph; format: ExportFormat };

export type StepOutput =
  | { type: 'domain_input'; normalizedDescription: string; suggestedKeywords: string[] }
  | { type: 'cq_generation'; cqs: CompetencyQuestion[] }
  | { type: 'cq_selection'; selectedIds: string[] }
  | { type: 'cq_expansion'; expandedCQs: ExpandedCQ[] }
  | { type: 'cq_confirmation'; confirmedCQs: ExpandedCQ[] }
  | { type: 'ontology_extraction'; concepts: OntologyConcept[]; relations: OntologyRelation[] }
  | { type: 'ontology_refinement'; concepts: OntologyConcept[]; relations: OntologyRelation[] }
  | { type: 'workflow_extraction'; workflows: Workflow[] }
  | { type: 'relation_mapping'; relations: OntologyRelation[] }
  | { type: 'review'; approved: boolean; notes: string }
  | { type: 'export'; exportedFiles: ExportedFile[] };

export interface Modification {
  timestamp: number;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason?: string;
}

export interface StepSnapshot {
  id: string;
  projectId: string;
  phase: MiningPhase;
  parentStepId: string | null;
  createdAt: number;
  input: StepInput;
  output: StepOutput;
  llmRawOutput: string;
  userModifications: Modification[];
  isActive: boolean;
  branchLabel?: string;
}

export type ExportFormat = 'json' | 'markdown' | 'json-ld' | 'csv' | 'mermaid';

export interface ExportedFile {
  filename: string;
  format: ExportFormat;
  content: string;
  size: number;
}
