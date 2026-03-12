import { Card, Button, Typography, Space, Tag, Steps as AntSteps, Alert, Empty } from 'antd';
import { useMiningStore } from '../../stores/useMiningStore';

const { Title, Text, Paragraph } = Typography;

export function WorkflowExtraction() {
  const { workflows, concepts, extractWorkflows, advancePhase, isLoading, error } = useMiningStore();
  const needGenerate = workflows.length === 0;

  const getConceptName = (id: string) => concepts.find(c => c.id === id)?.name || id;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>⚙️ 工作流提取</Title>
          <Text type="secondary">
            从本体中推演业务工作流程
          </Text>
        </div>
        <Space>
          {needGenerate ? (
            <Button type="primary" onClick={extractWorkflows} loading={isLoading}>
              提取工作流
            </Button>
          ) : (
            <Space>
              <Button onClick={extractWorkflows} loading={isLoading}>重新提取</Button>
              <Button type="primary" onClick={advancePhase}>
                进入关系推演 →
              </Button>
            </Space>
          )}
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />}
      {isLoading && <Alert type="info" message="正在从本体中推演业务工作流..." showIcon style={{ marginBottom: 16 }} />}

      {workflows.length === 0 && !isLoading ? (
        <Empty description="点击上方按钮提取工作流" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {workflows.map(w => (
            <Card key={w.id} title={w.name} size="small">
              <Paragraph type="secondary">{w.description}</Paragraph>

              <AntSteps
                direction="vertical"
                size="small"
                current={w.steps.length}
                items={w.steps.map(s => ({
                  title: s.name,
                  description: (
                    <div style={{ fontSize: 12 }}>
                      <div>{s.description}</div>
                      <Space size={4} style={{ marginTop: 4 }}>
                        {s.actorConceptId && <Tag color="blue">执行者: {getConceptName(s.actorConceptId)}</Tag>}
                        {s.conditions && <Tag>条件: {s.conditions}</Tag>}
                      </Space>
                      {s.inputConceptIds.length > 0 && (
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            输入: {s.inputConceptIds.map(getConceptName).join(', ')}
                          </Text>
                        </div>
                      )}
                      {s.outputConceptIds.length > 0 && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            输出: {s.outputConceptIds.map(getConceptName).join(', ')}
                          </Text>
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />

              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 12 }}>涉及概念：</Text>
                <Space size={4} wrap style={{ marginTop: 4 }}>
                  {w.involvedConcepts.map(c => (
                    <Tag key={c}>{getConceptName(c)}</Tag>
                  ))}
                </Space>
              </div>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}
