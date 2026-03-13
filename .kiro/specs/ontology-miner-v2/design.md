# Ontology Miner v2 — 系统设计

## 1. 系统架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (SPA)                                │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────┐ │
│  │  UI Layer     │  │  State Mgmt  │  │  Persistence  │  │ Sharing │ │
│  │  (React)      │  │  (Zustand)   │  │  (Dexie.js)   │  │ Layer   │ │
│  │              │  │              │  │              │  │(optional)│ │
│  │  Pages       │  │  Project     │  │  IndexedDB   │  │Firebase/ │ │
│  │  Components  │  │  Ontology    │  │  Import/     │  │Cloudflare│ │
│  │  Layouts     │  │  Mining FSM  │  │  Export      │  │ KV       │ │
│  │  Graphs (6x) │  │  Debate      │  │  Files       │  └─────────┘ │
│  │  Annotation  │  │  Annotation  │  │  DataSources │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                  │                        │
│  ┌──────┴─────────────────┴──────────────────┴───────────────────┐   │
│  │                    Service Layer                                │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │   │
│  │  │ LLM Service│ │ Mining     │ │ Debate     │ │ Annotation │ │   │
│  │  │ (Provider) │ │ Engine     │ │ Engine     │ │ Engine     │ │   │
│  │  ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤ │   │
│  │  │ DataSource │ │ Export     │ │ Validation │ │ Consensus  │ │   │
│  │  │ Service    │ │ Service    │ │ Generator  │ │ Calculator │ │   │
│  │  └─────┬──────┘ └────────────┘ └────────────┘ └────────────┘ │   │
│  └────────┼──────────────────────────────────────────────────────┘   │
│           │                                                          │
│  ┌────────┴──────────────────────────────────────────────────────┐   │
│  │                  LLM Provider Layer                            │   │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐               │   │
│  │  │ OpenAI   │  │ Anthropic │  │ Mock         │               │   │
│  │  │ Provider │  │ Provider  │  │ Provider     │               │   │
│  │  │ +Vision  │  │ +Vision   │  │              │               │   │
│  │  └────┬─────┘  └─────┬─────┘  └──────────────┘               │   │
│  └───────┼──────────────┼────────────────────────────────────────┘   │
│          │              │                                            │
│  ┌───────┴──────────────┴────────────────────────────────────────┐   │
│  │               Data Input Layer (v2 new)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │   │
│  │  │ URL      │ │ PDF      │ │ Excel/   │ │ Image Analyzer  │ │   │
│  │  │ Fetcher  │ │ Parser   │ │ CSV      │ │ (LLM Vision)    │ │   │
│  │  │(CORS     │ │(pdfjs-   │ │ Parser   │ │                 │ │   │
│  │  │ proxy)   │ │ dist)    │ │(xlsx,    │ │                 │ │   │
│  │  │+Readable │ │          │ │papaparse)│ │                 │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 架构决策（v2 新增）

| 决策 | 选择 | 理由 |
|---|---|---|
| PDF 解析 | pdfjs-dist (4.x) | Mozilla 官方，Web Worker 支持，纯浏览器运行 |
| Excel 解析 | xlsx (SheetJS CE) | 社区版免费，.xlsx/.xls 都支持 |
| CSV 解析 | papaparse | 轻量，自动检测分隔符/编码 |
| URL 正文提取 | @mozilla/readability | 从 HTML 提取正文，与 Firefox Reader View 同源 |
| CORS Proxy | allorigins.win (默认) + 自定义 | 零后端，公共服务 |
| 树状图 | D3.js (d3-hierarchy) | 专业的层级布局算法 |
| 矩阵/热力图 | D3.js | 灵活的 SVG 渲染 |
| 统计图表 | Recharts | React 声明式 API，简单好用 |
| 图片导出 | html2canvas (PNG) + SVG serialize | 成熟方案 |
| 辩论状态机 | XState v5 | 复杂异步状态机管理，可视化调试 |
| 实时协作 | Firebase Realtime DB (可选) | 低成本，实时同步，前端 SDK |

---

## 2. 项目目录结构（v2 增量）

