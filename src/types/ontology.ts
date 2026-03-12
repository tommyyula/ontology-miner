export enum OntologyLayer {
  UPPER = 'upper',
  DOMAIN = 'domain',
  TASK = 'task',
  APPLICATION = 'application',
}

export type PropertyDataType =
  | 'string' | 'number' | 'boolean' | 'date' | 'datetime'
  | 'enum' | 'reference' | 'list' | 'object';

export interface ConceptProperty {
  id: string;
  name: string;
  description: string;
  dataType: PropertyDataType;
  isRequired: boolean;
  constraints?: string;
  exampleValues?: string[];
}

export type Cardinality = '1:1' | '1:N' | 'N:1' | 'N:M';

export enum RelationType {
  IS_A = 'is_a',
  HAS_A = 'has_a',
  PART_OF = 'part_of',
  DEPENDS_ON = 'depends_on',
  TRIGGERS = 'triggers',
  PRODUCES = 'produces',
  CONSUMES = 'consumes',
  ASSOCIATED_WITH = 'associated_with',
  CUSTOM = 'custom',
}

export type ConceptStatus = 'generated' | 'confirmed' | 'modified' | 'deprecated';

export interface OntologyConcept {
  id: string;
  projectId: string;
  name: string;
  description: string;
  aliases: string[];
  parentId: string | null;
  depth: number;
  ontologyLayer: OntologyLayer;
  properties: ConceptProperty[];
  sourceCQIds: string[];
  sourceStepIds: string[];
  status: ConceptStatus;
  isExpanded: boolean;
  position?: { x: number; y: number };
}

export interface OntologyRelation {
  id: string;
  projectId: string;
  name: string;
  description: string;
  sourceConceptId: string;
  targetConceptId: string;
  cardinality: Cardinality;
  relationType: RelationType;
  properties: ConceptProperty[];
  sourceCQIds: string[];
  sourceStepIds: string[];
  status: ConceptStatus;
  reasoning?: string;
}

export interface OntologyGraph {
  projectId: string;
  concepts: OntologyConcept[];
  relations: OntologyRelation[];
  stats: {
    totalConcepts: number;
    totalRelations: number;
    totalWorkflows: number;
    maxDepth: number;
    layerDistribution: Record<OntologyLayer, number>;
  };
}
