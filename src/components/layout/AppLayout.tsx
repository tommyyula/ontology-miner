import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Typography } from 'antd';
import { SettingOutlined, HomeOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/ontology-miner/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          {!isHome && <Button type="text" icon={<HomeOutlined />} size="small" />}
          <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
            🧠 Ontology Miner
          </Title>
        </div>
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => navigate('/settings')}
        >
          设置
        </Button>
      </Header>
      <Content style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
