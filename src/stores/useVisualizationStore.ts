import { create } from 'zustand';
import type { GraphType, VisualizationState } from '../types/visualization';

const defaultState: VisualizationState = {
  activeGraphType: 'knowledge_graph',
  knowledgeGraph: {
    layout: 'dagre',
    nodeSize: 'fixed',
    edgeThickness: 'fixed',
    showLabels: true,
    showEdgeLabels: true,
    colorBy: 'layer',
    filterByLayer: [],
    searchQuery: '',
  },
  propertyGraph: {
    showAllProperties: false,
    groupByLayer: true,
  },
  hierarchyTree: {
    direction: 'top-bottom',
    expandedNodes: [],
    relationTypes: ['is_a', 'part_of', 'composed_of'],
  },
  relationMatrix: {
    sortBy: 'name',
    strengthMetric: 'direct',
    minStrength: 0,
  },
  selectedConceptId: null,
  selectedRelationId: null,
  highlightedConceptIds: [],
};

interface VisualizationStore extends VisualizationState {
  setActiveGraphType: (type: GraphType) => void;
  selectConcept: (id: string | null) => void;
  selectRelation: (id: string | null) => void;
  setHighlighted: (ids: string[]) => void;
  updateKnowledgeGraph: (updates: Partial<VisualizationState['knowledgeGraph']>) => void;
  updateHierarchyTree: (updates: Partial<VisualizationState['hierarchyTree']>) => void;
  updateRelationMatrix: (updates: Partial<VisualizationState['relationMatrix']>) => void;
  toggleTreeNode: (nodeId: string) => void;
  reset: () => void;
}

export const useVisualizationStore = create<VisualizationStore>((set) => ({
  ...defaultState,

  setActiveGraphType: (type: GraphType) => set({ activeGraphType: type }),

  selectConcept: (id: string | null) => set({ selectedConceptId: id }),

  selectRelation: (id: string | null) => set({ selectedRelationId: id }),

  setHighlighted: (ids: string[]) => set({ highlightedConceptIds: ids }),

  updateKnowledgeGraph: (updates) =>
    set(s => ({ knowledgeGraph: { ...s.knowledgeGraph, ...updates } })),

  updateHierarchyTree: (updates) =>
    set(s => ({ hierarchyTree: { ...s.hierarchyTree, ...updates } })),

  updateRelationMatrix: (updates) =>
    set(s => ({ relationMatrix: { ...s.relationMatrix, ...updates } })),

  toggleTreeNode: (nodeId: string) =>
    set(s => {
      const expanded = s.hierarchyTree.expandedNodes;
      const newExpanded = expanded.includes(nodeId)
        ? expanded.filter(id => id !== nodeId)
        : [...expanded, nodeId];
      return { hierarchyTree: { ...s.hierarchyTree, expandedNodes: newExpanded } };
    }),

  reset: () => set(defaultState),
}));
