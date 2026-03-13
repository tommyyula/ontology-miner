export enum OntologyLayer {
  UPPER = 'upper',
  DOMAIN = 'domain',
  TASK = 'task',
  APPLICATION = 'application',
}

export type PropertyDataType =
  | 'string' | 'number' | 'boolean' | 'date' | 'datetime'
  | 'enum' | 'reference' | 'list' | 'object'
  | 'money' | 'percentage' | 'duration' | 'geo';

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
  INHERITS_FROM = 'inherits_from',
  COMPOSED_OF = 'composed_of',
  AGGREGATES = 'aggregates',
  SPECIALIZES = 'specializes',
  GENERALIZES = 'generalizes',
  PRECEDES = 'precedes',
  FOLLOWS = 'follows',
  CONSTRAINS = 'constrains',
  ENABLES = 'enables',
  CUSTOM = 'custom',
}

export type ConceptStatus = 'generated' | 'confirmed' | 'modified' | 'deprecated';

export type InferenceType = 'direct' | 'indirect' | 'inherited' | 'composed';
export type AnnotationStatus = 'pending' | 'validated' | 'disputed' | 'rejected';
export type ConceptSource = 'extracted' | 'debated' | 'manual' | 'annotated';
export type RelationSource = 'extracted' | 'debated' | 'manual' | 'inferred' | 'annotated';

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
  // v2 fields
  confidence?: number;
  source?: ConceptSource;
  importanceScore?: number;
  dataSourceRefs?: string[];
  debateRecordId?: string;
  annotationStatus?: AnnotationStatus;
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
  // v2 fields
  confidence?: number;
  inferenceType?: InferenceType;
  inferenceChain?: string[];
  source?: RelationSource;
  evidence?: string;
  debateRecordId?: string;
  annotationStatus?: AnnotationStatus;
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
