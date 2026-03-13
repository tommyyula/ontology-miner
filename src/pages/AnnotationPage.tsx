import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Typography, Card, Input, Button, Select, InputNumber, Space, message } from 'antd';
import { useAnnotationStore } from '../stores/useAnnotationStore';
import { AnnotationWorkspace } from '../components/annotation/AnnotationWorkspace';
import type { ExpertLevel } from '../types/annotation';

const { Title, Text } = Typography;

export function AnnotationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { currentExpert, addExpert, setCurrentExpert, loadAnnotations, loadExperts, experts, questions } = useAnnotationStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [level, setLevel] = useState<ExpertLevel>('mid');
  const [years, setYears] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (sessionId) {
        await loadAnnotations(sessionId);
        await loadExperts();
      }
      setLoading(false);
    };
    init();
  }, [sessionId]);

  const handleSetup = async () => {
    if (!name.trim()) { message.error('请输入姓名'); return; }
    // Check if expert already exists
    const existing = experts.find(e => e.email === email);
    if (existing) {
      setCurrentExpert(existing);
    } else {
      const expert = await addExpert({ name, email, domains, level, experienceYears: years });
      setCurrentExpert(expert);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentExpert) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 24 }}>
        <Card>
          <Title level={4}>🧠 Ontology Miner — 标注验证</Title>
          <Text type="secondary">请先填写您的专家信息，然后开始标注</Text>
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <Text>姓名 *</Text>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="张三" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text>邮箱</Text>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="zhang@example.com" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text>专业领域</Text>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                value={domains}
                onChange={setDomains}
                placeholder="输入领域标签"
                options={[
                  { value: '仓储', label: '仓储' },
                  { value: '物流', label: '物流' },
                  { value: '供应链', label: '供应链' },
                  { value: 'IT系统', label: 'IT系统' },
                  { value: '管理', label: '管理' },
                ]}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Space>
                <div>
                  <Text>级别</Text>
                  <Select value={level} onChange={setLevel} style={{ width: 120 }}>
                    <Select.Option value="junior">初级</Select.Option>
                    <Select.Option value="mid">中级</Select.Option>
                    <Select.Option value="senior">高级</Select.Option>
                    <Select.Option value="principal">资深</Select.Option>
                  </Select>
                </div>
                <div>
                  <Text>经验年限</Text>
                  <InputNumber value={years} onChange={v => setYears(v || 0)} min={0} max={50} />
                </div>
              </Space>
            </div>
            <Button type="primary" block onClick={handleSetup}>
              开始标注 ({questions.length} 个问题)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <AnnotationWorkspace />;
}