```
ontology-miner/
├── src/
│   ├── types/
│   │   ├── ...                            # v1 types
│   │   ├── datasource.ts                  # DataSource, SourceType, ParsedContent
│   │   ├── debate.ts                      # DebateConfig, DebateRound, DebateRecord
│   │   ├── annotation.ts                  # ValidationQuestion, ExpertProfile, AnnotationResult
│   │   └── visualization.ts              # GraphType, ChartConfig, VisualizationState
│   │
│   ├── stores/
│   │   ├── ...                            # v1 stores
│   │   ├── useDataSourceStore.ts          # 数据源管理
│   │   ├── useDebateStore.ts              # 辩论状态
│   │   ├── useAnnotationStore.ts          # 标注验证状态
│   │   └── useVisualizationStore.ts       # 可视化设置
│   │
│   ├── services/
│   │   ├── llm/
│   │   │   ├── ...                        # v1 providers
│   │   │   └── VisionMixin.ts             # Vision 能力 mixin
│   │   │
│   │   ├── mining/
│   │   │   ├── ...                        # v1 mining
│   │   │   ├── AutoModeEngine.ts          # 自动模式引擎
│   │   │   └── prompts-v2.ts              # v2 增强的 prompts
│   │   │
│   │   ├── datasource/                    # 数据源（v2 new）
│   │   │   ├── DataSourceService.ts       # 数据源管理协调
│   │   │   ├── URLFetcher.ts              # URL 抓取 + Readability
│   │   │   ├── PDFParser.ts               # PDF 解析（pdfjs-dist）
│   │   │   ├── ExcelParser.ts             # Excel 解析（xlsx）
│   │   │   ├── CSVParser.ts               # CSV 解析（papaparse）
│   │   │   ├── MarkdownParser.ts          # Markdown 解析
│   │   │   └── ImageAnalyzer.ts           # 图片分析（LLM Vision）
│   │   │
│   │   ├── debate/                        # 辩论引擎（v2 new）
│   │   │   ├── DebateEngine.ts            # 辩论调度状态机
│   │   │   ├── DebatePrompts.ts           # 各角色的 Prompt 模板
│   │   │   ├── DebateRecorder.ts          # 辩论记录管理
│   │   │   └── ConflictResolver.ts        # 冲突解决策略
│   │   │
│   │   ├── annotation/                    # 标注系统（v2 new）
│   │   │   ├── ValidationGenerator.ts     # 验证问题生成器
│   │   │   ├── AnnotationService.ts       # 标注流程管理
│   │   │   ├── ConsensusCalculator.ts     # 共识度计算
│   │   │   ├── ExpertMatcher.ts           # 专家-问题匹配
│   │   │   ├── FeedbackLoop.ts            # 反馈循环（标注→本体更新）
│   │   │   └── ReportGenerator.ts         # 标注报告生成
│   │   │
│   │   ├── sharing/                       # 分享（v2 new）
│   │   │   ├── ShareService.ts            # 分享协调（方案 A/B）
│   │   │   ├── FileShareAdapter.ts        # 方案 A：JSON 文件导入/导出
│   │   │   └── FirebaseShareAdapter.ts    # 方案 B：Firebase 实时同步
│   │   │
│   │   ├── persistence/
│   │   │   ├── ...                        # v1 persistence
│   │   │   └── db-v2.ts                   # v2 schema migration
│   │   │
│   │   └── export/
│   │       ├── ...                        # v1 exporters
│   │       ├── PNGExporter.ts             # 图片导出
│   │       └── SVGExporter.ts             # SVG 导出
│   │
│   ├── pages/
│   │   ├── ...                            # v1 pages
│   │   └── AnnotationPage.tsx             # 标注验证页面（可通过分享链接独立访问）
│   │
│   ├── components/
│   │   ├── mining/
│   │   │   ├── ...                        # v1 mining components
│   │   │   ├── AutoModeProgress.tsx       # 自动模式进度面板
│   │   │   ├── DataSourcePanel.tsx        # 数据源管理面板
│   │   │   ├── DataSourceUpload.tsx       # 文件上传/URL 输入
│   │   │   ├── DataSourcePreview.tsx      # 数据源内容预览
│   │   │   └── ModeToggle.tsx             # Auto/Manual 切换
│   │   │
│   │   ├── graph/
│   │   │   ├── ...                        # v1 graph components
│   │   │   ├── GraphTypeSelector.tsx      # 图类型切换 Tab
│   │   │   ├── PropertyGraphNode.tsx      # 属性图节点
│   │   │   ├── HierarchyTreeView.tsx      # 层级树状图
│   │   │   ├── RelationMatrix.tsx         # 关系矩阵热力图
│   │   │   ├── WorkflowDiagram.tsx        # 时序流程图
│   │   │   ├── StatsDashboard.tsx         # 统计仪表盘
│   │   │   ├── GraphExporter.tsx          # 图片/SVG 导出
│   │   │   └── GraphSettings.tsx          # 图谱设置面板
│   │   │
│   │   ├── debate/                        # 辩论组件（v2 new）
│   │   │   ├── DebatePanel.tsx            # 辩论面板（聊天记录风格）
│   │   │   ├── DebateMessage.tsx          # 单条辩论消息
│   │   │   ├── DebateProgress.tsx         # 辩论进度指示
│   │   │   ├── DebateConfig.tsx           # 辩论配置面板
│   │   │   └── ConsensusIndicator.tsx     # 共识/辩论标记
│   │   │
│   │   ├── annotation/                    # 标注组件（v2 new）
│   │   │   ├── AnnotationWorkspace.tsx    # 标注工作区
│   │   │   ├── QuestionCard.tsx           # 单个问题卡片
│   │   │   ├── BooleanQuestion.tsx        # 判断题组件
│   │   │   ├── MultipleChoiceQuestion.tsx # 选择题组件
│   │   │   ├── RankingQuestion.tsx        # 排序题组件
│   │   │   ├── OpenEndedQuestion.tsx      # 补充题组件
│   │   │   ├── VotingStats.tsx            # 投票统计面板
│   │   │   ├── ConsensusReport.tsx        # 共识度报告
│   │   │   ├── ExpertProfileEditor.tsx    # 专家画像编辑
│   │   │   ├── ExpertMatcher.tsx          # 专家匹配展示
│   │   │   └── ShareLinkDialog.tsx        # 生成分享链接
│   │   │
│   │   └── common/
│   │       ├── ...                        # v1 common
│   │       ├── FileUpload.tsx             # 文件上传组件
│   │       ├── URLInput.tsx               # URL 输入组件
│   │       └── ProgressTracker.tsx         # 通用进度跟踪
│   │
│   ├── hooks/
│   │   ├── ...                            # v1 hooks
│   │   ├── useDebate.ts                   # 辩论 hook
│   │   ├── useAnnotation.ts              # 标注 hook
│   │   ├── useDataSource.ts              # 数据源 hook
│   │   ├── useAutoMode.ts                # 自动模式 hook
│   │   └── useGraphExport.ts             # 图片导出 hook
│   │
│   └── lib/
│       ├── ...                            # v1 libs
│       ├── consensus.ts                   # 共识度算法（Fleiss' Kappa 等）
│       ├── cors-proxy.ts                  # CORS proxy 工具
│       └── file-parsers.ts               # 文件解析工具
```

---

## 3. 数据模型（v2 增量）

### 3.1 Dexie Schema 扩展

```typescript
// src/services/persistence/db-v2.ts

class OntologyMinerDB extends Dexie {
  // v1 tables
  projects!: Table<MiningProject>;
  steps!: Table<StepSnapshot>;
  concepts!: Table<OntologyConcept>;
  relations!: Table<OntologyRelation>;
  workflows!: Table<Workflow>;
  
  // v2 new tables
  dataSources!: Table<DataSource>;
  debateRecords!: Table<DebateRecord>;
  validationQuestions!: Table<ValidationQuestion>;
  annotationResults!: Table<AnnotationResult>;
  expertProfiles!: Table<ExpertProfile>;

  constructor() {
    super('OntologyMinerDB');
    
    // v1 schema (保持不变)
    this.version(1).stores({
      projects: 'id, name, updatedAt, currentPhase',
      steps: 'id, projectId, phase, parentStepId, createdAt, isActive, [projectId+phase], [projectId+isActive]',
      concepts: 'id, projectId, parentId, depth, ontologyLayer, status, [projectId+depth], [projectId+ontologyLayer]',
      relations: 'id, projectId, sourceConceptId, targetConceptId, status, [projectId+status]',
      workflows: 'id, projectId, status',
    });
    
    // v2 migration
    this.version(2).stores({
      // existing tables unchanged
      projects: 'id, name, updatedAt, currentPhase',
      steps: 'id, projectId, phase, parentStepId, createdAt, isActive, [projectId+phase], [projectId+isActive]',
      concepts: 'id, projectId, parentId, depth, ontologyLayer, status, [projectId+depth], [projectId+ontologyLayer]',
      relations: 'id, projectId, sourceConceptId, targetConceptId, status, confidence, [projectId+status]',
      workflows: 'id, projectId, status',
      
      // v2 new tables
      dataSources: 'id, projectId, type, name, createdAt, [projectId+type]',
      debateRecords: 'id, projectId, stepId, phase, createdAt, [projectId+phase]',
      validationQuestions: 'id, projectId, questionType, difficulty, domain, [projectId+questionType]',
      annotationResults: 'id, questionId, expertId, projectId, createdAt, [projectId+expertId], [questionId+expertId]',
      expertProfiles: 'id, email, *domains',
    });
  }
}
```

### 3.2 v2 新增类型定义

```typescript
// src/types/datasource.ts

type SourceType = 'url' | 'pdf' | 'excel' | 'csv' | 'markdown' | 'image';

interface DataSource {
  id: string;
  projectId: string;
  name: string;
  type: SourceType;
  
  // 来源信息
  origin: {
    url?: string;              // URL 数据源
    fileName?: string;         // 上传文件名
    fileSize?: number;         // 文件大小 (bytes)
    mimeType?: string;
  };
  
  // 解析后的内容
  content: {
    text: string;              // 主要文本内容
    structured?: {             // 结构化数据（Excel/CSV）
      headers: string[];
      rows: string[][];
      sheetName?: string;
    }[];
    images?: {                 // 提取的图片
      base64: string;
      mediaType: string;
      description?: string;    // LLM Vision 分析结果
    }[];
    metadata?: Record<string, string>;  // 文档元数据
  };
  
  // 管理
  tags: string[];
  isActive: boolean;           // 是否在挖掘中使用
  createdAt: number;
  updatedAt: number;
}
```

