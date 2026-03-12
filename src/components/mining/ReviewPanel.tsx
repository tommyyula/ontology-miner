import { Card, Button, Typography, Space, Tag, Alert, List, Statistic, Row, Col } from 'antd';
import {
  CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useMiningStore } from '../../stores/useMiningStore';
import { OntologyGraph } from '../graph/OntologyGraph';
// Types used inline

const { Title, Text } = Typography;

export function ReviewPanel() {
  const { concepts, relations, workflows, reviewIssues, runCompletenessCheck, advancePhase, isLoading, error } = useMiningStore();

  const maxDepth = Math.max(...concepts.map(c => c.depth), 0);
  const layerDist: Record<string, number> = {};
  concepts.forEach(c => {
    layerDist[c.ontologyLayer] = (layerDist[c.ontologyLayer] || 0) + 1;
  });

  const SEVERITY_COLORS = { high: 'red', medium: 'orange', low: 'blue' };
  const SEVERITY_ICONS = {
    high: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
    medium: <WarningOutlined style={{ color: '#faad14' }} />,
    low: <CheckCircleOutlined style={{ color: '#1677ff' }} />,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>📊 审查</Title>
          <Text type="secondary">审查本体的完整性和一致性</Text>
        </div>
        <Space>
          <Button onClick={runCompletenessCheck} loading={isLoading}>
            运行完备性检查
          </Button>
          <Button type="primary" onClick={advancePhase}>
            进入导出 →
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />}

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="概念" value={concepts.length} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="关系" value={relations.length} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="工作流" value={workflows.length} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="最大深度" value={maxDepth} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {Object.entries(layerDist).map(([layer, count]) => (
          <Col key={layer} span={6}>
            <Card size="small">
              <Statistic title={layer} value={count} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Graph */}
      <OntologyGraph concepts={concepts} relations={relations} height={400} />

      {/* Issues */}
      {reviewIssues.length > 0 && (
        <Card title={`完备性检查结果 (${reviewIssues.length} 个问题)`} size="small" style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={reviewIssues}
            renderItem={issue => (
              <List.Item>
                <List.Item.Meta
                  avatar={SEVERITY_ICONS[issue.severity]}
                  title={
                    <Space>
                      <Tag color={SEVERITY_COLORS[issue.severity]}>{issue.severity}</Tag>
                      <Tag>{issue.type}</Tag>
                      <Text>{issue.description}</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">💡 建议: {issue.suggestion}</Text>
                      <div style={{ marginTop: 4 }}>
                        {issue.affectedElements.map(e => (
                          <Tag key={e} style={{ fontSize: 11 }}>{e}</Tag>
                        ))}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
