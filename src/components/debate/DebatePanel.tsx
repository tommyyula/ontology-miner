import { Card, Tag, Typography, Space, Badge, Empty, Spin, Progress } from 'antd';
import {
  UserOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useDebateStore } from '../../stores/useDebateStore';
import type { DebateRound, DebateChallenge, DebateChallengeResponse, DebateVerdict } from '../../types/debate';

const { Text, Paragraph } = Typography;

const roleConfig = {
  proposer: { color: '#1677ff', icon: <UserOutlined />, label: 'Proposer', bg: '#e6f4ff' },
  challenger: { color: '#ff4d4f', icon: <ExperimentOutlined />, label: 'Challenger', bg: '#fff1f0' },
  judge: { color: '#faad14', icon: <SafetyCertificateOutlined />, label: 'Judge', bg: '#fffbe6' },
};

function ChallengeItem({ challenge }: { challenge: DebateChallenge }) {
  const severityColor = { critical: 'red', major: 'orange', minor: 'blue' };
  return (
    <div style={{ marginBottom: 8, padding: '6px 10px', background: '#fff1f0', borderRadius: 6, fontSize: 13 }}>
      <Space>
        <Tag color={severityColor[challenge.severity]} style={{ fontSize: 11 }}>{challenge.severity}</Tag>
        <Text strong>{challenge.target}</Text>
      </Space>
      <div style={{ marginTop: 4 }}><Text type="secondary">问题：</Text>{challenge.issue}</div>
      <div><Text type="secondary">建议：</Text>{challenge.suggestion}</div>
      {challenge.evidence && <div><Text type="secondary">依据：</Text><Text italic>{challenge.evidence}</Text></div>}
    </div>
  );
}

function ResponseItem({ response }: { response: DebateChallengeResponse }) {
  const icon = response.decision === 'accept' ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
    : response.decision === 'reject' ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    : <EditOutlined style={{ color: '#faad14' }} />;
  return (
    <div style={{ marginBottom: 8, padding: '6px 10px', background: '#e6f4ff', borderRadius: 6, fontSize: 13 }}>
      <Space>
        {icon}
        <Tag color={response.decision === 'accept' ? 'green' : response.decision === 'reject' ? 'red' : 'gold'}>
          {response.decision === 'accept' ? '接受' : response.decision === 'reject' ? '拒绝' : '修改'}
        </Tag>
        <Text strong>{response.challengeTarget}</Text>
      </Space>
      <div style={{ marginTop: 4 }}>{response.reasoning}</div>
      {response.modification && <div><Text type="secondary">修改：</Text>{response.modification}</div>}
    </div>
  );
}

function VerdictItem({ verdict }: { verdict: DebateVerdict }) {
  const typeColor = { unanimous: 'green', debated: 'gold', unresolved: 'red' };
  const typeLabel = { unanimous: '一致', debated: '经辩论', unresolved: '未解决' };
  return (
    <div style={{ marginBottom: 8, padding: '6px 10px', background: '#fffbe6', borderRadius: 6, fontSize: 13 }}>
      <Space>
        <Tag color={typeColor[verdict.consensusType]}>{typeLabel[verdict.consensusType]}</Tag>
        <Text strong>{verdict.item}</Text>
        <Text type="secondary">置信度: {(verdict.confidence * 100).toFixed(0)}%</Text>
      </Space>
      <div style={{ marginTop: 4 }}>{verdict.finalDecision}</div>
      <div><Text type="secondary" italic>{verdict.reasoning}</Text></div>
    </div>
  );
}

