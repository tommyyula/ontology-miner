import { Card, Row, Col, Statistic, Tag, Typography, Space, Progress, Table } from 'antd';
import {
  NodeIndexOutlined,
  BranchesOutlined,
  ApartmentOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import type { Workflow } from '../../types/workflow';
import type { DataSource } from '../../types/datasource';
import type { DebateRecord } from '../../types/debate';

const { Text } = Typography;

interface StatsProps {
  concepts: OntologyConcept[];
  relations: OntologyRelation[];
  workflows: Workflow[];
  dataSources: DataSource[];
  debateRecords: DebateRecord[];
}

export function StatsDashboard({ concepts, relations, workflows, dataSources, debateRecords }: StatsProps) {
  // Layer distribution
  const layerDist: Record<string, number> = {};
  concepts.forEach(c => { layerDist[c.ontologyLayer] = (layerDist[c.ontologyLayer] || 0) + 1; });

  // Relation type distribution
  const relTypeDist: Record<string, number> = {};
  relations.forEach(r => { relTypeDist[r.relationType] = (relTypeDist[r.relationType] || 0) + 1; });

  // Avg confidence
  const avgConceptConf = concepts.length > 0
    ? concepts.reduce((s, c) => s + (c.confidence ?? 0.8), 0) / concepts.length
    : 0;
  const avgRelConf = relations.length > 0
    ? relations.reduce((s, r) => s + (r.confidence ?? 0.8), 0) / relations.length
    : 0;

  // Max depth
  const maxDepth = concepts.reduce((max, c) => Math.max(max, c.depth), 0);

  // Connectivity: concepts with relations / total
  const connectedIds = new Set([...relations.map(r => r.sourceConceptId), ...relations.map(r => r.targetConceptId)]);
  const coverage = concepts.length > 0 ? connectedIds.size / concepts.length : 0;

  const layerColors: Record<string, string> = { upper: '#1677ff', domain: '#52c41a', task: '#faad14', application: '#ff4d4f' };

  const relTypeData = Object.entries(relTypeDist)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Row gutter={[12, 12]}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="概念" value={concepts.length} prefix={<NodeIndexOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="关系" value={relations.length} prefix={<BranchesOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="工作流" value={workflows.length} prefix={<ApartmentOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="数据源" value={dataSources.length} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="辩论" value={debateRecords.length} prefix={<ExperimentOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="最大深度" value={maxDepth} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col span={8}>
          <Card size="small" title="本体层分布">
            {Object.entries(layerDist).map(([layer, count]) => (
              <div key={layer} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={layerColors[layer]}>{layer}</Tag>
                <Progress
                  percent={Math.round((count / concepts.length) * 100)}
                  size="small"
                  strokeColor={layerColors[layer]}
                  format={() => count}
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="关系类型分布">
            <Table
              size="small"
              pagination={false}
              showHeader={false}
              dataSource={relTypeData.slice(0, 8)}
              rowKey="type"
              columns={[
                { dataIndex: 'type', key: 'type', render: (t: string) => <Tag style={{ fontSize: 10 }}>{t}</Tag> },
                { dataIndex: 'count', key: 'count', width: 60, render: (c: number) => <Text>{c}</Text> },
              ]}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="质量指标">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>概念平均置信度</Text>
                <Progress percent={Math.round(avgConceptConf * 100)} size="small" />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>关系平均置信度</Text>
                <Progress percent={Math.round(avgRelConf * 100)} size="small" />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>概念覆盖率（有关系的比例）</Text>
                <Progress percent={Math.round(coverage * 100)} size="small" strokeColor="#722ed1" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