```typescript
// src/types/debate.ts

interface DebateConfig {
  enabled: boolean;
  rounds: number;                        // 1-5, default 3
  proposer: AgentRoleConfig;
  challenger: AgentRoleConfig;
  judge: AgentRoleConfig;
  enabledSteps: {
    ontologyExtraction: boolean;         // default true
    drillDown: boolean;                  // default true
    relationInference: boolean;          // default true
    cqGeneration: boolean;              // default false
    workflowExtraction: boolean;        // default false
  };
  presets: 'quick' | 'standard' | 'deep' | 'custom';
}

interface AgentRoleConfig {
  provider: 'openai' | 'anthropic' | 'mock';
  model: string;
  apiKey?: string;
  temperature: number;
  systemPromptOverride?: string;
}

interface DebateRecord {
  id: string;
  projectId: string;
  stepId: string;
  phase: string;                         // 哪个挖掘步骤
  config: DebateConfig;
  
  rounds: DebateRound[];
  
  finalResult: any;                      // 最终裁决结果
  summary: {
    totalRounds: number;
    consensusItems: number;              // 所有 Agent 一致的条目数
    debatedItems: number;                // 经过辩论修改的条目数
    unresolvedItems: number;             // 仍有争议的条目数
    totalTokens: number;
    totalDurationMs: number;
  };
  
  createdAt: number;
}

interface DebateRound {
  roundNumber: number;
  role: 'proposer' | 'challenger' | 'judge';
  agentName: string;                     // 角色名
  modelUsed: string;                     // 实际使用的模型
  
  input: string;                         // 输入 (prompt + context)
  output: string;                        // 原始输出
  parsedOutput: any;                     // 解析后的结构化输出
  
  // Challenger 特有
  challenges?: DebateChallenge[];
  agreements?: string[];
  additions?: string[];
  
  // Proposer 回应特有
  responses?: DebateChallengeResponse[];
  
  // Judge 特有
  verdicts?: DebateVerdict[];
  
  tokenUsage: { prompt: number; completion: number; total: number };
  durationMs: number;
  timestamp: number;
}

interface DebateChallenge {
  target: string;                        // 被质疑的概念/关系
  issue: string;                         // 问题描述
  severity: 'critical' | 'major' | 'minor';
  suggestion: string;                    // 建议修改
  evidence: string;                      // 支撑论据
}

interface DebateChallengeResponse {
  challengeTarget: string;
  decision: 'accept' | 'reject' | 'modify';
  reasoning: string;
  modification?: string;                 // 如果 modify，具体修改
}

interface DebateVerdict {
  item: string;                          // 涉及的概念/关系
  consensusType: 'unanimous' | 'debated' | 'unresolved';
  finalDecision: string;
  reasoning: string;
  confidence: number;                    // 0-1
}
```

```typescript
// src/types/annotation.ts

type QuestionType = 'boolean' | 'multiple_choice' | 'ranking' | 'open_ended';
type Difficulty = 'easy' | 'medium' | 'hard';
type ExpertLevel = 'junior' | 'mid' | 'senior' | 'principal';

interface ValidationQuestion {
  id: string;
  projectId: string;
  questionType: QuestionType;
  
  // 问题内容
  text: string;                          // 问题文本
  context?: string;                      // 补充上下文
  
  // 问题选项
  options?: {                            // multiple_choice
    id: string;
    text: string;
  }[];
  rankingItems?: {                       // ranking
    id: string;
    text: string;
  }[];
  
  // 元信息
  difficulty: Difficulty;
  domains: string[];                     // 涉及的领域标签
  relatedConceptIds: string[];           // 关联的概念 ID
  relatedRelationIds: string[];          // 关联的关系 ID
  relatedWorkflowIds: string[];         // 关联的工作流 ID
  
  // 生成来源
  generatedFrom: 'relation' | 'concept' | 'workflow' | 'hierarchy';
  
  createdAt: number;
}

interface AnnotationResult {
  id: string;
  questionId: string;
  projectId: string;
  expertId: string;
  
  // 回答
  answer: {
    booleanValue?: boolean | null;       // boolean: true/false/null(不确定)
    selectedOptionId?: string;           // multiple_choice
    rankedItemIds?: string[];            // ranking: 排序后的 ID
    openEndedText?: string;              // open_ended
  };
  
  notes?: string;                        // 备注
  skipped: boolean;
  durationMs: number;                    // 回答耗时
  
  createdAt: number;
}

interface ExpertProfile {
  id: string;
  name: string;
  email: string;
  
  domains: string[];                     // 领域专长
  experienceYears: number;
  level: ExpertLevel;
  
  // 权重计算
  credibilityWeight: number;             // 计算后的可信度权重
  
  // 统计
  totalAnnotations: number;
  averageResponseTime: number;
  
  createdAt: number;
  updatedAt: number;
}

interface ConsensusResult {
  questionId: string;
  totalResponses: number;
  
  // 统计
  simpleAgreement: number;               // 0-1, 简单一致率
  weightedAgreement: number;             // 0-1, 加权一致率
  fleissKappa: number;                   // -1 to 1
  
  // 共识判定
  isConsensus: boolean;                  // weightedAgreement >= threshold
  isDisputed: boolean;                   // weightedAgreement < threshold
  consensusThreshold: number;            // 默认 0.7
  
  // 最终答案
  consensusAnswer: any;                  // 共识答案
  distribution: Record<string, number>;  // 答案分布
  
  // 可选：高级专家裁决
  escalated: boolean;
  escalationReason?: string;
}

interface AnnotationReport {
  projectId: string;
  generatedAt: number;
  
  overview: {
    totalQuestions: number;
    totalExperts: number;
    completionRate: number;              // 完成率
    averageConsensus: number;            // 平均共识度
    disputedCount: number;               // 争议问题数
  };
  
  byQuestionType: Record<QuestionType, {
    count: number;
    avgConsensus: number;
    disputedCount: number;
  }>;
  
  byDifficulty: Record<Difficulty, {
    count: number;
    avgConsensus: number;
  }>;
  
  modifications: {
    conceptsModified: number;
    relationsModified: number;
    relationsRemoved: number;
    workflowsModified: number;
  };
  
  expertStats: {
    expertId: string;
    name: string;
    questionsAnswered: number;
    avgResponseTime: number;
    agreementWithConsensus: number;       // 与共识答案的一致率
  }[];
}
```

```typescript
// src/types/visualization.ts

type GraphType = 'knowledge_graph' | 'property_graph' | 'hierarchy_tree' | 'relation_matrix' | 'workflow_diagram' | 'stats_dashboard';

interface VisualizationState {
  activeGraphType: GraphType;
  
  // 知识图谱设置
  knowledgeGraph: {
    layout: 'force' | 'dagre' | 'radial';
    nodeSize: 'fixed' | 'degree_scaled';
    edgeThickness: 'fixed' | 'confidence_scaled';
    showLabels: boolean;
    showEdgeLabels: boolean;
    colorBy: 'layer' | 'depth' | 'status';
    filterByLayer: string[];             // 过滤显示的 layer
    searchQuery: string;
  };
  
  // 属性图设置
  propertyGraph: {
    showAllProperties: boolean;
    groupByLayer: boolean;
  };
  
  // 树状图设置
  hierarchyTree: {
    direction: 'left-right' | 'top-bottom';
    expandedNodes: Set<string>;
    relationTypes: string[];             // 只显示这些关系类型的层级
  };
  
  // 关系矩阵设置
  relationMatrix: {
    sortBy: 'name' | 'degree' | 'cluster';
    strengthMetric: 'direct' | 'indirect' | 'combined';
    minStrength: number;                 // 过滤阈值
  };
  
  // 选中状态（跨图联动）
  selectedConceptId: string | null;
  selectedRelationId: string | null;
  highlightedConceptIds: Set<string>;
}
```

### 3.3 v1 类型扩展

