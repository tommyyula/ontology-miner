import { useMemo } from 'react';
import { Card, Empty, Typography, Tooltip } from 'antd';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import { useVisualizationStore } from '../../stores/useVisualizationStore';

const { Text } = Typography;

export function RelationMatrix({ concepts, relations }: { concepts: OntologyConcept[]; relations: OntologyRelation[] }) {
  const { selectConcept, selectRelation } = useVisualizationStore();

  const matrix = useMemo(() => {
    const conceptList = concepts.slice(0, 15); // limit for display
    const grid: (OntologyRelation | null)[][] = [];
    for (let i = 0; i < conceptList.length; i++) {
      grid[i] = [];
      for (let j = 0; j < conceptList.length; j++) {
        const rel = relations.find(
          r => (r.sourceConceptId === conceptList[i].id && r.targetConceptId === conceptList[j].id) ||
               (r.sourceConceptId === conceptList[j].id && r.targetConceptId === conceptList[i].id)
        );
        grid[i][j] = rel || null;
      }
    }
    return { conceptList, grid };
  }, [concepts, relations]);

  if (concepts.length === 0) return <Empty description="暂无数据" />;

  const { conceptList, grid } = matrix;
  const cellSize = 36;

  const getColor = (rel: OntologyRelation | null) => {
    if (!rel) return '#fafafa';
    const conf = rel.confidence ?? 0.5;
    if (conf >= 0.9) return '#52c41a';
    if (conf >= 0.7) return '#95de64';
    if (conf >= 0.5) return '#fadb14';
    return '#ffccc7';
  };

  return (
    <Card size="small" title="关系矩阵" style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ overflow: 'auto' }}>
        <div style={{ display: 'inline-block' }}>
          {/* Header row */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: 80, height: cellSize }} />
            {conceptList.map(c => (
              <Tooltip key={c.id} title={c.name}>
                <div
                  style={{
                    width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, cursor: 'pointer', overflow: 'hidden', writingMode: 'vertical-rl', textOrientation: 'mixed',
                  }}
                  onClick={() => selectConcept(c.id)}
                >
                  {c.name.slice(0, 3)}
                </div>
              </Tooltip>
            ))}
          </div>
          {/* Matrix rows */}
          {conceptList.map((rowConcept, i) => (
            <div key={rowConcept.id} style={{ display: 'flex' }}>
              <div
                style={{ width: 80, height: cellSize, display: 'flex', alignItems: 'center', fontSize: 11, cursor: 'pointer', paddingRight: 4, justifyContent: 'flex-end' }}
                onClick={() => selectConcept(rowConcept.id)}
              >
                <Text ellipsis style={{ fontSize: 11 }}>{rowConcept.name}</Text>
              </div>
              {conceptList.map((colConcept, j) => {
                const rel = grid[i][j];
                return (
                  <Tooltip
                    key={colConcept.id}
                    title={rel ? `${rel.name} (${rel.relationType}, ${((rel.confidence ?? 0.5) * 100).toFixed(0)}%)` : '无关系'}
                  >
                    <div
                      style={{
                        width: cellSize, height: cellSize,
                        backgroundColor: i === j ? '#e6f4ff' : getColor(rel),
                        border: '1px solid #f0f0f0',
                        cursor: rel ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10,
                        transition: 'all 0.2s',
                      }}
                      onClick={() => { if (rel) selectRelation(rel.id); }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.8'; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1'; }}
                    >
                      {i === j ? '—' : rel ? '●' : ''}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', fontSize: 11 }}>
          <Text type="secondary">置信度：</Text>
          <span style={{ display: 'inline-block', width: 16, height: 16, background: '#52c41a', borderRadius: 2 }} /> ≥90%
          <span style={{ display: 'inline-block', width: 16, height: 16, background: '#95de64', borderRadius: 2 }} /> ≥70%
          <span style={{ display: 'inline-block', width: 16, height: 16, background: '#fadb14', borderRadius: 2 }} /> ≥50%
          <span style={{ display: 'inline-block', width: 16, height: 16, background: '#ffccc7', borderRadius: 2 }} /> &lt;50%
        </div>
      </div>
    </Card>
  );
}
