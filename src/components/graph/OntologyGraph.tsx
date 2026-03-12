import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Space, Typography } from 'antd';
import { ConceptNode } from './ConceptNode';
import type { OntologyConcept, OntologyRelation, OntologyLayer } from '../../types/ontology';

const { Text } = Typography;

interface OntologyGraphProps {
  concepts: OntologyConcept[];
  relations: OntologyRelation[];
  onDrillDown?: (conceptId: string) => void;
  onSelectConcept?: (conceptId: string) => void;
  height?: number | string;
}

const LAYER_COLORS: Record<OntologyLayer, string> = {
  upper: '#8b5cf6',
  domain: '#3b82f6',
  task: '#10b981',
  application: '#f59e0b',
};

const nodeTypes = {
  concept: ConceptNode,
};

function getLayoutedElements(
  concepts: OntologyConcept[],
  relations: OntologyRelation[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 120, marginx: 40, marginy: 40 });

  concepts.forEach(c => {
    g.setNode(c.id, { width: 220, height: 120 });
  });

  relations.forEach(r => {
    if (concepts.find(c => c.id === r.sourceConceptId) && concepts.find(c => c.id === r.targetConceptId)) {
      g.setEdge(r.sourceConceptId, r.targetConceptId);
    }
  });

  dagre.layout(g);

  const nodes: Node[] = concepts.map(c => {
    const pos = g.node(c.id);
    return {
      id: c.id,
      type: 'concept',
      position: { x: (pos?.x ?? 0) - 110, y: (pos?.y ?? 0) - 60 },
      data: { concept: c, relationsCount: relations.filter(r => r.sourceConceptId === c.id || r.targetConceptId === c.id).length },
    };
  });

  const edges: Edge[] = relations
    .filter(r => r.status !== 'deprecated')
    .map(r => ({
      id: r.id,
      source: r.sourceConceptId,
      target: r.targetConceptId,
      label: `${r.name} (${r.cardinality})`,
      type: 'default',
      animated: r.status === 'generated',
      style: {
        stroke: r.status === 'confirmed' ? '#333' : r.status === 'modified' ? '#1677ff' : '#999',
        strokeDasharray: r.status === 'generated' ? '5 5' : undefined,
        strokeWidth: r.status === 'confirmed' ? 2 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: r.status === 'confirmed' ? '#333' : '#999',
      },
      labelStyle: { fontSize: 11, fill: '#666' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
      labelBgPadding: [4, 4] as [number, number],
    }));

  return { nodes, edges };
}

export function OntologyGraph({
  concepts,
  relations,
  onDrillDown,
  onSelectConcept,
  height = 500,
}: OntologyGraphProps) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(concepts, relations),
    [concepts, relations],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onSelectConcept?.(node.id);
  }, [onSelectConcept]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    onDrillDown?.(node.id);
  }, [onDrillDown]);

  if (concepts.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        borderRadius: 8,
        border: '1px dashed #d9d9d9',
      }}>
        <Text type="secondary">本体图谱将在提取完成后显示</Text>
      </div>
    );
  }

  return (
    <div style={{ height, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background gap={20} size={1} color="#f0f0f0" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const concept = concepts.find(c => c.id === n.id);
            return concept ? LAYER_COLORS[concept.ontologyLayer] : '#eee';
          }}
          style={{ borderRadius: 4 }}
        />
        <Panel position="top-right">
          <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', fontSize: 12 }}>
            <Space size={8}>
              {Object.entries(LAYER_COLORS).map(([layer, color]) => (
                <Space key={layer} size={4}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span>{layer}</span>
                </Space>
              ))}
            </Space>
            <div style={{ marginTop: 4, color: '#999' }}>
              实线=已确认 · 虚线=待确认 · 双击节点深入
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