```typescript
// 扩展 OntologyConcept（v2 增强）
interface OntologyConcept {
  // v1 字段保留...
  
  // v2 新增
  confidence: number;                    // 0-1, 提取置信度
  source: 'extracted' | 'debated' | 'manual' | 'annotated';
  importanceScore?: number;              // 标注验证后的重要性
  dataSourceRefs: string[];              // 关联的数据源 ID
  debateRecordId?: string;              // 关联的辩论记录
  annotationStatus?: 'pending' | 'validated' | 'disputed' | 'rejected';
}

// 扩展 OntologyRelation（v2 增强）
interface OntologyRelation {
  // v1 字段保留...
  
  // v2 新增
  confidence: number;                    // 0-1
  inferenceType: 'direct' | 'indirect' | 'inherited' | 'composed';
  inferenceChain?: string[];             // 间接推演的中间概念链
  source: 'extracted' | 'debated' | 'manual' | 'inferred' | 'annotated';
  evidence?: string;                     // 推理依据
  debateRecordId?: string;
  annotationStatus?: 'pending' | 'validated' | 'disputed' | 'rejected';
}

// 扩展 MiningProject（v2 增强）
interface MiningProject {
  // v1 字段保留...
  
  // v2 新增
  mode: 'auto' | 'manual';
  debateConfig: DebateConfig;
  dataSourceIds: string[];
  annotationSessionId?: string;
  
  // 统计快照
  stats: {
    conceptCount: number;
    relationCount: number;
    workflowCount: number;
    maxDepth: number;
    dataSourceCount: number;
    debateCount: number;
    annotationProgress: number;          // 0-1
  };
}
```

---

## 4. 路由设计（v2 增量）

```typescript
const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ProjectListPage /> },
      { path: 'project/:projectId', element: <MiningWorkspacePage /> },
      { path: 'settings', element: <SettingsPage /> },
      // v2 新增
      { path: 'annotate/:sessionId', element: <AnnotationPage /> },  // 外部专家通过分享链接访问
    ],
  },
];
```

---

## 5. 核心服务设计

### 5.1 数据源服务

```typescript
// src/services/datasource/DataSourceService.ts

class DataSourceService {
  /**
   * 从 URL 抓取内容
   * @param urls 一个或多个 URL
   * @param proxyUrl CORS proxy URL（默认 allorigins.win）
   * @returns 解析后的数据源列表
   */
  async fetchURLs(urls: string[], proxyUrl?: string): Promise<DataSource[]> {
    // 1. 通过 CORS proxy 抓取 HTML
    // 2. 用 Readability.js 提取正文
    // 3. 创建 DataSource 对象
    // 4. 保存到 IndexedDB
  }
  
  /**
   * 解析上传的文件
   */
  async parseFile(file: File): Promise<DataSource> {
    const type = this.detectFileType(file);
    switch (type) {
      case 'pdf':     return this.parsePDF(file);
      case 'excel':   return this.parseExcel(file);
      case 'csv':     return this.parseCSV(file);
      case 'markdown': return this.parseMarkdown(file);
      case 'image':   return this.analyzeImage(file);
      default:        throw new Error(`Unsupported file type: ${file.type}`);
    }
  }
  
  /**
   * 将所有活跃数据源内容组装为 LLM 上下文
   */
  buildContextFromSources(sources: DataSource[]): string {
    return sources
      .filter(s => s.isActive)
      .map(s => `\n--- Data Source: ${s.name} (${s.type}) ---\n${s.content.text}\n`)
      .join('\n');
  }
  
  private async parsePDF(file: File): Promise<DataSource> {
    // 使用 pdfjs-dist
    // const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    // 逐页提取文本
    // 合并为完整文本
  }
  
  private async parseExcel(file: File): Promise<DataSource> {
    // 使用 xlsx (SheetJS)
    // const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    // 逐 sheet 解析
    // 识别表头
    // 构建结构化数据
  }
  
  private async parseCSV(file: File): Promise<DataSource> {
    // 使用 papaparse
    // Papa.parse(file, { header: true, dynamicTyping: true })
  }
  
  private async parseMarkdown(file: File): Promise<DataSource> {
    // 直接读取文本
    // 用 marked 解析为 AST 提取结构
  }
  
  private async analyzeImage(file: File): Promise<DataSource> {
    // 1. 转 base64
    // 2. 调用 LLM Vision API
    // 3. 将描述作为文本内容
  }
}
```

### 5.2 辩论引擎

```typescript
// src/services/debate/DebateEngine.ts

import { createMachine, interpret } from 'xstate';

/**
 * 辩论状态机
 */
const debateMachine = createMachine({
  id: 'debate',
  initial: 'idle',
  context: {
    config: null as DebateConfig | null,
    rounds: [] as DebateRound[],
    currentRound: 0,
    initialResult: null,
    lastChallenges: null,
    lastResponse: null,
  },
  states: {
    idle: {
      on: { START: 'proposing' },
    },
    proposing: {
      invoke: {
        src: 'executeProposer',
        onDone: {
          target: 'challenging',
          actions: 'saveProposerResult',
        },
        onError: 'error',
      },
    },
    challenging: {
      invoke: {
        src: 'executeChallenger',
        onDone: [
          {
            target: 'defending',
            cond: 'hasMoreRounds',
            actions: 'saveChallengerResult',
          },
          {
            target: 'judging',
            actions: 'saveChallengerResult',
          },
        ],
        onError: 'error',
      },
    },
    defending: {
      invoke: {
        src: 'executeDefender',
        onDone: {
          target: 'challenging',
          actions: ['saveDefenderResult', 'incrementRound'],
        },
        onError: 'error',
      },
    },
    judging: {
      invoke: {
        src: 'executeJudge',
        onDone: {
          target: 'complete',
          actions: 'saveJudgeResult',
        },
        onError: 'error',
      },
    },
    complete: {
      type: 'final',
      data: (ctx) => ({
        finalResult: ctx.rounds[ctx.rounds.length - 1].parsedOutput,
        record: ctx,
      }),
    },
    error: {
      on: {
        RETRY: 'proposing',
        SKIP: 'complete',
      },
    },
  },
});

class DebateEngine {
  private service: any;
  private llmProviders: Map<string, LLMProvider>;
  
  /**
   * 执行一次完整辩论
   * @param step 当前挖掘步骤
   * @param context 领域上下文 + 数据源内容
   * @param config 辩论配置
   * @param onProgress 进度回调（流式展示）
   */
  async runDebate(
    step: string,
    context: string,
    config: DebateConfig,
    onProgress: (event: DebateProgressEvent) => void
  ): Promise<DebateRecord> {
    // 1. 初始化状态机
    // 2. 逐步执行 Proposer → Challenger → Defender → ... → Judge
    // 3. 每步通过 onProgress 回调通知 UI
    // 4. 保存完整记录到 IndexedDB
    // 5. 返回最终结果
  }
}

interface DebateProgressEvent {
  type: 'round_start' | 'streaming' | 'round_complete' | 'debate_complete';
  role: 'proposer' | 'challenger' | 'judge';
  round: number;
  totalRounds: number;
  delta?: string;          // streaming 内容
  result?: DebateRound;    // round_complete 时
}
```

### 5.3 辩论 Prompt 设计

```typescript
// src/services/debate/DebatePrompts.ts

/**
 * Challenger (审查者) 的 System Prompt
 */
const CHALLENGER_SYSTEM = `You are a critical ontology reviewer. Your role is to rigorously examine ontology extraction results and identify issues.

Your review should cover:
1. **Missing Concepts**: Are there important domain concepts not captured?
2. **Incorrect Relationships**: Are any relationships inaccurate or misleading?
3. **Incomplete Properties**: Do concepts lack essential properties?
4. **Layer Misassignment**: Are concepts assigned to the wrong ontology layer?
5. **Naming Issues**: Are there inconsistent names, duplicates, or unclear terms?
6. **Structural Problems**: Are there orphan concepts, circular hierarchies, or redundant paths?

For each issue found, you MUST provide:
- The specific item being challenged
- A clear description of the issue
- A severity rating (critical/major/minor)
- A concrete suggestion for improvement
- Evidence or reasoning supporting your challenge

