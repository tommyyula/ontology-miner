import { Input, Button, Typography, Tag, Space, Alert } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useMiningStore } from '../../stores/useMiningStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const EXAMPLES = [
  { label: '物流仓储', desc: '物流仓储管理系统，涉及入库、出库、库存管理、库位分配、拣货、打包、发货等业务流程，需要管理仓库、货物、SKU、库位、作业人员等核心实体。' },
  { label: '电商运营', desc: '电子商务运营平台，涵盖商品管理、订单处理、支付结算、物流配送、客户服务等完整电商业务链路。' },
  { label: '供应链', desc: '供应链管理系统，涉及采购、供应商管理、库存控制、物流运输、需求预测等环节，管理供应商、采购订单、物料、运输计划等核心实体。' },
];

export function DomainInput() {
  const { domainDescription, setDomainDescription, generateCQs, isLoading, error } = useMiningStore();

  const canProceed = domainDescription.length >= 20;

  return (
    <div style={{ maxWidth: 700 }}>
      <Title level={4}>📝 输入领域描述</Title>
      <Text type="secondary">
        描述你要挖掘知识的领域。系统将基于此生成 Competency Questions，引导知识挖掘过程。
      </Text>

      <div style={{ marginTop: 16 }}>
        <TextArea
          rows={6}
          value={domainDescription}
          onChange={e => setDomainDescription(e.target.value)}
          placeholder="描述领域的核心业务、主要实体、关键流程、规则约束等..."
          showCount
          maxLength={2000}
          style={{ marginBottom: 8 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          建议 100-500 字，至少 20 字。当前 {domainDescription.length} 字。
        </Text>
      </div>

      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>快速填入示例：</Text>
        <Space size={4} style={{ marginLeft: 8 }}>
          {EXAMPLES.map(ex => (
            <Tag key={ex.label} style={{ cursor: 'pointer' }} onClick={() => setDomainDescription(ex.desc)}>
              {ex.label}
            </Tag>
          ))}
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginTop: 16 }} closable />}

      <div style={{ marginTop: 24 }}>
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={generateCQs}
          loading={isLoading}
          disabled={!canProceed}
        >
          生成 Competency Questions
        </Button>
      </div>
    </div>
  );
}
