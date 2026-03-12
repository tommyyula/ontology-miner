import { useState } from 'react';
import { Card, Checkbox, Tag, Button, Typography, Space, Input, Select, Alert } from 'antd';
import { PlusOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import { useMiningStore } from '../../stores/useMiningStore';
import { CQCategory } from '../../types/cq';

const { Title, Text, Paragraph } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  scoping: 'blue',
  foundational: 'green',
  relationship: 'purple',
  process: 'orange',
  constraint: 'red',
};

const CATEGORY_LABELS: Record<string, string> = {
  scoping: '范围界定',
  foundational: '基础概念',
  relationship: '关系发现',
  process: '流程相关',
  constraint: '约束规则',
};

const IMPORTANCE_ICONS: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

export function CQList() {
  const {
    competencyQuestions, selectedCQIds, toggleCQ, expandCQs,
    generateCQs, addCustomCQ, isLoading, error,
  } = useMiningStore();

  const [addingCustom, setAddingCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customCategory, setCustomCategory] = useState<CQCategory>(CQCategory.FOUNDATIONAL);
  const handleAddCustom = () => {
    if (customText.trim()) {
      addCustomCQ(customText.trim(), customCategory);
      setCustomText('');
      setAddingCustom(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>📋 选择核心 CQ</Title>
          <Text type="secondary">
            选择要深入探索的 Competency Questions（已选 {selectedCQIds.length}/{competencyQuestions.length}）
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={generateCQs} loading={isLoading}>
            重新生成
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />}

      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {competencyQuestions.map((cq, idx) => (
          <Card
            key={cq.id}
            size="small"
            style={{
              borderColor: selectedCQIds.includes(cq.id) ? '#1677ff' : undefined,
              background: selectedCQIds.includes(cq.id) ? '#f0f5ff' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Checkbox
                checked={selectedCQIds.includes(cq.id)}
                onChange={() => toggleCQ(cq.id)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text strong>Q{idx + 1}</Text>
                  <Tag color={CATEGORY_COLORS[cq.category]}>{CATEGORY_LABELS[cq.category]}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {IMPORTANCE_ICONS[cq.importance]} {cq.importance}
                  </Text>
                </div>
                <Paragraph style={{ margin: 0 }}>{cq.text}</Paragraph>
                {cq.relatedConcepts.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {cq.relatedConcepts.map(c => (
                      <Tag key={c} style={{ fontSize: 11 }}>{c}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {addingCustom ? (
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="输入自定义 CQ..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onPressEnter={handleAddCustom}
              />
              <Space>
                <Select
                  value={customCategory}
                  onChange={setCustomCategory}
                  size="small"
                  options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                  style={{ width: 120 }}
                />
                <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleAddCustom}>
                  添加
                </Button>
                <Button size="small" onClick={() => setAddingCustom(false)}>取消</Button>
              </Space>
            </Space>
          </Card>
        ) : (
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => setAddingCustom(true)}
          >
            添加自定义 CQ
          </Button>
        )}
      </Space>

      <div style={{ marginTop: 24 }}>
        <Button
          type="primary"
          size="large"
          onClick={expandCQs}
          loading={isLoading}
          disabled={selectedCQIds.length === 0}
        >
          展开选中的 CQ（{selectedCQIds.length} 个）→
        </Button>
      </div>
    </div>
  );
}