Be thorough but fair. Acknowledge what was done well before presenting challenges.`;

const CHALLENGER_USER = (proposerResult: string, context: string) => `
## Domain Context
${context}

## Proposer's Result
${proposerResult}

## Your Task
Review the above ontology extraction result. Identify issues and provide structured feedback.

Return JSON:
{
  "agreements": [
    "Well-captured aspect 1 and why it's correct",
    "..."
  ],
  "challenges": [
    {
      "target": "specific concept or relationship being challenged",
      "issue": "clear description of the problem",
      "severity": "critical|major|minor",
      "suggestion": "concrete improvement suggestion",
      "evidence": "reasoning or evidence supporting this challenge"
    }
  ],
  "additions": [
    "Missing concept/relationship that should be added, with justification"
  ]
}`;

/**
 * Proposer (回应者) 的 Response Prompt
 */
const DEFENDER_SYSTEM = `You are an ontology engineer defending your work. You have received critical feedback on your ontology extraction. For each challenge:
1. If the challenge is valid: ACCEPT it and modify your result accordingly
2. If the challenge is partially valid: MODIFY your result with a compromise
3. If the challenge is invalid: REJECT it with clear reasoning

Be intellectually honest. Don't defend mistakes just to "win" — the goal is the best possible ontology.`;

const DEFENDER_USER = (originalResult: string, challenges: string, context: string) => `
## Domain Context
${context}

## Your Original Result
${originalResult}

## Challenger's Feedback
${challenges}

## Your Task
Respond to each challenge and provide your updated ontology result.

Return JSON:
{
  "responses": [
    {
      "challengeTarget": "the item that was challenged",
      "decision": "accept|reject|modify",
      "reasoning": "why you made this decision",
      "modification": "if modify, what specifically changed"
    }
  ],
  "updatedResult": {
    // your modified ontology extraction result (same schema as original)
  }
}`;

/**
 * Judge (裁判) 的 Prompt
 */
const JUDGE_SYSTEM = `You are a senior ontology engineer serving as the final arbiter in an ontology extraction debate. You have access to the complete debate history between a Proposer and a Challenger.

Your responsibilities:
1. Review the entire debate objectively
2. For each disputed item, make a final decision based on the strongest arguments
3. You may also introduce new insights that neither party considered
4. Produce the final, definitive ontology result
5. Clearly mark which items were unanimous (both agreed) vs. decided by you after debate

Prioritize domain accuracy over completeness — it's better to have fewer correct items than many questionable ones.`;

const JUDGE_USER = (debateHistory: DebateRound[], context: string) => `
## Domain Context
${context}

## Complete Debate History
${debateHistory.map(r => `
### Round ${r.roundNumber} — ${r.role} (${r.modelUsed})
${r.output}
`).join('\n')}

## Your Task
Make final decisions on all disputed items and produce the definitive result.

Return JSON:
{
  "verdicts": [
    {
      "item": "concept or relationship name",
      "consensusType": "unanimous|debated|unresolved",
      "finalDecision": "what the final result should be",
      "reasoning": "why you decided this way",
      "confidence": 0.95
    }
  ],
  "finalResult": {
    // The definitive ontology extraction result (same schema as proposer)
    // This is the result that will be used going forward
  }
}`;
```

### 5.4 验证问题生成器

```typescript
// src/services/annotation/ValidationGenerator.ts

class ValidationGenerator {
  /**
   * 从本体中自动生成验证问题
   */
  generateQuestions(
    concepts: OntologyConcept[],
    relations: OntologyRelation[],
    workflows: Workflow[],
    config: { maxQuestions: number; language: string }
  ): ValidationQuestion[] {
    const questions: ValidationQuestion[] = [];
    
    // 1. 为每条关系生成判断题
    for (const relation of relations) {
      if (questions.length >= config.maxQuestions) break;
      const source = concepts.find(c => c.id === relation.sourceConceptId);
      const target = concepts.find(c => c.id === relation.targetConceptId);
      if (!source || !target) continue;
      
      questions.push({
        id: generateId(),
        projectId: relation.projectId,
        questionType: 'boolean',
        text: config.language === 'zh' 
          ? `以下关系是否正确："${source.name}" ${relation.name} "${target.name}"？`
          : `Is the following relationship correct: "${source.name}" ${relation.name} "${target.name}"?`,
        difficulty: this.assessDifficulty(relation),
        domains: this.extractDomains(source, target),
        relatedConceptIds: [source.id, target.id],
        relatedRelationIds: [relation.id],
        relatedWorkflowIds: [],
        generatedFrom: 'relation',
        createdAt: Date.now(),
      });
    }
    
    // 2. 为每对有关系的概念生成选择题
    for (const relation of relations) {
      if (questions.length >= config.maxQuestions) break;
      const source = concepts.find(c => c.id === relation.sourceConceptId);
      const target = concepts.find(c => c.id === relation.targetConceptId);
      if (!source || !target) continue;
      
      questions.push({
        id: generateId(),
        projectId: relation.projectId,
        questionType: 'multiple_choice',
        text: config.language === 'zh'
          ? `"${source.name}" 和 "${target.name}" 之间的关系最准确的描述是？`
          : `What is the most accurate description of the relationship between "${source.name}" and "${target.name}"?`,
        options: [
          { id: 'a', text: config.language === 'zh' ? '包含 (contains)' : 'Contains' },
          { id: 'b', text: config.language === 'zh' ? '关联 (associated with)' : 'Associated with' },
          { id: 'c', text: config.language === 'zh' ? '继承 (inherits from)' : 'Inherits from' },
          { id: 'd', text: config.language === 'zh' ? '组成部分 (part of)' : 'Part of' },
          { id: 'e', text: config.language === 'zh' ? '无直接关系' : 'No direct relationship' },
          { id: 'f', text: config.language === 'zh' ? '其他（请在备注中说明）' : 'Other (explain in notes)' },
        ],
        difficulty: this.assessDifficulty(relation),
        domains: this.extractDomains(source, target),
        relatedConceptIds: [source.id, target.id],
        relatedRelationIds: [relation.id],
        relatedWorkflowIds: [],
        generatedFrom: 'relation',
        createdAt: Date.now(),
      });
    }
    
    // 3. 为每个 ontologyLayer 生成排序题
    const layers = [...new Set(concepts.map(c => c.ontologyLayer))];
    for (const layer of layers) {
      if (questions.length >= config.maxQuestions) break;
      const layerConcepts = concepts.filter(c => c.ontologyLayer === layer);
      if (layerConcepts.length < 3) continue;
      
      // 取前 8 个概念
      const rankingItems = layerConcepts.slice(0, 8).map(c => ({
        id: c.id,
        text: c.name,
      }));
      
      questions.push({
        id: generateId(),
        projectId: concepts[0].projectId,
        questionType: 'ranking',
        text: config.language === 'zh'
          ? `请按重要性排列以下概念（最重要的排在前面）：`
          : `Please rank the following concepts by importance (most important first):`,
        rankingItems,
        difficulty: 'medium',
        domains: [layer],
        relatedConceptIds: rankingItems.map(r => r.id),
        relatedRelationIds: [],
        relatedWorkflowIds: [],
        generatedFrom: 'concept',
        createdAt: Date.now(),
      });
    }
    
    // 4. 为每个工作流生成补充题
    for (const workflow of workflows) {
      if (questions.length >= config.maxQuestions) break;
      
      questions.push({
        id: generateId(),
        projectId: workflow.projectId,
        questionType: 'open_ended',
        text: config.language === 'zh'
          ? `您认为 "${workflow.name}" 工作流还缺少哪些步骤或考虑因素？`
          : `What steps or considerations do you think are missing from the "${workflow.name}" workflow?`,
        context: config.language === 'zh'
          ? `当前步骤：${workflow.steps?.map(s => s.name).join(' → ')}`
          : `Current steps: ${workflow.steps?.map(s => s.name).join(' → ')}`,
        difficulty: 'hard',
        domains: this.extractWorkflowDomains(workflow),
        relatedConceptIds: workflow.involvedConceptIds || [],
        relatedRelationIds: [],
        relatedWorkflowIds: [workflow.id],
        generatedFrom: 'workflow',
        createdAt: Date.now(),
      });
    }
    
    return questions;
  }
  
