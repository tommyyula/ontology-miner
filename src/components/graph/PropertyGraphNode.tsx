import { Card, Table, Tag, Typography, Empty } from 'antd';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import { useVisualizationStore } from '../../stores/useVisualizationStore';

const { Text } = Typography;

const layerColors: Record<string, string> = {
  upper: '#1677ff',
  domain: '#52c41a',
  task: '#faad14',
  application: '#ff4d4f',
};

function ConceptDetail({ concept, relations, concepts }: {
  concept: OntologyConcept;
  relations: OntologyRelation[];
  concepts: OntologyConcept[];
}) {
  const conceptMap = new Map(concepts.map(c => [c.id, c.name]));
  const relatedRelations = relations.filter(
    r => r.sourceConceptId === concept.id || r.targetConceptId === concept.id
  );

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <Text strong style={{ fontSize: 15 }}>{concept.name}</Text>
          <Tag color={layerColors[concept.ontologyLayer]} style={{ marginLeft: 8 }}>{concept.ontologyLayer}</Tag>
          {concept.confidence !== undefined && (
            <Tag color="default" style={{ fontSize: 10 }}>置信度 {(concept.confidence * 100).toFixed(0)}%</Tag>
          )}
        </div>
      </div>
      <Text type="secondary">{concept.description}</Text>
      {concept.aliases.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>别名：{concept.aliases.join(', ')}</Text>
        </div>
      )}

      {/* Properties */}
      <div style={{ marginTop: 12 }}>
        <Text strong style={{ fontSize: 12 }}>属性 ({concept.properties.length})</Text>
        <Table
          size="small"
          pagination={false}
          dataSource={concept.properties}
          rowKey="id"
          columns={[
            { title: '名称', dataIndex: 'name', key: 'name', width: 100, render: (name: string, rec: typeof concept.properties[0]) => (
              <span>{name} {rec.isRequired && <Text type="danger">*</Text>}</span>
            )},
            { title: '类型', dataIndex: 'dataType', key: 'type', width: 80, render: (t: string) => <Tag style={{ fontSize: 10 }}>{t}</Tag> },
            { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true },
            { title: '约束', dataIndex: 'constraints', key: 'constraints', width: 120, ellipsis: true, render: (c: string | undefined) => <Text type="secondary" style={{ fontSize: 11 }}>{c || '—'}</Text> },
            { title: '示例', dataIndex: 'exampleValues', key: 'examples', width: 120, render: (vals: string[] | undefined) =>
              vals ? vals.slice(0, 2).map((v, i) => <Tag key={i} style={{ fontSize: 10 }}>{v}</Tag>) : '—'
            },
          ]}
        />
      </div>

      {/* Relations */}
      {relatedRelations.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ fontSize: 12 }}>关系 ({relatedRelations.length})</Text>
          {relatedRelations.map(r => {
            const isSource = r.sourceConceptId === concept.id;
            const other = isSource ? conceptMap.get(r.targetConceptId) : conceptMap.get(r.sourceConceptId);
            return (
              <div key={r.id} style={{ padding: '3px 0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag color="blue" style={{ fontSize: 10 }}>{r.relationType}</Tag>
                {isSource ? '→' : '←'} <Text strong>{other}</Text>
                <Text type="secondary">({r.name})</Text>
                {r.confidence !== undefined && <Text type="secondary" style={{ fontSize: 10 }}>{(r.confidence * 100).toFixed(0)}%</Text>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function PropertyGraphView({ concepts, relations }: { concepts: OntologyConcept[]; relations: OntologyRelation[] }) {
  const { selectedConceptId, selectConcept } = useVisualizationStore();

  if (concepts.length === 0) return <Empty description="暂无概念数据" />;

  const selected = selectedConceptId ? concepts.find(c => c.id === selectedConceptId) : null;

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12 }}>
      {/* Concept list */}
      <div style={{ width: 200, overflow: 'auto', borderRight: '1px solid #f0f0f0', paddingRight: 8 }}>
        {concepts.map(c => (
          <div
            key={c.id}
            onClick={() => selectConcept(c.id)}
            style={{
              padding: '6px 8px',
              cursor: 'pointer',
              borderRadius: 4,
              background: selectedConceptId === c.id ? '#e6f4ff' : 'transparent',
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: layerColors[c.ontologyLayer], flexShrink: 0 }} />
            <Text style={{ fontSize: 12 }} ellipsis>{c.name}</Text>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {selected ? (
          <ConceptDetail concept={selected} relations={relations} concepts={concepts} />
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <Text type="secondary">点击左侧概念查看详细属性</Text>
          </div>
        )}
      </div>
    </div>
  );
}
