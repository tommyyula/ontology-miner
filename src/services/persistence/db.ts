import Dexie, { type Table } from 'dexie';
import type { MiningProject } from '../../types/project';
import type { StepSnapshot } from '../../types/mining';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import type { Workflow } from '../../types/workflow';
import type { DataSource } from '../../types/datasource';
import type { DebateRecord } from '../../types/debate';
import type { ValidationQuestion, AnnotationResult, ExpertProfile } from '../../types/annotation';

class OntologyMinerDB extends Dexie {
  // v1 tables
  projects!: Table<MiningProject>;
  steps!: Table<StepSnapshot>;
  concepts!: Table<OntologyConcept>;
  relations!: Table<OntologyRelation>;
  workflows!: Table<Workflow>;
  // v2 tables
  dataSources!: Table<DataSource>;
  debateRecords!: Table<DebateRecord>;
  validationQuestions!: Table<ValidationQuestion>;
  annotationResults!: Table<AnnotationResult>;
  expertProfiles!: Table<ExpertProfile>;

  constructor() {
    super('OntologyMinerDB');

    this.version(1).stores({
      projects: 'id, name, updatedAt, currentPhase',
      steps: 'id, projectId, phase, parentStepId, createdAt, isActive, [projectId+phase], [projectId+isActive]',
      concepts: 'id, projectId, parentId, depth, ontologyLayer, status, [projectId+depth], [projectId+ontologyLayer]',
      relations: 'id, projectId, sourceConceptId, targetConceptId, status, [projectId+status]',
      workflows: 'id, projectId, status',
    });

    this.version(2).stores({
      projects: 'id, name, updatedAt, currentPhase',
      steps: 'id, projectId, phase, parentStepId, createdAt, isActive, [projectId+phase], [projectId+isActive]',
      concepts: 'id, projectId, parentId, depth, ontologyLayer, status, [projectId+depth], [projectId+ontologyLayer]',
      relations: 'id, projectId, sourceConceptId, targetConceptId, status, confidence, [projectId+status]',
      workflows: 'id, projectId, status',
      dataSources: 'id, projectId, type, name, createdAt, [projectId+type]',
      debateRecords: 'id, projectId, stepId, phase, createdAt, [projectId+phase]',
      validationQuestions: 'id, projectId, questionType, difficulty, [projectId+questionType]',
      annotationResults: 'id, questionId, expertId, projectId, createdAt, [projectId+expertId], [questionId+expertId]',
      expertProfiles: 'id, email, *domains',
    });
  }
}

export const db = new OntologyMinerDB();
