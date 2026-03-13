import { Card, Progress, Steps, Tag, Button, Space, Typography } from 'antd';
import { ThunderboltOutlined, PauseOutlined, CaretRightOutlined, StopOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AutoModeProgressProps {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: string;
  currentPhase: string;
  stepIndex: number;
  totalSteps: number;
  overallProgress: number;
  message: string;
  conceptsExtracted?: number;
  relationsFound?: number;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

const autoSteps = [
  { title: 'CQ 展开', phase: 'cq_expansion' },
  { title: '本体提取', phase: 'ontology_extraction' },
  { title: '深入推演', phase: 'drill_down' },
  { title: '工作流提取', phase: 'workflow_extraction' },
  { title: '关系推演', phase: 'relation_inference' },
  { title: '生成验证', phase: 'validation_generation' },
];

export function AutoModeProgress(props: AutoModeProgressProps) {
  const { isRunning, isPaused, currentStep, stepIndex, overallProgress, message, conceptsExtracted, relationsFound, onPause, onResume, onCancel } = props;

  if (!isRunning && overallProgress === 0) return null;

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, border: '1px solid #1677ff' }}
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#1677ff' }} />
          <Text strong>自动模式</Text>
          {isRunning && !isPaused && <Tag color="processing">运行中</Tag>}
          {isPaused && <Tag color="warning">已暂停</Tag>}
          {!isRunning && overallProgress >= 1 && <Tag color="success">已完成</Tag>}
        </Space>
      }
      extra={
        isRunning && (
          <Space>
            {isPaused ? (
              <Button size="small" icon={<CaretRightOutlined />} onClick={onResume}>继续</Button>
            ) : (
              <Button size="small" icon={<PauseOutlined />} onClick={onPause}>暂停</Button>
            )}
            <Button size="small" danger icon={<StopOutlined />} onClick={onCancel}>停止</Button>
          </Space>
        )
      }
    >
      <Progress
        percent={Math.round(overallProgress * 100)}
        status={isRunning ? (isPaused ? 'exception' : 'active') : 'success'}
        size="small"
        style={{ marginBottom: 12 }}
      />

      <Steps
        current={stepIndex}
        size="small"
        items={autoSteps.map((s, i) => ({
          title: <Text style={{ fontSize: 12 }}>{s.title}</Text>,
          status: i < stepIndex ? 'finish' : i === stepIndex && isRunning ? 'process' : 'wait',
        }))}
      />

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{message || currentStep}</Text>
        <Space size={12}>
          {conceptsExtracted !== undefined && <Tag>概念: {conceptsExtracted}</Tag>}
          {relationsFound !== undefined && <Tag>关系: {relationsFound}</Tag>}
        </Space>
      </div>
    </Card>
  );
}
