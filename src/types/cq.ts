export enum CQCategory {
  SCOPING = 'scoping',
  FOUNDATIONAL = 'foundational',
  RELATIONSHIP = 'relationship',
  PROCESS = 'process',
  CONSTRAINT = 'constraint',
}

export interface CompetencyQuestion {
  id: string;
  text: string;
  category: CQCategory;
  importance: 'high' | 'medium' | 'low';
  selected: boolean;
  relatedConcepts: string[];
}

export interface ExpandedCQ {
  cqId: string;
  originalText: string;
  expansion: string;
  subQuestions: string[];
  extractedConcepts: string[];
  extractedRelations: string[];
  confirmed: boolean;
  userNotes: string;
}
