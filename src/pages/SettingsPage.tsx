import { useState } from 'react';
import { Card, Typography, Select, Input, Button, Space, InputNumber, message, Popconfirm, Switch, Slider, Table, Tag, Modal, Form } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useSettingsStore, PROVIDER_MODELS } from '../stores/useSettingsStore';
import { useAnnotationStore } from '../stores/useAnnotationStore';
import { createLLMProvider } from '../services/llm';
import { db } from '../services/persistence/db';
import type { LLMProviderType } from '../types/llm';

const { Title, Text } = Typography;

export function SettingsPage() {
  const settings = useSettingsStore();
  const { experts, addExpert, loadExperts } = useAnnotationStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [expertModal, setExpertModal] = useState(false);
  const [form] = Form.useForm();

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const provider = createLLMProvider(settings.provider);
      provider.configure({ apiKey: settings.apiKey, model: settings.model });
      const ok = await provider.validate();
      setTestResult(ok);
      message[ok ? 'success' : 'error'](ok ? '连接成功' : '连接失败');
    } catch {
      setTestResult(false);
      message.error('连接测试失败');
    }
    setTesting(false);
  };

  const handleClearAll = async () => {
    await db.delete();
    message.success('所有数据已清除，页面即将刷新');
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleAddExpert = async () => {
    const values = await form.validateFields();
    await addExpert({
      name: values.name,
      email: values.email || '',
      domains: values.domains || [],
      level: values.level || 'mid',
      experienceYears: values.years || 0,
    });
    setExpertModal(false);
    form.resetFields();
    message.success('专家已添加');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Title level={3}>设置</Title>

      {/* LLM Provider */}
      <Card title="LLM Provider（主模型）" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Text strong>Provider</Text>
              <Select value={settings.provider} onChange={(v: LLMProviderType) => { settings.setProvider(v); setTestResult(null); }} style={{ width: '100%', marginTop: 4 }}
                options={[{ value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Anthropic' }, { value: 'mock', label: 'Mock（演示模式）' }]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text strong>Model</Text>
              <Select value={settings.model} onChange={settings.setModel} style={{ width: '100%', marginTop: 4 }}
                options={PROVIDER_MODELS[settings.provider].map(m => ({ value: m, label: m }))}
              />
            </div>
          </div>
          {settings.provider !== 'mock' && (
            <div>
              <Text strong>API Key</Text>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <Input.Password value={settings.apiKey} onChange={e => { settings.setApiKey(e.target.value); setTestResult(null); }} placeholder="API Key" />
                <Button onClick={handleTest} loading={testing}
                  icon={testResult === null ? undefined : testResult ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}>
                  测试
                </Button>
              </Space.Compact>
            </div>
          )}
        </Space>
      </Card>

      {/* Debate Configuration */}
      <Card title="辩论配置" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text strong>启用辩论模式</Text>
            <Switch checked={settings.debateConfig.enabled} onChange={v => settings.setDebateConfig({ enabled: v })} />
            <Select value={settings.debateConfig.presets} onChange={v => settings.setDebateConfig({ presets: v })} style={{ width: 120 }}
              options={[{ value: 'quick', label: '快速' }, { value: 'standard', label: '标准' }, { value: 'deep', label: '深度' }, { value: 'custom', label: '自定义' }]}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Proposer</Text>
              <Select value={settings.debateConfig.proposer.provider} style={{ width: '100%' }} size="small"
                onChange={v => settings.setDebateConfig({ proposer: { ...settings.debateConfig.proposer, provider: v } })}
                options={[{ value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Anthropic' }, { value: 'mock', label: 'Mock' }]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Challenger</Text>
              <Select value={settings.debateConfig.challenger.provider} style={{ width: '100%' }} size="small"
                onChange={v => settings.setDebateConfig({ challenger: { ...settings.debateConfig.challenger, provider: v } })}
                options={[{ value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Anthropic' }, { value: 'mock', label: 'Mock' }]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Judge</Text>
              <Select value={settings.debateConfig.judge.provider} style={{ width: '100%' }} size="small"
                onChange={v => settings.setDebateConfig({ judge: { ...settings.debateConfig.judge, provider: v } })}
                options={[{ value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Anthropic' }, { value: 'mock', label: 'Mock' }]}
              />
            </div>
          </div>
          <div>
            <Text strong>辩论轮数</Text>
            <Slider value={settings.debateConfig.rounds} onChange={v => settings.setDebateConfig({ rounds: v })} min={1} max={5} marks={{ 1: '1', 3: '3', 5: '5' }} />
          </div>
        </Space>
      </Card>

      {/* Mining Defaults */}
      <Card title="挖掘默认设置" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Text strong>CQ 数量</Text>
            <InputNumber value={settings.maxCQCount} onChange={v => settings.setMaxCQCount(v || 15)} min={10} max={25} style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>最大深入层数</Text>
            <InputNumber value={settings.maxDepth} onChange={v => settings.setMaxDepth(v || 10)} min={0} max={20} style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>语言</Text>
            <Select value={settings.language} onChange={settings.setLanguage} style={{ width: '100%', marginTop: 4 }}
              options={[{ value: 'zh', label: '中文' }, { value: 'en', label: 'English' }, { value: 'auto', label: '自动' }]}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>默认模式</Text>
            <Select value={settings.defaultMode} onChange={settings.setDefaultMode} style={{ width: '100%', marginTop: 4 }}
              options={[{ value: 'manual', label: '手动' }, { value: 'auto', label: '自动' }]}
            />
          </div>
        </div>
      </Card>

      {/* Annotation */}
      <Card title="标注验证" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Text strong>最大问题数</Text>
            <InputNumber value={settings.maxQuestions} onChange={v => settings.setMaxQuestions(v || 30)} min={10} max={100} style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>共识阈值</Text>
            <Slider value={settings.consensusThreshold} onChange={settings.setConsensusThreshold} min={0.5} max={1} step={0.05}
              marks={{ 0.5: '0.5', 0.7: '0.7', 1: '1.0' }}
            />
          </div>
        </div>
      </Card>

      {/* Data Sources */}
      <Card title="数据源设置" size="small" style={{ marginBottom: 16 }}>
        <Text strong>CORS Proxy URL</Text>
        <Input value={settings.corsProxyUrl} onChange={e => settings.setCorsProxyUrl(e.target.value)} style={{ marginTop: 4 }} />
      </Card>

      {/* Expert Profiles */}
      <Card
        title="专家画像"
        size="small"
        style={{ marginBottom: 16 }}
        extra={<Button size="small" icon={<PlusOutlined />} onClick={() => { loadExperts(); setExpertModal(true); }}>添加专家</Button>}
      >
        <Table
          size="small"
          dataSource={experts}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '姓名', dataIndex: 'name', key: 'name' },
            { title: '领域', dataIndex: 'domains', key: 'domains', render: (d: string[]) => d.map(x => <Tag key={x}>{x}</Tag>) },
            { title: '经验', dataIndex: 'experienceYears', key: 'years', render: (y: number) => `${y}年` },
            { title: '级别', dataIndex: 'level', key: 'level', render: (l: string) => {
              const labels: Record<string, string> = { junior: '初级', mid: '中级', senior: '高级', principal: '资深' };
              return <Tag>{labels[l] || l}</Tag>;
            }},
          ]}
        />
      </Card>

      {/* Data Management */}
      <Card title="数据管理" size="small">
        <Popconfirm title="确定清除？" description="此操作不可恢复" onConfirm={handleClearAll} okText="确认" cancelText="取消" okButtonProps={{ danger: true }}>
          <Button danger>清除所有数据</Button>
        </Popconfirm>
      </Card>

      {/* Expert Modal */}
      <Modal title="添加专家" open={expertModal} onOk={handleAddExpert} onCancel={() => setExpertModal(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="domains" label="专业领域">
            <Select mode="tags" placeholder="输入领域标签" options={[
              { value: '仓储', label: '仓储' }, { value: '物流', label: '物流' }, { value: '供应链', label: '供应链' },
              { value: 'IT系统', label: 'IT系统' }, { value: '管理', label: '管理' },
            ]} />
          </Form.Item>
          <Space>
            <Form.Item name="level" label="级别" initialValue="mid">
              <Select style={{ width: 120 }} options={[
                { value: 'junior', label: '初级' }, { value: 'mid', label: '中级' }, { value: 'senior', label: '高级' }, { value: 'principal', label: '资深' },
              ]} />
            </Form.Item>
            <Form.Item name="years" label="经验年限" initialValue={5}>
              <InputNumber min={0} max={50} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