  private assessDifficulty(relation: OntologyRelation): Difficulty {
    if (relation.inferenceType === 'indirect') return 'hard';
    if (relation.confidence < 0.7) return 'hard';
    if (relation.confidence < 0.9) return 'medium';
    return 'easy';
  }
}
```

### 5.5 共识度计算器

```typescript
// src/services/annotation/ConsensusCalculator.ts

class ConsensusCalculator {
  /**
   * 计算单个问题的共识度
   */
  calculateConsensus(
    question: ValidationQuestion,
    results: AnnotationResult[],
    experts: ExpertProfile[],
    threshold: number = 0.7
  ): ConsensusResult {
    const validResults = results.filter(r => !r.skipped);
    if (validResults.length === 0) {
      return this.emptyConsensus(question.id, threshold);
    }
    
    switch (question.questionType) {
      case 'boolean':
        return this.calculateBooleanConsensus(question, validResults, experts, threshold);
      case 'multiple_choice':
        return this.calculateMCConsensus(question, validResults, experts, threshold);
      case 'ranking':
        return this.calculateRankingConsensus(question, validResults, experts, threshold);
      case 'open_ended':
        return this.calculateOpenEndedConsensus(question, validResults, experts, threshold);
    }
  }
  
  private calculateBooleanConsensus(
    question: ValidationQuestion,
    results: AnnotationResult[],
    experts: ExpertProfile[],
    threshold: number
  ): ConsensusResult {
    // 简单一致率
    const counts = { true: 0, false: 0, null: 0 };
    results.forEach(r => {
      const key = String(r.answer.booleanValue);
      counts[key as keyof typeof counts]++;
    });
    
    const total = results.length;
    const maxCount = Math.max(counts.true, counts.false, counts.null);
    const simpleAgreement = maxCount / total;
    
    // 加权一致率
    const weightedCounts = { true: 0, false: 0, null: 0 };
    results.forEach(r => {
      const expert = experts.find(e => e.id === r.expertId);
      const weight = expert ? this.calculateWeight(expert, question.domains) : 1.0;
      const key = String(r.answer.booleanValue);
      weightedCounts[key as keyof typeof weightedCounts] += weight;
    });
    
    const totalWeight = Object.values(weightedCounts).reduce((a, b) => a + b, 0);
    const maxWeightedCount = Math.max(...Object.values(weightedCounts));
    const weightedAgreement = maxWeightedCount / totalWeight;
    
    // Fleiss' Kappa
    const fleissKappa = this.computeFleissKappa(results, ['true', 'false', 'null']);
    
    // 确定共识答案
    const consensusKey = Object.entries(weightedCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
    const consensusAnswer = consensusKey === 'null' ? null : consensusKey === 'true';
    
    return {
      questionId: question.id,
      totalResponses: total,
      simpleAgreement,
      weightedAgreement,
      fleissKappa,
      isConsensus: weightedAgreement >= threshold,
      isDisputed: weightedAgreement < threshold,
      consensusThreshold: threshold,
      consensusAnswer,
      distribution: {
        'yes': counts.true,
        'no': counts.false,
        'unsure': counts.null,
      },
      escalated: false,
    };
  }
  
  /**
   * 计算专家权重
   * 资历权重 × 领域匹配权重
   */
  private calculateWeight(expert: ExpertProfile, questionDomains: string[]): number {
    // 资历权重
    const levelWeights: Record<ExpertLevel, number> = {
      principal: 1.5,
      senior: 1.2,
      mid: 1.0,
      junior: 0.8,
    };
    const levelWeight = levelWeights[expert.level];
    
    // 领域匹配权重
    const domainMatch = expert.domains.some(d => questionDomains.includes(d));
    const domainWeight = domainMatch ? 1.3 : 0.7;
    
    return levelWeight * domainWeight;
  }
  
  /**
   * Fleiss' Kappa 计算
   */
  private computeFleissKappa(
    results: AnnotationResult[],
    categories: string[]
  ): number {
    // Standard Fleiss' Kappa implementation
    const n = results.length;  // number of raters
    const N = 1;               // number of subjects (1 question)
    const k = categories.length;
    
    // ... standard implementation
    // P_o = observed agreement
    // P_e = expected agreement by chance
    // kappa = (P_o - P_e) / (1 - P_e)
    
    return 0; // placeholder
  }
}
```

### 5.6 自动模式引擎

```typescript
// src/services/mining/AutoModeEngine.ts

interface AutoModeStep {
  name: string;
  phase: string;
  execute: () => Promise<any>;
  isManual: boolean;                     // 需要人工的步骤
  weight: number;                        // 进度权重（占总进度的比例）
}

class AutoModeEngine {
  private steps: AutoModeStep[];
  private currentStep: number = 0;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  
  /**
   * 构建自动模式的步骤列表
   */
  buildSteps(project: MiningProject, debateConfig: DebateConfig): AutoModeStep[] {
    return [
      // ✋ 手动步骤（在自动模式开始前已完成）
      // { name: '设置领域描述', phase: 'domain_input', isManual: true, weight: 0.05 },
      // { name: '选择顶层 CQ', phase: 'cq_selection', isManual: true, weight: 0.05 },
      // { name: '确认顶层本体', phase: 'ontology_confirm', isManual: true, weight: 0.05 },
      
      // 🤖 自动步骤
      { name: 'CQ 展开', phase: 'cq_expansion', weight: 0.15,
        isManual: false,
        execute: () => this.expandCQs(project) },
      
      { name: '本体提取', phase: 'ontology_extraction', weight: 0.20,
        isManual: false,
        execute: () => this.extractOntology(project, debateConfig) },
      
      { name: '深入推演', phase: 'drill_down', weight: 0.25,
        isManual: false,
        execute: () => this.drillDown(project, debateConfig) },
      
      { name: '工作流提取', phase: 'workflow_extraction', weight: 0.15,
        isManual: false,
        execute: () => this.extractWorkflows(project, debateConfig) },
      
      { name: '关系推演', phase: 'relation_inference', weight: 0.15,
        isManual: false,
        execute: () => this.inferRelations(project, debateConfig) },
      
      { name: '生成验证问题', phase: 'validation_generation', weight: 0.10,
        isManual: false,
        execute: () => this.generateValidation(project) },
      
      // ✋ 标注验证（手动，自动模式在此停下）
    ];
  }
  
