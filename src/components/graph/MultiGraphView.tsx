import { Card } from 'antd';
import { GraphTypeSelector } from './GraphTypeSelector';
import { OntologyGraph } from './OntologyGraph';
import { PropertyGraphView } from './PropertyGraphNode';
import { HierarchyTreeView } from './HierarchyTreeView';
import { RelationMatrix } from './RelationMatrix';
import { WorkflowDiagram } from './WorkflowDiagram';
import { StatsDashboard } from './StatsDashboard';
import { useVisualizationStore } from '../../stores/useVisualizationStore';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import type { Workflow } from '../../types/workflow';
import type { DataSource } from '../../types/datasource';
import type { DebateRecord } from '../../types/debate';

interface MultiGraphViewProps {
  concepts: OntologyConcept[];
  relations: OntologyRelation[];
  workflows: Workflow[];
  dataSources: DataSource[];
  debateRecords: DebateRecord[];
}

export function MultiGraphView({ concepts, relations, workflows, dataSources, debateRecords }: MultiGraphViewProps) {
  const { activeGraphType } = useVisualizationStore();

  const renderGraph = () => {
    switch (activeGraphType) {
      case 'knowledge_graph':
        return <OntologyGraph concepts={concepts} relations={relations} />;
      case 'property_graph':
        return <PropertyGraphView concepts={concepts} relations={relations} />;
      case 'hierarchy_tree':
        return <HierarchyTreeView concepts={concepts} relations={relations} />;
      case 'relation_matrix':
        return <RelationMatrix concepts={concepts} relations={relations} />;
      case 'workflow_diagram':
        return <WorkflowDiagram workflows={workflows} concepts={concepts} />;
      case 'stats_dashboard':
        return <StatsDashboard concepts={concepts} relations={relations} workflows={workflows} dataSources={dataSources} debateRecords={debateRecords} />;
      default:
        return <OntologyGraph concepts={concepts} relations={relations} />;
    }
  };

  return (
    <Card size="small" style={{ height: '100%' }}>
      <GraphTypeSelector />
      <div style={{ height: 400, overflow: 'auto' }}>
        {renderGraph()}
      </div>
    </Card>
  );
}
