import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Space, Modal, Input, Empty, Dropdown, Tag, message, Upload,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined,
  ImportOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../stores/useProjectStore';
import { PHASE_LABELS } from '../types/mining';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PHASE_COLORS: Record<string, string> = {
  domain_input: 'blue',
  cq_generation: 'cyan',
  cq_selection: 'geekblue',
  cq_expansion: 'purple',
  cq_confirmation: 'purple',
  ontology_extraction: 'green',
  ontology_refinement: 'green',
  workflow_extraction: 'orange',
  relation_mapping: 'orange',
  review: 'gold',
  export: 'red',
};

export function ProjectListPage() {
  const navigate = useNavigate();
  const { projects, loading, loadProjects, createProject, deleteProject, renameProject } = useProjectStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!newName.trim() || newDesc.length < 20) {
      message.warning('请输入项目名称和至少20个字符的领域描述');
      return;
    }
    const id = await createProject(newName.trim(), newDesc.trim());
    setCreateModalOpen(false);
    setNewName('');
    setNewDesc('');
    navigate(`/project/${id}`);
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目「${name}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteProject(id),
    });
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.name && data.description) {
          const id = await createProject(data.name, data.description);
          message.success('项目导入成功');
          navigate(`/project/${id}`);
        }
      } catch {
        message.error('导入失败：无效的JSON文件');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>我的项目</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)} size="large">
          新建项目
        </Button>
      </div>

      {projects.length === 0 && !loading ? (
        <Empty
          description="还没有项目，点击上方按钮创建第一个"
          style={{ marginTop: 80 }}
        >
          <Button type="primary" onClick={() => setCreateModalOpen(true)}>新建项目</Button>
        </Empty>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {projects.map(p => (
            <Card
              key={p.id}
              hoverable
              onClick={() => navigate(`/project/${p.id}`)}
              style={{ cursor: 'pointer' }}
              extra={
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'rename',
                        icon: <EditOutlined />,
                        label: '重命名',
                        onClick: ({ domEvent }) => {
                          domEvent.stopPropagation();
                          const name = prompt('输入新名称', p.name);
                          if (name) renameProject(p.id, name);
                        },
                      },
                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: '删除',
                        danger: true,
                        onClick: ({ domEvent }) => {
                          domEvent.stopPropagation();
                          handleDelete(p.id, p.name);
                        },
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={<EllipsisOutlined />}
                    onClick={e => e.stopPropagation()}
                  />
                </Dropdown>
              }
            >
              <Card.Meta
                title={p.name}
                description={
                  <Space size={12}>
                    <Tag color={PHASE_COLORS[p.currentPhase] || 'default'}>
                      {PHASE_LABELS[p.currentPhase]}
                    </Tag>
                    <Text type="secondary">
                      <ClockCircleOutlined /> {timeAgo(p.updatedAt)}
                    </Text>
                  </Space>
                }
              />
            </Card>
          ))}
        </Space>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Upload accept=".json" showUploadList={false} beforeUpload={handleImport}>
          <Button icon={<ImportOutlined />}>导入项目...</Button>
        </Upload>
      </div>

      <Modal
        title="新建知识挖掘项目"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); setNewName(''); setNewDesc(''); }}
        okText="创建"
        cancelText="取消"
        okButtonProps={{ disabled: !newName.trim() || newDesc.length < 20 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text strong>项目名称</Text>
            <Input
              placeholder="例如：物流仓储管理"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text strong>领域描述</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
              描述你要挖掘知识的领域（至少20个字符）
            </Text>
            <TextArea
              rows={4}
              placeholder="描述这个领域的核心业务、主要实体、关键流程..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              showCount
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>示例领域：</Text>
              <Space size={4} style={{ marginLeft: 8 }}>
                {[
                  { label: '物流仓储', desc: '物流仓储管理系统，涉及入库、出库、库存管理、库位分配、拣货、打包、发货等业务流程，需要管理仓库、货物、SKU、库位、作业人员等核心实体。' },
                  { label: '电商运营', desc: '电子商务运营平台，涵盖商品管理、订单处理、支付结算、物流配送、客户服务等完整电商业务链路，需要管理商品、订单、客户、商家、支付等核心实体。' },
                  { label: '供应链', desc: '供应链管理系统，涉及采购、供应商管理、库存控制、物流运输、需求预测等环节，需要管理供应商、采购订单、物料、运输计划等核心实体。' },
                ].map(ex => (
                  <Tag
                    key={ex.label}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setNewName(ex.label + '管理'); setNewDesc(ex.desc); }}
                  >
                    {ex.label}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
