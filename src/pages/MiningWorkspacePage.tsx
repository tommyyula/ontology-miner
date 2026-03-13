import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Tag, Button, Space, Tooltip, Segmented, message } from 'antd';
import {
  CheckCircleOutlined, LoadingOutlined, ExclamationCircleOutlined,
  ThunderboltOutlined, EditOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import { useMiningStore } from '../stores/useMiningStore';
import { useDataSourceStore } from '../stores/useDataSourceStore';
import { useDebateStore } from '../stores/useDebateStore';
import { useAnnotationStore } from '../stores/useAnnotationStore';
import { useSettingsStore } from '../stores/useSettingsStore';
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
import { DataSourcePanel } from '../components/mining/DataSourcePanel';
import { AutoModeProgress } from '../components/mining/AutoModeProgress';
import { DebatePanel } from '../components/debate/DebatePanel';
import { MultiGraphView } from '../components/graph/MultiGraphView';
import { AnnotationWorkspace } from '../components/annotation/AnnotationWorkspace';
import { VotingStats } from '../components/annotation/VotingStats';

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
  const { currentProject, currentPhase, loadProject, goToPhase, saveStatus, reset: resetMining, concepts, relations, workflows } = useMiningStore();
  const { dataSources, loadSources } = useDataSourceStore();
  const { debateHistory, loadHistory } = useDebateStore();
  const { questions, generateQuestions, loadAnnotations, calculateConsensus } = useAnnotationStore();
  const settings = useSettingsStore();
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [autoMessage, setAutoMessage] = useState('');
  const [autoStepIndex, setAutoStepIndex] = useState(0);
  const [showDebate, setShowDebate] = useState(true);
  const [activeTab, setActiveTab] = useState<'mining' | 'annotate' | 'stats'>('mining');

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).catch(() => navigate('/'));
      loadSources(projectId);
      loadHistory(projectId);
      loadAnnotations(projectId);
      // 加载专家画像并自动设置当前专家
      useAnnotationStore.getState().loadExperts().then(() => {
        const { experts, currentExpert, setCurrentExpert } = useAnnotationStore.getState();
        if (!currentExpert && experts.length > 0) {
          setCurrentExpert(experts[0]);
        }
      });
    }
    return () => { resetMining(); };
  }, [projectId]);

  const handleAutoMode = async () => {
    if (!currentProject) return;
    setAutoRunning(true);
    const autoSteps = [
      { name: 'CQ 生成', fn: async () => {
        await useMiningStore.getState().generateCQs();
        // 自动模式：自动选择所有 high/medium 重要性的 CQ
        const store = useMiningStore.getState();
        const autoSelectedIds = store.competencyQuestions
          .filter(cq => cq.importance === 'high' || cq.importance === 'medium')
          .map(cq => cq.id);
        // 如果没有 high/medium，选择全部
        const idsToSelect = autoSelectedIds.length > 0 ? autoSelectedIds : store.competencyQuestions.map(cq => cq.id);
        store.selectCQs(idsToSelect);
      }},
      { name: 'CQ 展开', fn: async () => {
        await useMiningStore.getState().expandCQs();
        // 自动模式：自动确认所有展开内容
        const store = useMiningStore.getState();
        store.expandedCQs.forEach(eq => {
          store.confirmExpansion(eq.cqId, true);
        });
      }},
      { name: '本体提取', fn: async () => { await useMiningStore.getState().extractOntology(); } },
      { name: '深入推演', fn: async () => {
        // 自动对顶层概念做一轮 drill down
        const store = useMiningStore.getState();
        const topConcepts = store.concepts.filter(c => !c.parentId && !c.isExpanded);
        for (const concept of topConcepts.slice(0, 5)) { // 限制前5个避免太慢
          try { await store.drillDown(concept.id); } catch { /* continue */ }
        }
      }},
      { name: '工作流提取', fn: async () => { await useMiningStore.getState().extractWorkflows(); } },
      { name: '关系推演', fn: async () => { await useMiningStore.getState().inferRelations(); } },
    ];

    for (let i = 0; i < autoSteps.length; i++) {
      setAutoStepIndex(i);
      setAutoMessage(`正在执行：${autoSteps[i].name}...`);
      setAutoProgress((i / autoSteps.length));
      try {
        await autoSteps[i].fn();
        setAutoMessage(`✅ ${autoSteps[i].name} 完成`);
      } catch (e) {
        setAutoMessage(`❌ ${autoSteps[i].name} 失败: ${(e as Error).message}`);
        break;
      }
    }
    setAutoProgress(1);
    setAutoRunning(false);
    setAutoMessage('自动挖掘完成！');
    message.success('自动模式完成');
  };

  const handleGenerateAnnotation = async () => {
    if (!currentProject) return;
    await generateQuestions(currentProject.id, concepts, relations, workflows, settings.maxQuestions);
    calculateConsensus(settings.consensusThreshold);
    message.success(`已生成 ${useAnnotationStore.getState().questions.length} 个验证问题`);
  };

  if (!currentProject) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text strong style={{ fontSize: 18 }}>{currentProject.name}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{PHASE_LABELS[currentPhase]}</Text>
        </div>
        <Space>
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => setMode(v as 'auto' | 'manual')}
            options={[
              { label: <span><EditOutlined /> 手动</span>, value: 'manual' },
              { label: <span><ThunderboltOutlined /> 自动</span>, value: 'auto' },
            ]}
          />
          {mode === 'auto' && !autoRunning && autoProgress < 1 && (
            <Button type="primary" size="small" icon={<ThunderboltOutlined />} onClick={handleAutoMode}>
              开始自动挖掘
            </Button>
          )}
          <Tooltip title="生成标注验证问题">
            <Button size="small" onClick={handleGenerateAnnotation} disabled={concepts.length === 0}>
              生成验证
            </Button>
          </Tooltip>
          <Tooltip title={showDebate ? '隐藏辩论面板' : '显示辩论面板'}>
            <Button size="small" icon={<ExperimentOutlined />} type={showDebate ? 'primary' : 'default'} ghost={showDebate} onClick={() => setShowDebate(!showDebate)} />
          </Tooltip>
          <SaveIndicator status={saveStatus} />
        </Space>
      </div>

      {/* Auto mode progress */}
      {(autoRunning || autoProgress > 0) && (
        <AutoModeProgress
          isRunning={autoRunning}
          isPaused={false}
          currentStep=""
          currentPhase={currentPhase}
          stepIndex={autoStepIndex}
          totalSteps={5}
          overallProgress={autoProgress}
          message={autoMessage}
          conceptsExtracted={concepts.length}
          relationsFound={relations.length}
          onPause={() => {}}
          onResume={() => {}}
          onCancel={() => setAutoRunning(false)}
        />
      )}

      {/* Phase progress */}
      <div style={{ marginBottom: 12, background: '#fff', padding: '12px 16px', borderRadius: 8 }}>
        <PhaseProgress currentPhase={currentPhase} onClickPhase={goToPhase} />
      </div>

      {/* Tab: Mining / Annotate / Stats */}
      <div style={{ marginBottom: 12 }}>
        <Segmented
          value={activeTab}
          onChange={(v) => setActiveTab(v as typeof activeTab)}
          options={[
            { label: `⛏ 挖掘`, value: 'mining' },
            { label: `📝 标注验证 (${questions.length})`, value: 'annotate' },
            { label: `📊 投票统计`, value: 'stats' },
          ]}
        />
      </div>

      {activeTab === 'mining' && (
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Left sidebar: Data sources */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <DataSourcePanel projectId={currentProject.id} />
            <div style={{ marginTop: 12 }}>
              <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, fontSize: 12 }}>
                <Text strong style={{ fontSize: 13 }}>📊 统计</Text>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <Tag>{concepts.length} 概念</Tag>
                  <Tag>{relations.length} 关系</Tag>
                  <Tag>{workflows.length} 工作流</Tag>
                  <Tag>{dataSources.length} 数据源</Tag>
                  <Tag>{debateHistory.length} 辩论</Tag>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, minHeight: 300 }}>
              <PhaseContent phase={currentPhase} />
            </div>
          </div>

          {/* Right sidebar: Debate panel */}
          {showDebate && (
            <div style={{ width: 340, flexShrink: 0 }}>
              <DebatePanel />
            </div>
          )}
        </div>
      )}

      {activeTab === 'annotate' && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
          <AnnotationWorkspace />
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
          <VotingStats />
        </div>
      )}

      {/* Graph view (always visible in mining tab) */}
      {activeTab === 'mining' && concepts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <MultiGraphView
            concepts={concepts}
            relations={relations}
            workflows={workflows}
            dataSources={dataSources}
            debateRecords={debateHistory}
          />
        </div>
      )}
    </div>
  );
}
