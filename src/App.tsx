import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppLayout } from './components/layout/AppLayout';
import { ProjectListPage } from './pages/ProjectListPage';
import { MiningWorkspacePage } from './pages/MiningWorkspacePage';
import { SettingsPage } from './pages/SettingsPage';
import { AnnotationPage } from './pages/AnnotationPage';

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <BrowserRouter basename="/ontology-miner">
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<ProjectListPage />} />
            <Route path="project/:projectId" element={<MiningWorkspacePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="annotate/:sessionId" element={<AnnotationPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
