import { useState } from 'react';
import { Card, Typography, Select, Input, Button, Space, InputNumber, message, Popconfirm } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useSettingsStore, PROVIDER_MODELS } from '../stores/useSettingsStore';
import { createLLMProvider } from '../services/llm';
import { db } from '../services/persistence/db';
import type { LLMProviderType } from '../types/llm';

const { Title, Text } = Typography;

export function SettingsPage() {
  const settings = useSettingsStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

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

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      <Title level={3}>设置</Title>

      <Card title="LLM Provider" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text strong>Provider</Text>
            <Select
              value={settings.provider}
              onChange={(v: LLMProviderType) => { settings.setProvider(v); setTestResult(null); }}
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'mock', label: 'Mock（演示模式）' },
              ]}
            />
          </div>

          <div>
            <Text strong>Model</Text>
            <Select
              value={settings.model}
              onChange={settings.setModel}
              style={{ width: '100%', marginTop: 4 }}
              options={PROVIDER_MODELS[settings.provider].map(m => ({ value: m, label: m }))}
            />
          </div>

          {settings.provider !== 'mock' && (
            <div>
              <Text strong>API Key</Text>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <Input.Password
                  value={settings.apiKey}
                  onChange={e => { settings.setApiKey(e.target.value); setTestResult(null); }}
                  placeholder="输入 API Key"
                />
                <Button
                  onClick={handleTest}
                  loading={testing}
                  icon={testResult === null ? undefined : testResult ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                >
                  测试连接
                </Button>
              </Space.Compact>
            </div>
          )}
        </Space>
      </Card>

      <Card title="挖掘默认设置" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text strong>CQ 数量</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>每次生成的 Competency Questions 数量</Text>
            <InputNumber
              value={settings.maxCQCount}
              onChange={v => settings.setMaxCQCount(v || 10)}
              min={5}
              max={20}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>

          <div>
            <Text strong>最大深入层数</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>本体细化时的最大深入层级（0=无限）</Text>
            <InputNumber
              value={settings.maxDepth}
              onChange={v => settings.setMaxDepth(v || 10)}
              min={0}
              max={20}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>

          <div>
            <Text strong>语言</Text>
            <Select
              value={settings.language}
              onChange={settings.setLanguage}
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: 'zh', label: '中文' },
                { value: 'en', label: 'English' },
                { value: 'auto', label: '自动检测' },
              ]}
            />
          </div>
        </Space>
      </Card>

      <Card title="数据管理">
        <Space>
          <Popconfirm
            title="确定要清除所有数据吗？"
            description="此操作不可恢复，所有项目和设置都会被删除。"
            onConfirm={handleClearAll}
            okText="确认清除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger>清除所有数据</Button>
          </Popconfirm>
        </Space>
      </Card>
    </div>
  );
}
