import { useState } from 'react';
import { Card, Button, Input, Upload, Tag, Space, List, Switch, Empty, Typography, Tooltip, Popconfirm, message } from 'antd';
import { PlusOutlined, LinkOutlined, UploadOutlined, DeleteOutlined, FileTextOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, GlobalOutlined } from '@ant-design/icons';
import { useDataSourceStore } from '../../stores/useDataSourceStore';
import type { SourceType } from '../../types/datasource';

const { Text } = Typography;

const typeIcons: Record<SourceType, React.ReactNode> = {
  url: <GlobalOutlined />,
  pdf: <FilePdfOutlined />,
  excel: <FileExcelOutlined />,
  csv: <FileTextOutlined />,
  markdown: <FileTextOutlined />,
  image: <FileImageOutlined />,
};

const typeLabels: Record<SourceType, string> = {
  url: 'URL',
  pdf: 'PDF',
  excel: 'Excel',
  csv: 'CSV',
  markdown: 'Markdown',
  image: '图片',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function DataSourcePanel({ projectId }: { projectId: string }) {
  const { dataSources, isLoading, addURL, addFile, removeSource, toggleActive } = useDataSourceStore();
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleAddURL = async () => {
    if (!urlInput.trim()) return;
    await addURL(projectId, urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    message.success('URL 数据源已添加');
  };

  const handleUpload = async (file: File) => {
    await addFile(projectId, file);
    message.success(`文件 ${file.name} 已解析`);
    return false;
  };

  return (
    <Card
      title={<span>📎 数据源 <Tag color="blue">{dataSources.length}</Tag></span>}
      size="small"
      extra={
        <Space>
          <Tooltip title="添加 URL">
            <Button size="small" icon={<LinkOutlined />} onClick={() => setShowUrlInput(!showUrlInput)} />
          </Tooltip>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => { handleUpload(file); return false; }}
            accept=".pdf,.xlsx,.xls,.csv,.md,.markdown,.txt,.png,.jpg,.jpeg,.gif,.webp"
          >
            <Tooltip title="上传文件">
              <Button size="small" icon={<UploadOutlined />} />
            </Tooltip>
          </Upload>
        </Space>
      }
    >
      {showUrlInput && (
        <div style={{ marginBottom: 12 }}>
          <Input.Search
            placeholder="输入网页 URL..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onSearch={handleAddURL}
            enterButton={<PlusOutlined />}
            loading={isLoading}
            size="small"
          />
        </div>
      )}

      {dataSources.length === 0 ? (
        <Empty description="暂无数据源" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Space direction="vertical" align="center">
            <Text type="secondary">支持 PDF, Excel, CSV, Markdown, 图片, URL</Text>
            <Space>
              <Button size="small" icon={<LinkOutlined />} onClick={() => setShowUrlInput(true)}>添加 URL</Button>
              <Upload showUploadList={false} beforeUpload={(file) => { handleUpload(file); return false; }} accept=".pdf,.xlsx,.xls,.csv,.md,.txt,.png,.jpg,.jpeg">
                <Button size="small" icon={<UploadOutlined />}>上传文件</Button>
              </Upload>
            </Space>
          </Space>
        </Empty>
      ) : (
        <List
          size="small"
          dataSource={dataSources}
          renderItem={ds => (
            <List.Item
              style={{ padding: '6px 0' }}
              actions={[
                <Switch
                  key="active"
                  size="small"
                  checked={ds.isActive}
                  onChange={() => toggleActive(ds.id)}
                  checkedChildren="启用"
                  unCheckedChildren="停用"
                />,
                <Popconfirm key="delete" title="确定删除？" onConfirm={() => removeSource(ds.id)}>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<span style={{ fontSize: 18 }}>{typeIcons[ds.type]}</span>}
                title={
                  <Tooltip title={ds.content.text.slice(0, 200)}>
                    <Text style={{ fontSize: 13 }} ellipsis>{ds.name}</Text>
                  </Tooltip>
                }
                description={
                  <Space size={4}>
                    <Tag color="default" style={{ fontSize: 11 }}>{typeLabels[ds.type]}</Tag>
                    {ds.origin.fileSize && <Text type="secondary" style={{ fontSize: 11 }}>{formatSize(ds.origin.fileSize)}</Text>}
                    {ds.tags.map(t => <Tag key={t} style={{ fontSize: 10 }}>{t}</Tag>)}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
