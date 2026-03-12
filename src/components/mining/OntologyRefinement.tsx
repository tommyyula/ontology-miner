import { useState } from 'react';
import { Button, Typography, Space, Card, Tag, List, Alert, Drawer, Descriptions, Modal, Input, Select, message } from 'antd';
import { NodeExpandOutlined, DeleteOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useMiningStore } from '../../stores/useMiningStore';
import { OntologyGraph } from '../graph/OntologyGraph';
import { OntologyLayer } from '../../types/ontology';

const { Title, Text, Paragraph } = Typography;

const LAYER_LABELS: Record<string, string> = {
  upper: '上层本体',
  domain: '领域本体',
  task: '任务本体',
  application: '应用本体',
};

export function OntologyRefinement() {
  const {
    concepts, relations, drillDown, deleteConcept,
    addConcept, advancePhase, isLoading, error,
  } = useMiningStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newConceptName, setNewConceptName] = useState('');
  const [newConceptDesc, setNewConceptDesc] = useState('');
  const [newConceptLayer, setNewConceptLayer] = useState<OntologyLayer>(OntologyLayer.DOMAIN);

  const selectedConcept = concepts.find(c => c.id === selectedId);

  const handleDrillDown = async (id: string) => {
    await drillDown(id);
  };

  const handleSelectConcept = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleAddConcept = () => {
    if (!newConceptName.trim()) return;
    addConcept({
      name: newConceptName.trim(),
      description: newConceptDesc.trim(),
      ontologyLayer: newConceptLayer,
    });
    setAddModalOpen(false);
    setNewConceptName('');
    setNewConceptDesc('');
    message.success('概念已添加');
  };

  const handleDeleteConcept = (id: string, name: string) => {
    Modal.confirm({
      title: '删除概念',
      content: `确定要删除概念「${name}」吗？相关的关系也会被删除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteConcept(id);
        setDrawerOpen(false);
        setSelectedId(null);
      },
    });
  };

  const maxDepth = Math.max(...concepts.map(c => c.depth), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🔬 本体图谱</Title>
          <Text type="secondary">
            {concepts.length} 个概念 · {relations.length} 条关系 · 最大深度 {maxDepth} ·
            双击节点深入，单击查看详情
          </Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            添加概念
          </Button>
          <Button type="primary" onClick={advancePhase} disabled={concepts.length === 0}>
            进入工作流提取 →
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />}
      {isLoading && <Alert type="info" message="正在深入展开概念..." showIcon style={{ marginBottom: 16 }} />}

      {/* Concept stats */}
      <Space size={8} style={{ marginBottom: 16 }}>
        {Object.entries(LAYER_LABELS).map(([layer, label]) => {
          const count = concepts.filter(c => c.ontologyLayer === layer).length;
          if (count === 0) return null;
          return <Tag key={layer}>{label}: {count}</Tag>;
        })}
      </Space>

      {/* Graph */}
      <OntologyGraph
        concepts={concepts}
        relations={relations}
        onDrillDown={handleDrillDown}
        onSelectConcept={handleSelectConcept}
        height={500}
      />

      {/* Concept list view */}
      <Card title="概念列表" size="small" style={{ marginTop: 16 }}>
        <List
          size="small"
          dataSource={concepts}
          renderItem={c => (
            <List.Item
              actions={[
                <Button
                  key="drill"
                  size="small"
                  type="link"
                  icon={<NodeExpandOutlined />}
                  onClick={() => handleDrillDown(c.id)}
                  disabled={c.isExpanded || isLoading}
                >
                  深入
                </Button>,
                <Button
                  key="view"
                  size="small"
                  type="link"
                  onClick={() => handleSelectConcept(c.id)}
                >
                  详情
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text>{c.name}</Text>
                    <Tag color={c.ontologyLayer === 'upper' ? 'purple' : c.ontologyLayer === 'domain' ? 'blue' : c.ontologyLayer === 'task' ? 'green' : 'orange'}>
                      {LAYER_LABELS[c.ontologyLayer]}
                    </Tag>
                    {c.depth > 0 && <Text type="secondary" style={{ fontSize: 11 }}>深度 {c.depth}</Text>}
                    {c.isExpanded && <CheckOutlined style={{ color: '#52c41a', fontSize: 11 }} />}
                  </Space>
                }
                description={c.description}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Concept detail drawer */}
      <Drawer
        title={selectedConcept?.name}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={400}
        extra={
          selectedConcept && (
            <Space>
              <Button
                size="small"
                icon={<NodeExpandOutlined />}
                onClick={() => handleDrillDown(selectedConcept.id)}
                disabled={selectedConcept.isExpanded || isLoading}
              >
                深入
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteConcept(selectedConcept.id, selectedConcept.name)}
              >
                删除
              </Button>
            </Space>
          )
        }
      >
        {selectedConcept && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="层级">{LAYER_LABELS[selectedConcept.ontologyLayer]}</Descriptions.Item>
              <Descriptions.Item label="深度">{selectedConcept.depth}</Descriptions.Item>
              <Descriptions.Item label="状态">{selectedConcept.status}</Descriptions.Item>
              <Descriptions.Item label="别名">{selectedConcept.aliases.join(', ') || '无'}</Descriptions.Item>
            </Descriptions>

            <div>
              <Text strong>描述</Text>
              <Paragraph>{selectedConcept.description}</Paragraph>
            </div>

            <div>
              <Text strong>属性（{selectedConcept.properties.length}）</Text>
              <List
                size="small"
                dataSource={selectedConcept.properties}
                renderItem={p => (
                  <List.Item>
                    <div>
                      <Text>{p.name}</Text>
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                        {p.dataType}{p.isRequired ? ' *' : ''}
                      </Text>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>{p.description}</Text></div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: '暂无属性' }}
              />
            </div>
          </Space>
        )}
      </Drawer>

      {/* Add concept modal */}
      <Modal
        title="添加概念"
        open={addModalOpen}
        onOk={handleAddConcept}
        onCancel={() => setAddModalOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="概念名称" value={newConceptName} onChange={e => setNewConceptName(e.target.value)} />
          <Input.TextArea placeholder="概念描述" value={newConceptDesc} onChange={e => setNewConceptDesc(e.target.value)} rows={3} />
          <Select
            value={newConceptLayer}
            onChange={setNewConceptLayer}
            style={{ width: '100%' }}
            options={Object.entries(LAYER_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </Space>
      </Modal>
    </div>
  );
}
