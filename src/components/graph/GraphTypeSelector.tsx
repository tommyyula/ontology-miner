import { Tabs } from 'antd';
import {
  ShareAltOutlined,
  UnorderedListOutlined,
  ApartmentOutlined,
  TableOutlined,
  NodeIndexOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useVisualizationStore } from '../../stores/useVisualizationStore';
import type { GraphType } from '../../types/visualization';

const graphTabs: { key: GraphType; label: string; icon: React.ReactNode }[] = [
  { key: 'knowledge_graph', label: '知识图谱', icon: <ShareAltOutlined /> },
  { key: 'property_graph', label: '属性图', icon: <UnorderedListOutlined /> },
  { key: 'hierarchy_tree', label: '层级树', icon: <ApartmentOutlined /> },
  { key: 'relation_matrix', label: '关系矩阵', icon: <TableOutlined /> },
  { key: 'workflow_diagram', label: '流程图', icon: <NodeIndexOutlined /> },
  { key: 'stats_dashboard', label: '统计', icon: <BarChartOutlined /> },
];

export function GraphTypeSelector() {
  const { activeGraphType, setActiveGraphType } = useVisualizationStore();

  return (
    <Tabs
      activeKey={activeGraphType}
      onChange={(key) => setActiveGraphType(key as GraphType)}
      size="small"
      items={graphTabs.map(tab => ({
        key: tab.key,
        label: (
          <span>
            {tab.icon} {tab.label}
          </span>
        ),
      }))}
    />
  );
}
