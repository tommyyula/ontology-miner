import { Card, Empty, Tag, Typography, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type { Workflow } from '../../types/workflow';
import type { OntologyConcept } from '../../types/ontology';

const { Text } = Typography;

function WorkflowCard({ workflow, concepts }: { workflow: Workflow; concepts: OntologyConcept[] }) {
  const conceptMap = new Map(concepts.map(c => [c.id, c.name]));
  const getName = (id: string) => conceptMap.get(id) || id;

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <Text strong style={{ fontSize: 14 }}>{workflow.name}</Text>
      <div><Text type="secondary" style={{ fontSize: 12 }}>{workflow.description}</Text></div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {workflow.steps.map((step, idx) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              padding: '8px 12px',
              background: '#e6f4ff',
              borderRadius: 8,
              border: '1px solid #91caff',
              minWidth: 100,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{step.name}</div>
              {step.actorConceptId && (
                <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                  {getName(step.actorConceptId)}
                </Tag>
              )}
              {step.conditions && (
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                  {step.conditions}
                </div>
              )}
              <Space size={2} wrap style={{ marginTop: 4 }}>
                {step.inputConceptIds.slice(0, 3).map(id => (
                  <Tag key={id} style={{ fontSize: 9 }} color="orange">{getName(id)}</Tag>
                ))}
              </Space>
            </div>
            {idx < workflow.steps.length - 1 && (
              <ArrowRightOutlined style={{ margin: '0 4px', color: '#1677ff', fontSize: 12 }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          涉及概念：{workflow.involvedConcepts.map(c => getName(c)).join('、')}
        </Text>
      </div>
    </Card>
  );
}

export function WorkflowDiagram({ workflows, concepts }: { workflows: Workflow[]; concepts: OntologyConcept[] }) {
  if (workflows.length === 0) return <Empty description="暂无工作流" />;

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {workflows.map(w => (
        <WorkflowCard key={w.id} workflow={w} concepts={concepts} />
      ))}
    </div>
  );
}
