import { Card, Button, Typography, Space, Radio, message } from 'antd';
import { DownloadOutlined, FileTextOutlined, CodeOutlined, TableOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useMiningStore } from '../../stores/useMiningStore';
import type { ExportFormat } from '../../types/mining';

const { Title, Text } = Typography;

const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON', icon: <CodeOutlined />, desc: '完整数据结构，可重新导入' },
  { value: 'markdown', label: 'Markdown', icon: <FileTextOutlined />, desc: '人类可读的文档格式' },
  { value: 'json-ld', label: 'JSON-LD', icon: <CodeOutlined />, desc: '语义网标准格式' },
  { value: 'csv', label: 'CSV', icon: <TableOutlined />, desc: '概念表 + 关系表 + 工作流表' },
  { value: 'mermaid', label: 'Mermaid', icon: <CodeOutlined />, desc: '可嵌入 Markdown 的图表代码' },
];

function exportJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

function exportText(text: string, filename: string, type = 'text/plain') {
  const blob = new Blob([text], { type });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const { currentProject, concepts, relations, workflows } = useMiningStore();
  const [format, setFormat] = useState<ExportFormat>('json');

  const handleExport = () => {
    const projectName = currentProject?.name || 'ontology';

    switch (format) {
      case 'json': {
        const data = {
          name: currentProject?.name,
          description: currentProject?.description,
          exportedAt: new Date().toISOString(),
          concepts,
          relations,
          workflows,
          stats: {
            totalConcepts: concepts.length,
            totalRelations: relations.length,
            totalWorkflows: workflows.length,
            maxDepth: Math.max(...concepts.map(c => c.depth), 0),
          },
        };
        exportJson(data, `${projectName}.json`);
        break;
      }
      case 'markdown': {
        let md = `# ${projectName}\n\n`;
        md += `> 导出时间: ${new Date().toLocaleString()}\n\n`;
        md += `## 统计\n\n- 概念: ${concepts.length}\n- 关系: ${relations.length}\n- 工作流: ${workflows.length}\n\n`;

        md += `## 概念\n\n`;
        concepts.forEach(c => {
          md += `### ${c.name}\n\n`;
          md += `- **层级**: ${c.ontologyLayer}\n`;
          md += `- **描述**: ${c.description}\n`;
          if (c.aliases.length > 0) md += `- **别名**: ${c.aliases.join(', ')}\n`;
          if (c.properties.length > 0) {
            md += `- **属性**:\n`;
            c.properties.forEach(p => {
              md += `  - ${p.name} (${p.dataType}${p.isRequired ? ', 必填' : ''}): ${p.description}\n`;
            });
          }
          md += '\n';
        });

        md += `## 关系\n\n`;
        md += `| 源 | 关系 | 目标 | 基数 | 类型 |\n|---|---|---|---|---|\n`;
        relations.forEach(r => {
          const src = concepts.find(c => c.id === r.sourceConceptId)?.name || r.sourceConceptId;
          const tgt = concepts.find(c => c.id === r.targetConceptId)?.name || r.targetConceptId;
          md += `| ${src} | ${r.name} | ${tgt} | ${r.cardinality} | ${r.relationType} |\n`;
        });

        md += `\n## 工作流\n\n`;
        workflows.forEach(w => {
          md += `### ${w.name}\n\n${w.description}\n\n`;
          w.steps.forEach(s => {
            md += `${s.order}. **${s.name}**: ${s.description}\n`;
          });
          md += '\n';
        });

        // Mermaid graph
        md += `## 图谱\n\n\`\`\`mermaid\ngraph TD\n`;
        concepts.forEach(c => {
          md += `  ${c.id.replace(/[^a-zA-Z0-9]/g, '')}["${c.name}"]\n`;
        });
        relations.forEach(r => {
          const srcId = r.sourceConceptId.replace(/[^a-zA-Z0-9]/g, '');
          const tgtId = r.targetConceptId.replace(/[^a-zA-Z0-9]/g, '');
          md += `  ${srcId} -->|${r.name}| ${tgtId}\n`;
        });
        md += `\`\`\`\n`;

        exportText(md, `${projectName}.md`);
        break;
      }
      case 'json-ld': {
        const jsonld = {
          '@context': {
            '@vocab': 'http://schema.org/',
            'ontology': 'http://ontology-miner.dev/ns/',
          },
          '@graph': concepts.map(c => ({
            '@id': `ontology:${c.name.replace(/\s+/g, '_')}`,
            '@type': 'ontology:Concept',
            'name': c.name,
            'description': c.description,
            'ontology:layer': c.ontologyLayer,
            'ontology:properties': c.properties.map(p => ({
              'name': p.name,
              'ontology:dataType': p.dataType,
            })),
          })),
        };
        exportJson(jsonld, `${projectName}.jsonld`);
        break;
      }
      case 'csv': {
        // Concepts CSV
        let csv = 'Name,Description,Layer,Depth,Status,Properties\n';
        concepts.forEach(c => {
          csv += `"${c.name}","${c.description}","${c.ontologyLayer}",${c.depth},"${c.status}","${c.properties.map(p => p.name).join('; ')}"\n`;
        });
        exportText(csv, `${projectName}-concepts.csv`);

        // Relations CSV
        let relCsv = 'Name,Source,Target,Cardinality,Type,Status\n';
        relations.forEach(r => {
          const src = concepts.find(c => c.id === r.sourceConceptId)?.name || '';
          const tgt = concepts.find(c => c.id === r.targetConceptId)?.name || '';
          relCsv += `"${r.name}","${src}","${tgt}","${r.cardinality}","${r.relationType}","${r.status}"\n`;
        });
        exportText(relCsv, `${projectName}-relations.csv`);
        break;
      }
      case 'mermaid': {
        let mermaid = 'graph TD\n';
        concepts.forEach(c => {
          const id = c.id.replace(/[^a-zA-Z0-9]/g, '');
          mermaid += `  ${id}["${c.name}"]\n`;
        });
        relations.forEach(r => {
          const srcId = r.sourceConceptId.replace(/[^a-zA-Z0-9]/g, '');
          const tgtId = r.targetConceptId.replace(/[^a-zA-Z0-9]/g, '');
          mermaid += `  ${srcId} -->|${r.name}| ${tgtId}\n`;
        });
        exportText(mermaid, `${projectName}.mmd`);
        break;
      }
    }

    message.success(`导出成功 (${format.toUpperCase()})`);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <Title level={4}>📦 导出知识库</Title>
      <Text type="secondary">选择导出格式，下载完整的本体知识库</Text>

      <Card style={{ marginTop: 16 }}>
        <Radio.Group
          value={format}
          onChange={e => setFormat(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {FORMAT_OPTIONS.map(opt => (
              <Radio key={opt.value} value={opt.value} style={{ width: '100%' }}>
                <Space>
                  {opt.icon}
                  <Text strong>{opt.label}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{opt.desc}</Text>
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        <div style={{ marginTop: 24 }}>
          <Button type="primary" size="large" icon={<DownloadOutlined />} onClick={handleExport}>
            导出 {format.toUpperCase()}
          </Button>
        </div>
      </Card>
    </div>
  );
}
