import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Radio, Input, Space, Typography, Tag, Progress, Tooltip, message, Result } from 'antd';
import { LeftOutlined, RightOutlined, ForwardOutlined } from '@ant-design/icons';
import { useAnnotationStore } from '../../stores/useAnnotationStore';
import type { ValidationQuestion } from '../../types/annotation';

const { Text, Title } = Typography;
const { TextArea } = Input;

function BooleanQuestion({ onAnswer }: { question: ValidationQuestion; onAnswer: (v: boolean | null) => void }) {
  return (
    <Space size={16} style={{ marginTop: 24 }}>
      <Button size="large" style={{ width: 120, height: 50 }} onClick={() => onAnswer(true)}>
        ✅ 是 <Text type="secondary" style={{ fontSize: 11 }}>(1)</Text>
      </Button>
      <Button size="large" style={{ width: 120, height: 50 }} onClick={() => onAnswer(false)}>
        ❌ 否 <Text type="secondary" style={{ fontSize: 11 }}>(2)</Text>
      </Button>
      <Button size="large" style={{ width: 120, height: 50 }} onClick={() => onAnswer(null)}>
        ❓ 不确定 <Text type="secondary" style={{ fontSize: 11 }}>(3)</Text>
      </Button>
    </Space>
  );
}

function MultipleChoiceQuestion({ question, onAnswer }: { question: ValidationQuestion; onAnswer: (id: string) => void }) {
  return (
    <Radio.Group onChange={e => onAnswer(e.target.value)} style={{ marginTop: 16 }}>
      <Space direction="vertical">
        {question.options?.map(opt => (
          <Radio key={opt.id} value={opt.id} style={{ fontSize: 14 }}>
            {opt.id.toUpperCase()}. {opt.text}
          </Radio>
        ))}
      </Space>
    </Radio.Group>
  );
}