function RoundCard({ round }: { round: DebateRound }) {
  const config = roleConfig[round.role === 'proposer' && round.roundNumber > 1 ? 'proposer' : round.role];
  const title = round.roundNumber > 1 && round.role === 'proposer' ? 'Defender' : config.label;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: config.bg,
        borderRadius: '8px 8px 0 0',
        borderLeft: `3px solid ${config.color}`,
      }}>
        <span style={{ color: config.color }}>{config.icon}</span>
        <Text strong style={{ color: config.color }}>{title}</Text>
        <Tag style={{ fontSize: 11 }}>{round.modelUsed}</Tag>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
          {(round.durationMs / 1000).toFixed(1)}s · {round.tokenUsage.total} tokens
        </Text>
      </div>
      <div style={{ padding: '8px 12px', background: '#fafafa', borderRadius: '0 0 8px 8px', border: '1px solid #f0f0f0', borderTop: 0 }}>
        {/* Challenges */}
        {round.challenges && round.challenges.length > 0 && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>质疑 ({round.challenges.length})</Text>
            {round.challenges.map((c, i) => <ChallengeItem key={i} challenge={c} />)}
          </div>
        )}
        {/* Agreements */}
        {round.agreements && round.agreements.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>认同</Text>
            {round.agreements.map((a, i) => (
              <div key={i} style={{ fontSize: 13, padding: '2px 0' }}>✅ {a}</div>
            ))}
          </div>
        )}
        {/* Responses */}
        {round.responses && round.responses.length > 0 && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>回应 ({round.responses.length})</Text>
            {round.responses.map((r, i) => <ResponseItem key={i} response={r} />)}
          </div>
        )}
        {/* Verdicts */}
        {round.verdicts && round.verdicts.length > 0 && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>裁决 ({round.verdicts.length})</Text>
            {round.verdicts.map((v, i) => <VerdictItem key={i} verdict={v} />)}
          </div>
        )}
        {/* Additions */}
        {round.additions && round.additions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>建议新增</Text>
            {round.additions.map((a, i) => (
              <div key={i} style={{ fontSize: 13, padding: '2px 0' }}>➕ {a}</div>
            ))}
          </div>
        )}
        {/* Fallback: raw output snippet */}
        {!round.challenges && !round.responses && !round.verdicts && !round.agreements && (
          <Paragraph style={{ fontSize: 13, marginBottom: 0 }} ellipsis={{ rows: 3, expandable: true }}>
            {round.output.slice(0, 500)}
          </Paragraph>
        )}
      </div>
    </div>
  );
}

export function DebatePanel() {
  const { currentDebate, debateHistory, isDebating, currentRole, currentRound } = useDebateStore();

  const debate = currentDebate || debateHistory[debateHistory.length - 1];

  if (isDebating) {
    return (
      <Card title="🤖 多 Agent 辩论" size="small" style={{ height: '100%' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12 }}>
            <Text strong>辩论进行中...</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Tag color={currentRole ? roleConfig[currentRole].color : 'default'}>
              {currentRole ? roleConfig[currentRole].label : '准备中'} · Round {currentRound}
            </Tag>
          </div>
          <Progress percent={Math.round((currentRound / 4) * 100)} size="small" style={{ marginTop: 12 }} />
        </div>
      </Card>
    );
  }

  if (!debate) {
    return (
      <Card title="🤖 多 Agent 辩论" size="small" style={{ height: '100%' }}>
        <Empty description="尚未进行辩论" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            在设置中启用辩论模式后，每个挖掘步骤都会经过多 Agent 辩论验证
          </Text>
        </Empty>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>🤖 多 Agent 辩论</span>
          <Badge count={debate.rounds.length} style={{ backgroundColor: '#1677ff' }} />
        </Space>
      }
      size="small"
      style={{ height: '100%', overflow: 'auto' }}
      extra={
        <Space size={4}>
          <Tag color="green">共识 {debate.summary.consensusItems}</Tag>
          <Tag color="gold">辩论 {debate.summary.debatedItems}</Tag>
          <Tag color="red">争议 {debate.summary.unresolvedItems}</Tag>
        </Space>
      }
    >
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        {debate.rounds.map((round, i) => (
          <RoundCard key={i} round={round} />
        ))}
      </div>
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          总耗时 {(debate.summary.totalDurationMs / 1000).toFixed(1)}s ·
          Token {debate.summary.totalTokens}
        </Text>
      </div>
    </Card>
  );
}
