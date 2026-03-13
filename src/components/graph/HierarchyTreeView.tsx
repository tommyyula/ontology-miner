import { Tree, Card, Empty, Tag, Typography } from 'antd';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import { useVisualizationStore } from '../../stores/useVisualizationStore';

const { Text } = Typography;

interface TreeNode {
  key: string;
  title: React.ReactNode;
  children: TreeNode[];
}

function buildTree(concepts: OntologyConcept[], relations: OntologyRelation[]): TreeNode[] {
  // Find root concepts (no parent or parentId is null)
  const childMap = new Map<string, string[]>();
  concepts.forEach(c => {
    if (c.parentId) {
      const children = childMap.get(c.parentId) || [];
      children.push(c.id);
      childMap.set(c.parentId, children);
    }
  });

  // Also add is_a/part_of relations
  relations.forEach(r => {
    if (['is_a', 'part_of', 'composed_of', 'inherits_from'].includes(r.relationType)) {
      const children = childMap.get(r.targetConceptId) || [];
      if (!children.includes(r.sourceConceptId)) {
        children.push(r.sourceConceptId);
        childMap.set(r.targetConceptId, children);
      }
    }
  });

  const conceptMap = new Map(concepts.map(c => [c.id, c]));
  const hasParent = new Set<string>();
  childMap.forEach(children => children.forEach(id => hasParent.add(id)));

  const layerColors: Record<string, string> = {
    upper: '#1677ff',
    domain: '#52c41a',
    task: '#faad14',
    application: '#ff4d4f',
  };

  function buildNode(conceptId: string, depth: number = 0): TreeNode {
    const c = conceptMap.get(conceptId);
    if (!c) return { key: conceptId, title: conceptId, children: [] };
    const children = childMap.get(conceptId) || [];
    return {
      key: c.id,
      title: (
        <span>
          <Tag color={layerColors[c.ontologyLayer] || 'default'} style={{ fontSize: 10 }}>{c.ontologyLayer}</Tag>
          <Text strong>{c.name}</Text>
          {c.confidence !== undefined && (
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
              ({(c.confidence * 100).toFixed(0)}%)
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
            [{c.properties.length} 属性]
          </Text>
        </span>
      ),
      children: children
        .filter(id => id !== conceptId)
        .map(id => buildNode(id, depth + 1)),
    };
  }

  // Roots: concepts that have no parent
  const roots = concepts.filter(c => !hasParent.has(c.id) && !c.parentId);
  return roots.map(c => buildNode(c.id));
}

export function HierarchyTreeView({ concepts, relations }: { concepts: OntologyConcept[]; relations: OntologyRelation[] }) {
  const { selectConcept } = useVisualizationStore();
  const treeData = buildTree(concepts, relations);

  if (concepts.length === 0) {
    return <Empty description="暂无概念数据" />;
  }

  return (
    <Card size="small" title="层级树状图" style={{ height: '100%', overflow: 'auto' }}>
      <Tree
        treeData={treeData}
        defaultExpandAll
        showLine
        onSelect={(keys) => {
          if (keys.length > 0) selectConcept(keys[0] as string);
        }}
      />
    </Card>
  );
}