function RankingQuestion({ question, onAnswer }: { question: ValidationQuestion; onAnswer: (ids: string[]) => void }) {
  const [items, setItems] = useState(question.rankingItems || []);
  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const newItems = [...items];
    [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    setItems(newItems);
    onAnswer(newItems.map(i => i.id));
  };
  return (
    <div style={{ marginTop: 16 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>点击 ↑ 调整排序</Text>
      {items.map((item, idx) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
          <Tag color="blue">{idx + 1}</Tag>
          <Text>{item.text}</Text>
          {idx > 0 && <Button size="small" type="link" onClick={() => moveUp(idx)}>↑</Button>}
        </div>
      ))}
    </div>
  );
}

function OpenEndedQuestion({ onAnswer }: { onAnswer: (text: string) => void }) {
  return (
    <TextArea
      rows={4}
      placeholder="请输入您的观点..."
      onChange={e => onAnswer(e.target.value)}
      style={{ marginTop: 16 }}
    />
  );
}

export function AnnotationWorkspace() {
  const {
    questions, currentQuestionIndex, results, currentExpert,
    submitAnswer, skipQuestion, nextQuestion, prevQuestion,
  } = useAnnotationStore();

  const [notes, setNotes] = useState('');
  const [startTime] = useState(Date.now());
  const [pendingAnswer, setPendingAnswer] = useState<unknown>(null);

  const question = questions[currentQuestionIndex];
  const answered = results.filter(r => r.questionId === question?.id && r.expertId === currentExpert?.id).length > 0;
  const answeredCount = new Set(results.filter(r => r.expertId === currentExpert?.id).map(r => r.questionId)).size;

  const handleSubmit = useCallback(async () => {
    if (!question) return;
    const duration = Date.now() - startTime;
    const answer: Record<string, unknown> = {};

    if (question.questionType === 'boolean') answer.booleanValue = pendingAnswer;
    else if (question.questionType === 'multiple_choice') answer.selectedOptionId = pendingAnswer;
    else if (question.questionType === 'ranking') answer.rankedItemIds = pendingAnswer;
    else if (question.questionType === 'open_ended') answer.openEndedText = pendingAnswer;

    await submitAnswer(question.id, answer as typeof results[0]['answer'], notes || undefined, duration);
    setNotes('');
    setPendingAnswer(null);
    message.success('已提交');
    if (currentQuestionIndex < questions.length - 1) nextQuestion();
  }, [question, pendingAnswer, notes, startTime, submitAnswer, nextQuestion, currentQuestionIndex, questions.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!question) return;
      if (question.questionType === 'boolean') {
        if (e.key === '1') { setPendingAnswer(true); }
        if (e.key === '2') { setPendingAnswer(false); }
        if (e.key === '3') { setPendingAnswer(null); }
      }
      if (e.key === 'Enter' && pendingAnswer !== null && pendingAnswer !== undefined) handleSubmit();
      if (e.key === 'Backspace' && !notes) prevQuestion();
      if (e.key === 's' || e.key === 'S') {
        if (document.activeElement?.tagName === 'TEXTAREA') return;
        skipQuestion(question.id);
        nextQuestion();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [question, pendingAnswer, notes, handleSubmit, prevQuestion, nextQuestion, skipQuestion]);

  if (!currentExpert) {
    return <Result status="info" title="请先设置专家画像" subTitle="在设置页面添加专家信息" />;
  }

  if (questions.length === 0) {
    return <Result status="info" title="暂无验证问题" subTitle="请先完成本体挖掘，然后生成验证问题" />;
  }

  const difficultyColor = { easy: 'green', medium: 'gold', hard: 'red' };
  const typeLabel = { boolean: '判断题', multiple_choice: '选择题', ranking: '排序题', open_ended: '补充题' };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">专家：{currentExpert.name}</Text>
        <Text type="secondary">{answeredCount}/{questions.length} 已完成</Text>
      </div>
      <Progress percent={Math.round((answeredCount / questions.length) * 100)} size="small" style={{ marginBottom: 16 }} />

      <Card
        title={
          <Space>
            <Text>问题 {currentQuestionIndex + 1} / {questions.length}</Text>
            <Tag color={difficultyColor[question.difficulty]}>{question.difficulty}</Tag>
            <Tag>{typeLabel[question.questionType]}</Tag>
            {answered && <Tag color="success">已回答</Tag>}
          </Space>
        }
      >
        <Title level={5}>{question.text}</Title>
        {question.context && <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>{question.context}</Text>}

        {question.questionType === 'boolean' && (
          <BooleanQuestion question={question} onAnswer={(v) => setPendingAnswer(v)} />
        )}
        {question.questionType === 'multiple_choice' && (
          <MultipleChoiceQuestion question={question} onAnswer={(id) => setPendingAnswer(id)} />
        )}
        {question.questionType === 'ranking' && (
          <RankingQuestion question={question} onAnswer={(ids) => setPendingAnswer(ids)} />
        )}
        {question.questionType === 'open_ended' && (
          <OpenEndedQuestion onAnswer={(text) => setPendingAnswer(text)} />
        )}

        <div style={{ marginTop: 24 }}>
          <TextArea
            rows={2}
            placeholder="备注（可选）"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Tooltip title="Backspace">
                <Button icon={<LeftOutlined />} onClick={prevQuestion} disabled={currentQuestionIndex === 0}>上一题</Button>
              </Tooltip>
              <Tooltip title="S">
                <Button icon={<ForwardOutlined />} onClick={() => { skipQuestion(question.id); nextQuestion(); }}>跳过</Button>
              </Tooltip>
            </Space>
            <Tooltip title="Enter">
              <Button type="primary" icon={<RightOutlined />} onClick={handleSubmit}>
                {currentQuestionIndex < questions.length - 1 ? '下一题' : '完成'}
              </Button>
            </Tooltip>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          快捷键：1=是 2=否 3=不确定 Enter=下一题 Backspace=上一题 S=跳过
        </Text>
      </div>
    </div>
  );
}
