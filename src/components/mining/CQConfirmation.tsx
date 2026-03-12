import { Card, Button, Typography, Space, Tag, Input, Alert } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import { useMiningStore } from '../../stores/useMiningStore';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export function CQConfirmation() {
  const { expandedCQs, confirmExpansion, updateExpansion, extractOntology, isLoading, error } = useMiningStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const confirmedCount = expandedCQs.filter(eq => eq.confirmed).length;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>✅ 确认展开内容</Title>
        <Text type="secondary">
          审查 LLM 生成的展开内容，确认或修改后进入本体提取。已确认 {confirmedCount}/{expandedCQs.length}
        </Text>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />}

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {expandedCQs.map((eq) => (
          <Card
            key={eq.cqId}
            size="small"
            style={{
              borderColor: eq.confirmed ? '#52c41a' : undefined,
              background: eq.confirmed ? '#f6ffed' : undefined,
            }}
            title={
              <Space>
                {eq.confirmed ? <CheckOutlined style={{ color: '#52c41a' }} /> : null}
                <Text strong>{eq.originalText}</Text>
              </Space>
            }
            extra={
              <Space>
                <Button
                  type={eq.confirmed ? 'default' : 'primary'}
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => confirmExpansion(eq.cqId, !eq.confirmed)}
                >
                  {eq.confirmed ? '取消确认' : '确认'}
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setEditingId(editingId === eq.cqId ? null : eq.cqId)}
                >
                  编辑
                </Button>
              </Space>
            }
          >
            {editingId === eq.cqId ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>展开内容</Text>
                  <TextArea
                    rows={4}
                    value={eq.expansion}
                    onChange={e => updateExpansion(eq.cqId, { expansion: e.target.value })}
                  />
                </div>
                <div>
                  <Text strong>补充说明</Text>
                  <TextArea
                    rows={2}
                    value={eq.userNotes}
                    onChange={e => updateExpansion(eq.cqId, { userNotes: e.target.value })}
                    placeholder="添加领域专有知识或修正意见..."
                  />
                </div>
              </Space>
            ) : (
              <>
                <Paragraph style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                  {eq.expansion}
                </Paragraph>

                {eq.subQuestions.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 13 }}>衍生子问题：</Text>
                    <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                      {eq.subQuestions.map((sq, i) => (
                        <li key={i}><Text style={{ fontSize: 13 }}>{sq}</Text></li>
                      ))}
                    </ul>
                  </div>
                )}

                <Space wrap size={4}>
                  <Text strong style={{ fontSize: 12 }}>概念：</Text>
                  {eq.extractedConcepts.map(c => (
                    <Tag key={c} color="blue" style={{ fontSize: 11 }}>{c}</Tag>
                  ))}
                </Space>

                {eq.extractedRelations.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <Space wrap size={4}>
                      <Text strong style={{ fontSize: 12 }}>关系：</Text>
                      {eq.extractedRelations.map(r => (
                        <Tag key={r} color="purple" style={{ fontSize: 11 }}>{r}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {eq.userNotes && (
                  <div style={{ marginTop: 8, padding: '4px 8px', background: '#fffbe6', borderRadius: 4 }}>
                    <Text style={{ fontSize: 12 }}>📝 {eq.userNotes}</Text>
                  </div>
                )}
              </>
            )}
          </Card>
        ))}
      </Space>

      <div style={{ marginTop: 24 }}>
        <Button
          type="primary"
          size="large"
          onClick={extractOntology}
          loading={isLoading}
          disabled={confirmedCount === 0}
        >
          提取本体（基于 {confirmedCount} 个确认内容）→
        </Button>
      </div>
    </div>
  );
}
