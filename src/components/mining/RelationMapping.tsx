import { Card, Button, Typography, Space, Tag, Alert, List } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useMiningStore } from '../../stores/useMiningStore';
import { OntologyGraph } from '../graph/OntologyGraph';

const { Title, Text } = Typography;

export function RelationMapping() {
  const { concepts, relations, inferRelations, confirmRelation, advancePhase, isLoading, error } = useMiningStore();

  const inferredRelations = relations.filter(r => r.status === 'generated' && r.reasoning);
  const needGenerate = inferredRelations.length === 0;

  const getConceptName = (id: string) => concepts.find(c => c.id === id)?.name || id;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🔗 关系推演</Title>
          <Text type="secondary">
            基于工作流分析推演新的本体关系
          </Text>
        </div>
        <Space>
          <Button onClick={inferRelations} loading={isLoading}>
            {needGenerate ? '推演关系' : '重新推演'}
          </Button>
          <Button type="primary" onClick={advancePhase}>
            进入审查 →
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />}

      {/* Graph view */}
      <OntologyGraph concepts={concepts} relations={relations} height={400} />

      {/* Inferred relations */}
      {inferredRelations.length > 0 && (
        <Card title="新推演的关系" size="small" style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={inferredRelations}
            renderItem={r => (
              <List.Item
                actions={[
                  <Button
                    key="confirm"
                    type="link"
                    icon={<CheckOutlined />}
                    onClick={() => confirmRelation(r.id, true)}
                    style={{ color: '#52c41a' }}
                  >
                    确认
                  </Button>,
                  <Button
                    key="reject"
                    type="link"
                    icon={<CloseOutlined />}
                    onClick={() => confirmRelation(r.id, false)}
                    danger
                  >
                    拒绝
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{getConceptName(r.sourceConceptId)}</Tag>
                      <Text>—{r.name}→</Text>
                      <Tag color="blue">{getConceptName(r.targetConceptId)}</Tag>
                      <Text type="secondary">({r.cardinality})</Text>
                    </Space>
                  }
                  description={r.reasoning || r.description}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
