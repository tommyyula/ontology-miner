export type GraphType = 'knowledge_graph' | 'property_graph' | 'hierarchy_tree' | 'relation_matrix' | 'workflow_diagram' | 'stats_dashboard';

export interface VisualizationState {
  activeGraphType: GraphType;
  knowledgeGraph: {
    layout: 'force' | 'dagre' | 'radial';
    nodeSize: 'fixed' | 'degree_scaled';
    edgeThickness: 'fixed' | 'confidence_scaled';
    showLabels: boolean;
    showEdgeLabels: boolean;
    colorBy: 'layer' | 'depth' | 'status';
    filterByLayer: string[];
    searchQuery: string;
  };
  propertyGraph: {
    showAllProperties: boolean;
    groupByLayer: boolean;
  };
  hierarchyTree: {
    direction: 'left-right' | 'top-bottom';
    expandedNodes: string[];
    relationTypes: string[];
  };
  relationMatrix: {
    sortBy: 'name' | 'degree' | 'cluster';
    strengthMetric: 'direct' | 'indirect' | 'combined';
    minStrength: number;
  };
  selectedConceptId: string | null;
  selectedRelationId: string | null;
  highlightedConceptIds: string[];
}
