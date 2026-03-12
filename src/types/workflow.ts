export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  order: number;
  actorConceptId: string | null;
  inputConceptIds: string[];
  outputConceptIds: string[];
  conditions?: string;
  rules?: string;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  involvedConcepts: string[];
  sourceCQIds: string[];
  sourceStepIds: string[];
  status: 'generated' | 'confirmed' | 'modified';
}
