import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Tag } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useMiningStore } from '../stores/useMiningStore';
import { MiningPhase, PHASE_LABELS } from '../types/mining';
import { PhaseProgress } from '../components/mining/PhaseProgress';
import { DomainInput } from '../components/mining/DomainInput';
import { CQList } from '../components/mining/CQList';
import { CQConfirmation } from '../components/mining/CQConfirmation';
import { OntologyRefinement } from '../components/mining/OntologyRefinement';
import { WorkflowExtraction } from '../components/mining/WorkflowExtraction';
import { RelationMapping } from '../components/mining/RelationMapping';
import { ReviewPanel } from '../components/mining/ReviewPanel';
import { ExportPanel } from '../components/mining/ExportPanel';

const { Text } = Typography;

function SaveIndicator({ status }: { status: string }) {
  if (status === 'saving') return <Tag icon={<LoadingOutlined />} color="processing">保存中...</Tag>;
  if (status === 'saved') return <Tag icon={<CheckCircleOutlined />} color="success">已保存</Tag>;
  if (status === 'error') return <Tag icon={<ExclamationCircleOutlined />} color="error">保存失败</Tag>;
  return null;
}

function PhaseContent({ phase }: { phase: MiningPhase }) {
  switch (phase) {
    case MiningPhase.DOMAIN_INPUT:
      return <DomainInput />;
    case MiningPhase.CQ_GENERATION:
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}><Text>正在生成 Competency Questions...</Text></div>
        </div>
      );
    case MiningPhase.CQ_SELECTION:
      return <CQList />;
    case MiningPhase.CQ_EXPANSION:
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}><Text>正在展开选中的 CQ...</Text></div>
        </div>
      );
    case MiningPhase.CQ_CONFIRMATION:
      return <CQConfirmation />;
    case MiningPhase.ONTOLOGY_EXTRACTION:
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}><Text>正在提取本体...</Text></div>
        </div>
      );
    case MiningPhase.ONTOLOGY_REFINEMENT:
      return <OntologyRefinement />;
    case MiningPhase.WORKFLOW_EXTRACTION:
      return <WorkflowExtraction />;
    case MiningPhase.RELATION_MAPPING:
      return <RelationMapping />;
    case MiningPhase.REVIEW:
      return <ReviewPanel />;
    case MiningPhase.EXPORT:
      return <ExportPanel />;
    default:
      return <Text>未知阶段</Text>;
  }
}

export function MiningWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, currentPhase, loadProject, goToPhase, saveStatus, reset } = useMiningStore();

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).catch(() => {
        navigate('/');
      });
    }
    return () => {
      reset();
    };
  }, [projectId]);

  if (!currentProject) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Text strong style={{ fontSize: 18 }}>{currentProject.name}</Text>
          <Text type="secondary" style={{ marginLeft: 12, fontSize: 13 }}>
            {PHASE_LABELS[currentPhase]}
          </Text>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Phase progress */}
      <div style={{ marginBottom: 24, background: '#fff', padding: '16px 20px', borderRadius: 8 }}>
        <PhaseProgress currentPhase={currentPhase} onClickPhase={goToPhase} />
      </div>

      {/* Main content */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 400 }}>
        <PhaseContent phase={currentPhase} />
      </div>
    </div>
  );
}