  /**
   * 运行自动模式
   */
  async run(
    project: MiningProject,
    onProgress: (progress: AutoModeProgress) => void
  ): Promise<void> {
    const steps = this.buildSteps(project, project.debateConfig);
    let completedWeight = 0;
    
    for (let i = 0; i < steps.length; i++) {
      if (this.isCancelled) break;
      while (this.isPaused) {
        await this.sleep(500);
        if (this.isCancelled) break;
      }
      
      const step = steps[i];
      this.currentStep = i;
      
      onProgress({
        currentStep: step.name,
        currentPhase: step.phase,
        stepIndex: i,
        totalSteps: steps.length,
        overallProgress: completedWeight,
        status: 'running',
        message: `正在执行：${step.name}...`,
      });
      
      try {
        await step.execute();
        completedWeight += step.weight;
        
        onProgress({
          currentStep: step.name,
          currentPhase: step.phase,
          stepIndex: i,
          totalSteps: steps.length,
          overallProgress: completedWeight,
          status: 'step_complete',
          message: `✅ ${step.name} 完成`,
        });
        
        // 每步完成后保存
        await this.saveProgress(project);
        
      } catch (error) {
        onProgress({
          currentStep: step.name,
          currentPhase: step.phase,
          stepIndex: i,
          totalSteps: steps.length,
          overallProgress: completedWeight,
          status: 'error',
          message: `❌ ${step.name} 失败: ${error.message}`,
          error,
        });
        
        // 等待用户决定（重试/跳过/停止）
        const decision = await this.waitForUserDecision();
        if (decision === 'retry') { i--; continue; }
        if (decision === 'stop') break;
        // skip: continue to next step
      }
    }
    
    onProgress({
      currentStep: '',
      currentPhase: 'complete',
      stepIndex: steps.length,
      totalSteps: steps.length,
      overallProgress: 1.0,
      status: 'complete',
      message: '自动挖掘完成，请进行标注验证',
    });
  }
  
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  cancel() { this.isCancelled = true; }
}

interface AutoModeProgress {
  currentStep: string;
  currentPhase: string;
  stepIndex: number;
  totalSteps: number;
  overallProgress: number;           // 0-1
  status: 'running' | 'step_complete' | 'paused' | 'error' | 'complete';
  message: string;
  error?: Error;
  // 可选的详细信息
  conceptsExtracted?: number;
  relationsFound?: number;
  debateRound?: number;
}
```

### 5.7 v2 增强的 LLM Prompts

```typescript
// src/services/mining/prompts-v2.ts

/**
 * v2 增强版 CQ 生成 Prompt — 更多 CQ，更细分类
 */
const CQ_GENERATION_V2_SYSTEM = `You are an expert ontology engineer specializing in Competency Questions (CQ) methodology. Your task is to generate comprehensive Competency Questions for a given domain.

Generate questions covering ALL of these categories:
1. scoping: Domain boundaries and scope definition
2. foundational: Core entities, their attributes and definitions
3. relationship: Connections, dependencies between entities
4. process: Business processes, workflows, procedures
5. constraint: Rules, limitations, validation rules
6. temporal: Time-related aspects, lifecycle, state transitions
7. quality: Metrics, KPIs, quality measures, quantities

Each CQ should:
- Be specific and answerable by a well-designed ontology
- Have a clear relevance score indicating its importance
- List concepts that would be needed to answer it
- Note any dependency on other CQs

${/* Data source context will be injected here */''}`;

const CQ_GENERATION_V2_USER = (
  domain: string,
  count: number,
  language: string,
  dataSourceContext: string
) => `
Domain Description:
${domain}

${dataSourceContext ? `## Reference Data Sources\n${dataSourceContext}\n` : ''}

Generate exactly ${count} Competency Questions. Ensure broad coverage across all 7 categories.

Respond in ${language === 'zh' ? 'Chinese' : language === 'en' ? 'English' : 'the same language as the domain description'}.

Return JSON:
{
  "cqs": [
    {
      "text": "question text",
      "category": "scoping|foundational|relationship|process|constraint|temporal|quality",
      "importance": "high|medium|low",
      "relevanceScore": 0.95,
      "relatedConcepts": ["concept1", "concept2"],
      "dependsOnCQs": [0, 2],
      "expectedAnswerComplexity": "simple|moderate|complex"
    }
  ]
}`;

/**
 * v2 增强版本体提取 — 更多概念，更详细属性
 */
const ONTOLOGY_EXTRACTION_V2_SYSTEM = `You are an expert ontology engineer. Extract a comprehensive ontology from the confirmed domain knowledge.

IMPORTANT v2 enhancements:
1. Extract 10-20 concepts (more than before)
2. Each concept MUST have at least 3 properties with FULL detail
3. Properties must include: name, description, dataType, isRequired, constraints, exampleValues (2+)
4. Supported data types: string, number, boolean, date, datetime, enum, reference, list, object, money, percentage, duration, geo
5. Identify ALL relationship types including indirect and compositional
6. Assign a confidence score (0-1) to each concept and relationship
7. Provide evidence/reasoning for each relationship

Follow these principles:
- Identify distinct concepts (classes) - avoid duplicates and synonyms
- Assign each concept to an ontology layer: upper, domain, task, application
- Think about both direct and indirect relationships
- Consider inheritance hierarchies (is_a) and composition (part_of, composed_of)
- Reference any provided data sources in your reasoning`;

const ONTOLOGY_EXTRACTION_V2_USER = (
  domain: string,
  expansions: ExpandedCQ[],
  dataSourceContext: string
) => `
Domain: ${domain}

${dataSourceContext ? `## Reference Data Sources\n${dataSourceContext}\n` : ''}

Confirmed knowledge from expanded CQs:
${expansions.map((e, i) => `
--- CQ ${i + 1}: ${e.originalText} ---
${e.expansion}
Concepts: ${e.extractedConcepts.join(', ')}
Relations: ${e.extractedRelations.join(', ')}
User notes: ${e.userNotes || 'none'}
`).join('\n')}

Extract a comprehensive ontology with 10-20 concepts. Each concept must have detailed properties.

Return JSON:
{
  "concepts": [
    {
      "name": "ConceptName",
      "description": "detailed description of what this concept represents",
      "aliases": ["alternative names"],
      "ontologyLayer": "upper|domain|task|application",
      "confidence": 0.95,
      "properties": [
        {
          "name": "propertyName",
          "description": "what this property represents",
          "dataType": "string|number|boolean|date|datetime|enum|reference|list|object|money|percentage|duration|geo",
          "isRequired": true,
          "constraints": "e.g., 'max length 100', 'positive integer', 'enum: [active, inactive, archived]'",
          "exampleValues": ["example1", "example2"]
        }
      ]
    }
  ],
  "relations": [
    {
      "name": "relationship name",
      "description": "what this relationship represents",
      "sourceConcept": "ConceptA",
      "targetConcept": "ConceptB",
      "cardinality": "1:1|1:N|N:1|N:M",
      "relationType": "is_a|has_a|part_of|depends_on|triggers|produces|consumes|associated_with|inherits_from|composed_of|aggregates|specializes|generalizes|precedes|follows|constrains|enables",
      "confidence": 0.9,
      "evidence": "reasoning for why this relationship exists",
      "inferenceType": "direct|indirect|inherited|composed"
    }
  ]
}`;
```

---

## 6. 页面设计（v2 新增/修改）

### 6.1 MiningWorkspacePage 改版

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back  │  物流仓储管理                [Auto ⚡] [Manual 🖐]  💾  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Phase Progress Bar:                                                  │
│  [✓ Domain] → [✓ CQ Gen] → [● Extract] → [ Drill ] → ...          │
│                                                                       │
├────────────┬──────────────────────────────────┬──────────────────────┤
│            │                                   │                      │
│  Phase     │  Main Content Area               │  Debate Panel       │
│  Panel     │                                   │  (collapsible)      │
│  (left)    │  [Data Sources 📎] [Mining ⛏]    │                      │
│            │                                   │  🟦 Proposer (GPT4o)│
│  Phase:    │  ┌────────────────────────────┐  │  "I identified 15   │
│  Extract   │  │  ... mining content ...    │  │   concepts..."      │
│            │  └────────────────────────────┘  │                      │
│  Mode:     │                                   │  🟥 Challenger       │
│  Auto ⚡   │                                   │  (Claude)           │
│            │                                   │  "Missing concept:  │
│  Progress: │                                   │   'Shipping Zone'"  │
│  ████░░ 65%│                                   │                      │
│            │                                   │  🟨 Judge (GPT4o-m) │
│  Stats:    │                                   │  "Accept challenge, │
│  📊 15 概念│                                   │   add Shipping Zone"│
│  🔗 23 关系│                                   │                      │
│  📋 3 工作流│                                   │  [Expand All]       │
│            │                                   │  [Collapse All]     │
├────────────┴──────────────────────────────────┴──────────────────────┤
│  Graph View — [知识图谱] [属性图] [层级树] [矩阵] [流程] [统计]      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   [Active Graph View]                          │  │
│  │                   (shared data, switchable)                    │  │
│  │                                                                │  │
│  │                                          [⛶ Full Screen]      │  │
│  │                                          [📸 Export PNG/SVG]   │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Source Panel

```
┌────────────────────────────────────────┐
│  Data Sources                  [+ Add] │
├────────────────────────────────────────┤
│                                         │
│  📄 物流仓储标准操作流程.pdf            │
│     PDF │ 2.3MB │ 3min ago │ ✅ Active │
│     Tags: [核心文档] [SOP]             │
│     [Preview] [Edit] [🗑]              │
│                                         │
│  🌐 wiki.example.com/warehouse-ops     │
│     URL │ 15KB │ 5min ago │ ✅ Active  │
│     Tags: [参考资料]                    │
│     [Preview] [Edit] [🗑]              │
│                                         │
│  📊 inventory-data-2024.xlsx           │
│     Excel │ 890KB │ 10min ago │ ☐      │
│     Tags: [数据样本]                    │
│     [Preview] [Edit] [🗑]              │
│                                         │
│  ─────────────────────────────          │
│  Add Data Source:                        │
│  [📎 Upload File] [🌐 Add URL]         │
│                                         │
│  Supported: PDF, Excel, CSV, MD, Images │
└────────────────────────────────────────┘
```

### 6.3 Annotation Page

```
┌──────────────────────────────────────────────────────────────────┐
│  Ontology Miner — Validation                    Expert: 张三     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Progress: ████████████░░░░░░░░  12/50 questions  │ ~8 min left  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Question 12 of 50                              [Medium]   │  │
│  │                                                            │  │
│  │  以下关系是否正确：                                         │  │
│  │  "仓库" 包含 "库位"？                                      │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐            │  │
│  │  │  ✅ 是   │  │  ❌ 否   │  │  ❓ 不确定   │            │  │
│  │  │  (1)     │  │  (2)     │  │  (3)         │            │  │
│  │  └──────────┘  └──────────┘  └──────────────┘            │  │
│  │                                                            │  │
│  │  备注（可选）：                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │                                                      │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  [← 上一题 (Backspace)]          [下一题 → (Enter)]       │  │
│  │  [跳过 (S)]                                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Keyboard: 1=是  2=否  3=不确定  Enter=下一题  Backspace=上一题  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Voting Stats Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  Annotation Results — 投票统计                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Overview:  50 questions │ 5 experts │ 92% completion             │
│  Average Consensus: 0.78  │  Disputed: 8 questions               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Q1: "仓库" 包含 "库位"？                       ✅ 共识   │  │
│  │  ┌─────────────────────────────┐                          │  │
│  │  │ 是 ████████████████ 80%    │  Agreement: 0.80         │  │
│  │  │ 否 ████ 20%                │  W-Agreement: 0.85       │  │
│  │  │ 不确定              0%     │  Kappa: 0.72             │  │
│  │  └─────────────────────────────┘                          │  │
│  │  Experts: 张三(✅是) 李四(✅是) 王五(✅是) 赵六(❌否)     │  │
│  │          钱七(✅是)                                        │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  Q8: "订单"和"客户"的关系？                     ⚠️ 争议   │  │
│  │  ┌─────────────────────────────┐                          │  │
│  │  │ A.包含    ████ 20%         │  Agreement: 0.40         │  │
│  │  │ B.关联    ████████ 40%     │  W-Agreement: 0.45       │  │
│  │  │ C.继承              0%     │  Kappa: 0.15             │  │
│  │  │ D.组成部分 ████████ 40%    │                          │  │
│  │  └─────────────────────────────┘                          │  │
│  │  [🔺 Escalate to Senior Expert]  [🔄 Re-mine this area]  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Actions: [Apply Consensus] [Generate Report] [Export Results]    │
└──────────────────────────────────────────────────────────────────┘
```

### 6.5 Settings Page 扩展

```
┌────────────────────────────────────────────────────────────────┐
│  Settings                                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LLM Provider (Primary)                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Provider: [OpenAI ▾]   Model: [gpt-4o ▾]               │   │
│  │ API Key:  [••••••••]   [Test]                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Debate Configuration                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Debate Mode: [✅ Enabled]                                │   │
│  │ Preset: [Standard ▾]                                     │   │
│  │                                                          │   │
│  │ Proposer:   [OpenAI / gpt-4o ▾]       Temp: [0.7]      │   │
│  │ Challenger: [Anthropic / claude-sonnet ▾] Temp: [0.5]   │   │
│  │ Judge:      [OpenAI / gpt-4o-mini ▾]  Temp: [0.3]      │   │
│  │                                                          │   │
│  │ Rounds: [3]  │ Steps: [☑ Extract] [☑ Drill] [☑ Infer]  │   │
│  │              │        [☐ CQ Gen] [☐ Workflow]           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Mining Defaults                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CQ Count:     [15]          (10-25)                      │   │
│  │ Max Depth:    [10]                                       │   │
│  │ Language:     [Auto ▾]                                   │   │
│  │ Default Mode: [Auto ▾]                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Annotation                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Max Questions:      [50]                                 │   │
│  │ Consensus Threshold: [0.7]                               │   │
│  │ Sharing Backend:    [None ▾]  (None / Firebase / Custom) │   │
│  │ Firebase Config:    [Configure...]                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Data Sources                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CORS Proxy URL: [https://api.allorigins.win ▾]          │   │
│  │ Custom Proxy:   [                            ]           │   │
│  │ Max File Size:  [50 MB]                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Expert Profiles                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [+ Add Expert]                                           │   │
│  │ 张三 │ 仓储物流 │ 10年 │ 资深   │ [Edit] [Delete]      │   │
│  │ 李四 │ 供应链   │ 5年  │ 高级   │ [Edit] [Delete]      │   │
│  │ 王五 │ IT系统   │ 8年  │ 高级   │ [Edit] [Delete]      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. 依赖包清单

### 7.1 v1 保留依赖

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.0.0",
  "@xyflow/react": "^12.0.0",
  "zustand": "^5.0.0",
  "dexie": "^4.0.0",
  "tailwindcss": "^4.0.0",
  "nanoid": "^5.0.0",
  "lucide-react": "^0.400.0"
}
```

### 7.2 v2 新增依赖

```json
{
  "pdfjs-dist": "^4.0.0",
  "xlsx": "^0.18.0",
  "papaparse": "^5.4.0",
  "@mozilla/readability": "^0.5.0",
  "marked": "^12.0.0",
  "xstate": "^5.0.0",
  "d3": "^7.0.0",
  "d3-hierarchy": "^3.1.0",
  "recharts": "^2.12.0",
  "html2canvas": "^1.4.0",
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^8.0.0",
  "firebase": "^11.0.0"
}
```

### 7.3 dev 依赖

```json
{
  "vite": "^6.0.0",
  "typescript": "^5.6.0",
  "@types/d3": "^7.0.0",
  "@types/papaparse": "^5.3.0",
  "vitest": "^2.0.0"
}
```
