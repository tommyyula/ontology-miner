import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { OntologyConcept, OntologyLayer } from '../../types/ontology';

const LAYER_COLORS: Record<OntologyLayer, string> = {
  upper: '#8b5cf6',
  domain: '#3b82f6',
  task: '#10b981',
  application: '#f59e0b',
};

const STATUS_ICONS: Record<string, string> = {
  generated: '○',
  confirmed: '●',
  modified: '◐',
  deprecated: '✗',
};

interface ConceptNodeData {
  concept: OntologyConcept;
  relationsCount: number;
  [key: string]: unknown;
}

export function ConceptNode({ data }: NodeProps) {
  const nodeData = data as ConceptNodeData;
  const { concept, relationsCount } = nodeData;
  const layerColor = LAYER_COLORS[concept.ontologyLayer];

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: layerColor }} />
      <div
        style={{
          background: '#fff',
          border: `2px solid ${layerColor}`,
          borderRadius: 8,
          minWidth: 200,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Color header bar */}
        <div style={{
          background: layerColor,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {concept.name}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
            {STATUS_ICONS[concept.status]} {concept.ontologyLayer}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 12px', fontSize: 12 }}>
          <div style={{
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
            marginBottom: 6,
          }}>
            {concept.description}
          </div>
          <div style={{ display: 'flex', gap: 12, color: '#999', fontSize: 11 }}>
            <span>📋 {concept.properties.length} 属性</span>
            <span>🔗 {relationsCount} 关系</span>
            {concept.depth > 0 && <span>📊 层级 {concept.depth}</span>}
          </div>
          {concept.isExpanded && (
            <div style={{ marginTop: 4, color: '#52c41a', fontSize: 11 }}>✓ 已深入</div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: layerColor }} />
    </>
  );
}
