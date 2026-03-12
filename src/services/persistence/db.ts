import Dexie, { type Table } from 'dexie';
import type { MiningProject } from '../../types/project';
import type { StepSnapshot } from '../../types/mining';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import type { Workflow } from '../../types/workflow';

class OntologyMinerDB extends Dexie {
  projects!: Table<MiningProject>;
  steps!: Table<StepSnapshot>;
  concepts!: Table<OntologyConcept>;
  relations!: Table<OntologyRelation>;
  workflows!: Table<Workflow>;

  constructor() {
    super('OntologyMinerDB');

    this.version(1).stores({
      projects: 'id, name, updatedAt, currentPhase',
      steps: 'id, projectId, phase, parentStepId, createdAt, isActive, [projectId+phase], [projectId+isActive]',
      concepts: 'id, projectId, parentId, depth, ontologyLayer, status, [projectId+depth], [projectId+ontologyLayer]',
      relations: 'id, projectId, sourceConceptId, targetConceptId, status, [projectId+status]',
      workflows: 'id, projectId, status',
    });
  }
}

export const db = new OntologyMinerDB();
