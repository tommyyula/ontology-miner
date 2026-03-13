import { Card, Typography, Tag, Space, Progress, Table, Statistic, Row, Col, Empty, Button } from 'antd';
import { CheckCircleOutlined, WarningOutlined, TeamOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useAnnotationStore } from '../../stores/useAnnotationStore';

const { Text } = Typography;

export function VotingStats() {
  const { questions, experts, consensusResults, calculateConsensus } = useAnnotationStore();

  if (questions.length === 0) {
    return <Empty description="暂无标注数据" />;
  }

  const consensusCount = consensusResults.filter(c => c.isConsensus).length;
  const disputedCount = consensusResults.filter(c => c.isDisputed && c.totalResponses > 0).length;
  const avgConsensus = consensusResults.length > 0
    ? consensusResults.reduce((s, c) => s + c.weightedAgreement, 0) / consensusResults.length
    : 0;

  const columns = [
    {
      title: '问题',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      width: 300,
      render: (text: string) => <Text style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'questionType',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const labels: Record<string, string> = { boolean: '判断', multiple_choice: '选择', ranking: '排序', open_ended: '补充' };
        return <Tag>{labels[type] || type}</Tag>;
      },
    },
    {
      title: '回答数',
      key: 'responses',
      width: 80,
      render: (_: unknown, record: typeof questions[0]) => {
        const c = consensusResults.find(cr => cr.questionId === record.id);
        return c ? c.totalResponses : 0;
      },
    },
    {
      title: '共识度',
      key: 'consensus',
      width: 120,
      render: (_: unknown, record: typeof questions[0]) => {
        const c = consensusResults.find(cr => cr.questionId === record.id);
        if (!c || c.totalResponses === 0) return <Text type="secondary">—</Text>;
        return (
          <Space>
            <Progress
              percent={Math.round(c.weightedAgreement * 100)}
              size="small"
              strokeColor={c.isConsensus ? '#52c41a' : '#faad14'}
              style={{ width: 60 }}
            />
            {c.isConsensus ? <Tag color="success" style={{ fontSize: 10 }}>共识</Tag> : <Tag color="warning" style={{ fontSize: 10 }}>争议</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Kappa',
      key: 'kappa',
      width: 80,
      render: (_: unknown, record: typeof questions[0]) => {
        const c = consensusResults.find(cr => cr.questionId === record.id);
        if (!c || c.totalResponses === 0) return '—';
        return <Text style={{ fontSize: 12 }}>{c.fleissKappa.toFixed(2)}</Text>;
      },
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总问题数"
              value={questions.length}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="参与专家"
              value={experts.length}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="达成共识"
              value={consensusCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: 24, color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="存在争议"
              value={disputedCount}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ fontSize: 24, color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title="投票统计详情"
        extra={
          <Space>
            <Text type="secondary">平均共识度: {(avgConsensus * 100).toFixed(0)}%</Text>
            <Button size="small" onClick={() => calculateConsensus()}>重新计算</Button>
          </Space>
        }
      >
        <Table
          size="small"
          columns={columns}
          dataSource={questions}
          rowKey="id"
          pagination={{ pageSize: 10, size: 'small' }}
        />
      </Card>
    </div>
  );
}
