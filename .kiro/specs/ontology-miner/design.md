# Ontology Miner — System Design

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (SPA)                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  UI Layer     │  │  State Mgmt  │  │  Persistence  │  │
│  │  (React)      │  │  (Zustand)   │  │  (Dexie.js)   │  │
│  │              │  │              │  │              │  │
│  │  Pages       │  │  Project     │  │  IndexedDB   │  │
│  │  Components  │  │  Ontology    │  │  Import/     │  │
│  │  Layouts     │  │  Mining FSM  │  │  Export      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│  ┌──────┴─────────────────┴──────────────────┴───────┐  │
│  │              Service Layer                         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐ │  │
│  │  │ LLM Service│ │ Mining     │ │ Export Service │ │  │
│  │  │ (Provider) │ │ Engine     │ │ (JSON/MD/...) │ │  │
│  │  └─────┬──────┘ └────────────┘ └────────────────┘ │  │
│  └────────┼──────────────────────────────────────────┘  │
│           │                                              │
│  ┌────────┴──────────────────────────────────────────┐  │
│  │              LLM Provider Layer                    │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │  │
│  │  │ OpenAI   │  │ Anthropic │  │ Mock         │   │  │
│  │  │ Provider │  │ Provider  │  │ Provider     │   │  │
│  │  └────┬─────┘  └─────┬─────┘  └──────────────┘   │  │
│  └───────┼──────────────┼────────────────────────────┘  │
│          │              │                                │
└──────────┼──────────────┼────────────────────────────────┘
           │              │
    ┌──────┴──────┐ ┌─────┴──────┐
    │ OpenAI API  │ │ Anthropic  │
    │ /v1/chat/   │ │ API /v1/   │
    │ completions │ │ messages   │
    └─────────────┘ └────────────┘
```

### 架构决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 状态管理 | Zustand | 比 Redux 轻量，支持 middleware，适合中等复杂度 |
| 持久化 | Dexie.js (IndexedDB) | 结构化存储，支持事务，比 localStorage 容量大 |
| 图可视化 | React Flow | React 生态无缝集成，自定义节点能力强，足够 1000 节点 |
| 样式方案 | Tailwind CSS + shadcn/ui | 快速开发，组件库完整 |
| 路由 | React Router v7 | 标准选择 |
| LLM 调用 | 直接从浏览器 | 无后端，简化部署，API Key 用户自管 |

---

## 2. 项目目录结构

```
ontology-miner/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                           # 入口
│   ├── App.tsx                            # 根组件 + 路由
│   ├── vite-env.d.ts
│   │
│   ├── types/                             # 类型定义
│   │   ├── index.ts                       # 重导出
│   │   ├── project.ts                     # MiningProject, ProjectSettings
│   │   ├── ontology.ts                    # OntologyConcept, OntologyRelation, etc.
│   │   ├── mining.ts                      # MiningPhase, StepSnapshot, etc.
│   │   ├── cq.ts                          # CompetencyQuestion, ExpandedCQ
│   │   ├── workflow.ts                    # Workflow, WorkflowStep
│   │   └── llm.ts                         # LLMProvider, LLMRequest, LLMResponse
│   │
│   ├── stores/                            # Zustand stores
│   │   ├── useProjectStore.ts             # 项目 CRUD + 列表
│   │   ├── useMiningStore.ts              # 挖掘流程状态机
│   │   ├── useOntologyStore.ts            # 本体图谱数据
│   │   └── useSettingsStore.ts            # 全局设置
│   │
│   ├── services/                          # 业务逻辑层
│   │   ├── llm/                           # LLM Provider
│   │   │   ├── LLMProvider.ts             # 接口定义
│   │   │   ├── OpenAIProvider.ts          # OpenAI 实现
│   │   │   ├── AnthropicProvider.ts       # Anthropic 实现
│   │   │   ├── MockProvider.ts            # Mock 实现
│   │   │   └── index.ts                   # Provider 工厂
│   │   │
│   │   ├── mining/                        # 挖掘引擎
│   │   │   ├── MiningEngine.ts            # 状态机驱动器
│   │   │   ├── prompts.ts                 # 所有 LLM Prompt 模板
│   │   │   ├── parsers.ts                 # LLM 输出解析器
│   │   │   └── validators.ts              # 本体一致性验证
│   │   │
│   │   ├── persistence/                   # 持久化
│   │   │   ├── db.ts                      # Dexie 数据库定义
│   │   │   ├── migrations.ts              # 数据库迁移
│   │   │   └── sync.ts                    # Store ↔ DB 同步
│   │   │
│   │   └── export/                        # 导出
│   │       ├── ExportService.ts           # 导出协调器
│   │       ├── JsonExporter.ts            # JSON 导出
│   │       ├── MarkdownExporter.ts        # Markdown 导出
│   │       ├── JsonLdExporter.ts          # JSON-LD 导出
│   │       ├── CsvExporter.ts             # CSV 导出
│   │       └── MermaidExporter.ts         # Mermaid 导出
│   │
│   ├── pages/                             # 页面组件
│   │   ├── ProjectListPage.tsx            # 项目列表
│   │   ├── MiningWorkspacePage.tsx         # 挖掘工作台（主页面）
│   │   └── SettingsPage.tsx               # 设置页面
│   │
│   ├── components/                        # UI 组件
│   │   ├── layout/                        # 布局
│   │   │   ├── AppLayout.tsx              # 应用主布局
│   │   │   ├── Sidebar.tsx                # 侧边栏
│   │   │   └── Header.tsx                 # 顶部导航
│   │   │
│   │   ├── mining/                        # 挖掘相关组件
│   │   │   ├── PhaseProgress.tsx          # 阶段进度条
│   │   │   ├── DomainInput.tsx            # 领域输入
│   │   │   ├── CQList.tsx                 # CQ 列表（生成 + 选择）
│   │   │   ├── CQExpansionCard.tsx        # CQ 展开卡片
│   │   │   ├── CQConfirmation.tsx         # CQ 确认面板
│   │   │   ├── OntologyExtraction.tsx     # 本体提取展示
│   │   │   ├── OntologyRefinement.tsx     # 本体细化面板
│   │   │   ├── WorkflowExtraction.tsx     # 工作流提取
│   │   │   ├── RelationMapping.tsx        # 关系推演
│   │   │   ├── ReviewPanel.tsx            # 审查面板
│   │   │   └── ExportPanel.tsx            # 导出面板
│   │   │
│   │   ├── graph/                         # 图谱可视化
│   │   │   ├── OntologyGraph.tsx          # 主图谱组件（React Flow）
│   │   │   ├── ConceptNode.tsx            # 概念节点
│   │   │   ├── RelationEdge.tsx           # 关系边
│   │   │   ├── GraphToolbar.tsx           # 图谱工具栏
│   │   │   ├── GraphMinimap.tsx           # 缩略图
│   │   │   ├── NodeDetailPanel.tsx        # 节点详情面板
│   │   │   └── GraphLegend.tsx            # 图例
│   │   │
│   │   ├── editors/                       # 编辑器
│   │   │   ├── ConceptEditor.tsx          # 概念编辑器
│   │   │   ├── RelationEditor.tsx         # 关系编辑器
│   │   │   ├── PropertyEditor.tsx         # 属性编辑器
│   │   │   └── WorkflowEditor.tsx         # 工作流编辑器
│   │   │
│   │   ├── common/                        # 通用组件
│   │   │   ├── StreamingText.tsx          # 流式文本显示
│   │   │   ├── ConfirmDialog.tsx          # 确认对话框
│   │   │   ├── SaveIndicator.tsx          # 保存状态指示器
│   │   │   └── EmptyState.tsx             # 空状态
│   │   │
│   │   └── ui/                            # shadcn/ui 组件
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       └── tooltip.tsx
│   │
│   ├── hooks/                             # 自定义 Hooks
│   │   ├── useLLM.ts                      # LLM 调用 hook
│   │   ├── useAutoSave.ts                 # 自动保存 hook
│   │   ├── useMiningNavigation.ts         # 挖掘导航 hook
│   │   ├── useKeyboardShortcuts.ts        # 快捷键 hook
│   │   └── useGraphLayout.ts              # 图谱布局 hook
│   │
│   ├── lib/                               # 工具库
│   │   ├── utils.ts                       # 通用工具
│   │   ├── id.ts                          # ID 生成 (nanoid)
│   │   └── cn.ts                          # classnames helper
│   │
│   └── styles/
│       └── globals.css                    # 全局样式 + Tailwind directives
│
├── mock/                                  # Mock 数据
│   ├── logistics-domain.json              # 物流领域示例项目
│   └── ecommerce-domain.json              # 电商领域示例项目
│
└── tests/                                 # 测试
    ├── services/
    │   ├── mining-engine.test.ts
    │   ├── prompts.test.ts
    │   └── parsers.test.ts
    └── components/
        └── ...
```

---

## 3. 数据模型（Dexie.js Schema）

```typescript
// src/services/persistence/db.ts

import Dexie, { Table } from 'dexie';

class OntologyMinerDB extends Dexie {
  projects!: Table<MiningProject>;
  steps!: Table<StepSnapshot>;
  concepts!: Table<OntologyConcept>;
  relations!: Table<OntologyRelation>;
  workflows!: Table<Workflow>;

  constructor() {
    super('OntologyMinerDB');
    
    this.version(1).stores({
      projects: 'id, name, updatedAt, currentPhase',
      steps: 'id, projectId, phase, parentStepId, createdAt, isActive, [projectId+phase], [projectId+isActive]',
      concepts: 'id, projectId, parentId, depth, ontologyLayer, status, [projectId+depth], [projectId+ontologyLayer]',
      relations: 'id, projectId, sourceConceptId, targetConceptId, status, [projectId+status]',
      workflows: 'id, projectId, status',
    });
  }
}

export const db = new OntologyMinerDB();
```

### 索引策略

| 表 | 主要查询模式 | 索引 |
|---|---|---|
| projects | 按更新时间排序 | `updatedAt` |
| steps | 按项目+阶段查询，按活跃状态过滤 | `[projectId+phase]`, `[projectId+isActive]` |
| concepts | 按项目+深度查询，按层级过滤 | `[projectId+depth]`, `[projectId+ontologyLayer]` |
| relations | 按项目查询，按源/目标概念查询 | `[projectId+status]`, `sourceConceptId`, `targetConceptId` |
| workflows | 按项目查询 | `projectId` |

---

## 4. 前端页面与路由设计

```typescript
// src/App.tsx

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ProjectListPage /> },
      { path: 'project/:projectId', element: <MiningWorkspacePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
];
```

### 页面描述

#### 4.1 ProjectListPage（项目列表页）

```
┌─────────────────────────────────────────────────────────┐
│  Ontology Miner                              ⚙️ Settings │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Your Projects                        [+ New Project]    │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 📦 物流仓储管理                                      │ │
│  │ Phase: Ontology Refinement │ 42 concepts │ 2h ago   │ │
│  │                                         ⋮ (menu)   │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ 🛒 电商运营                                          │ │
│  │ Phase: CQ Selection │ 0 concepts │ 1d ago          │ │
│  │                                         ⋮ (menu)   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Import Project...                                       │
└─────────────────────────────────────────────────────────┘
```

#### 4.2 MiningWorkspacePage（挖掘工作台）

这是核心页面，根据当前 phase 动态渲染不同内容：

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back  │  物流仓储管理                     💾 Saved  │ ⚙️ ⋮  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase Progress Bar:                                             │
│  [✓ Domain] → [✓ CQ Gen] → [● CQ Select] → [ Expand ] → ...  │
│                                                                  │
├────────────────────┬────────────────────────────────────────────┤
│                    │                                             │
│  Phase Panel       │  Main Content Area                         │
│  (left sidebar)    │                                             │
│                    │  (Changes based on current phase)           │
│  Phase: CQ Select  │                                             │
│  ──────────────    │  ┌───────────────────────────────────────┐ │
│  Selected: 3/10    │  │ □ What entities exist in warehouse    │ │
│                    │  │   management?                          │ │
│  Depth: -          │  │   [Foundational]                      │ │
│  Concepts: 0       │  │                                       │ │
│  Relations: 0      │  │ ☑ How are inventory items tracked     │ │
│                    │  │   across locations?                    │ │
│  ──────────────    │  │   [Process] ⭐                        │ │
│  Actions:          │  │                                       │ │
│  [Confirm →]       │  │ ☑ What rules govern order             │ │
│  [← Back]          │  │   fulfillment priority?               │ │
│                    │  │   [Constraint] ⭐                     │ │
│                    │  │                                       │ │
│                    │  │ ...                                   │ │
│                    │  └───────────────────────────────────────┘ │
│                    │                                             │
│                    │  [+ Add Custom CQ]                         │
│                    │                                             │
├────────────────────┴────────────────────────────────────────────┤
│  Graph View (collapsible, full-width when expanded)             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    [Ontology Graph]                         │ │
│  │        (Empty until Phase 4+)                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 Graph View（图谱视图，Phase 4+ 激活）

```
┌─────────────────────────────────────────────────────────────────┐
│  Graph Toolbar:  [Auto Layout] [Zoom +/-] [Fit] [List View]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│          ┌─────────┐         ┌─────────┐                        │
│          │ 仓库    │────────→│ 库位    │                        │
│          │ [Upper] │ 包含    │ [Domain]│                        │
│          │ 3 props │         │ 5 props │                        │
│          └────┬────┘         └─────────┘                        │
│               │ 存储                                             │
│               ▼                                                  │
│          ┌─────────┐         ┌─────────┐                        │
│          │ 货物    │────────→│ SKU     │                        │
│          │ [Domain]│ 属于    │ [Domain]│                        │
│          │ 7 props │         │ 4 props │                        │
│          └─────────┘         └─────────┘                        │
│                                                                  │
│  ┌──────────┐  Legend:                                           │
│  │ Minimap  │  ■ Upper  ■ Domain  ■ Task  ■ Application         │
│  └──────────┘  ── confirmed  - - generated                      │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.4 SettingsPage（设置页）

```
┌─────────────────────────────────────────────────────────┐
│  Settings                                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  LLM Provider                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Provider: [OpenAI ▾]                                │ │
│  │ Model:    [gpt-4o ▾]                                │ │
│  │ API Key:  [••••••••••••••••] [Test Connection]      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Mining Defaults                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ CQ Count:     [10]                                  │ │
│  │ Max Depth:    [10] (0 = unlimited)                  │ │
│  │ Language:     [Auto ▾]                              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Data                                                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [Export All Data]  [Clear All Data]                 │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 5. LLM Prompt 设计

### 5.1 CQ 生成 Prompt

```typescript
const CQ_GENERATION_SYSTEM = `You are an expert ontology engineer specializing in Competency Questions (CQ) methodology. Your task is to generate Competency Questions that will drive ontology construction for a given domain.

Each CQ should:
1. Be answerable by the ontology being built
2. Help identify core concepts, relationships, and constraints
3. Cover different aspects: scope, foundation, relationships, processes, constraints

Categorize each CQ as one of:
- scoping: Defines boundaries of the domain
- foundational: Identifies core entities and their attributes
- relationship: Discovers connections between entities
- process: Uncovers business processes and workflows
- constraint: Reveals rules and limitations`;

const CQ_GENERATION_USER = (domain: string, count: number, language: string) => `
Domain Description:
${domain}

Generate exactly ${count} Competency Questions for building an ontology of this domain.

Respond in ${language === 'zh' ? 'Chinese' : language === 'en' ? 'English' : 'the same language as the domain description'}.

Return JSON:
{
  "cqs": [
    {
      "text": "question text",
      "category": "scoping|foundational|relationship|process|constraint",
      "importance": "high|medium|low",
      "relatedConcepts": ["concept1", "concept2"]
    }
  ]
}`;
```

### 5.2 CQ 展开 Prompt

```typescript
const CQ_EXPANSION_SYSTEM = `You are an expert knowledge engineer. Your task is to expand Competency Questions into detailed domain knowledge that can be used to extract ontology elements.

For each CQ, provide:
1. A detailed expansion (200-500 words) explaining the domain knowledge needed to answer it
2. 3-5 sub-questions that break down the main question
3. Key concepts (nouns) that should become ontology classes
4. Key relationships (verbs/prepositions) between concepts`;

const CQ_EXPANSION_USER = (domain: string, cqs: CompetencyQuestion[]) => `
Domain: ${domain}

Competency Questions to expand:
${cqs.map((cq, i) => `${i + 1}. [${cq.category}] ${cq.text}`).join('\n')}

For each CQ, respond in JSON:
{
  "expansions": [
    {
      "cqIndex": 0,
      "expansion": "detailed expansion text...",
      "subQuestions": ["sub-q1", "sub-q2", ...],
      "extractedConcepts": ["Concept1", "Concept2", ...],
      "extractedRelations": ["Concept1 --contains--> Concept2", ...]
    }
  ]
}`;
```

### 5.3 顶层本体提取 Prompt

```typescript
const ONTOLOGY_EXTRACTION_SYSTEM = `You are an expert ontology engineer. Extract a top-level ontology from the confirmed domain knowledge.

Follow these principles:
1. Identify distinct concepts (classes) - avoid duplicates and synonyms
2. Assign each concept to an ontology layer:
   - upper: Very general concepts (Agent, Event, Process, Location, Resource)
   - domain: Domain-specific concepts (the core entities of this particular domain)
3. Define properties for each concept (name, type, description)
4. Identify relationships between concepts with cardinality
5. Keep the top-level ontology to 8-20 concepts - detailed drilling comes later

Use Palantir Foundry's Ontology principles:
- Each concept = Object Type (with properties)
- Each relationship = Link Type (with cardinality)
- Think about what Actions operate on these objects`;

const ONTOLOGY_EXTRACTION_USER = (domain: string, expansions: ExpandedCQ[]) => `
Domain: ${domain}

Confirmed knowledge from expanded CQs:
${expansions.map((e, i) => `
--- CQ ${i + 1}: ${e.originalText} ---
${e.expansion}
Concepts: ${e.extractedConcepts.join(', ')}
Relations: ${e.extractedRelations.join(', ')}
User notes: ${e.userNotes || 'none'}
`).join('\n')}

Extract the top-level ontology. Return JSON:
{
  "concepts": [
    {
      "name": "ConceptName",
      "description": "what this concept represents",
      "aliases": ["alternative names"],
      "ontologyLayer": "upper|domain",
      "properties": [
        {
          "name": "propertyName",
          "description": "what this property represents",
          "dataType": "string|number|boolean|date|datetime|enum|reference|list|object",
          "isRequired": true,
          "constraints": "optional constraint description",
          "exampleValues": ["example1"]
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
      "relationType": "is_a|has_a|part_of|depends_on|triggers|produces|consumes|associated_with|custom"
    }
  ]
}`;
```

### 5.4 本体深入 Prompt

```typescript
const ONTOLOGY_DRILL_DOWN_SYSTEM = `You are an expert ontology engineer performing iterative ontology refinement.

Given a parent concept and its context, generate:
1. Sub-concepts (more specific types or components)
2. Additional properties for the parent concept
3. Relationships between the new sub-concepts and existing concepts

Guidelines:
- Each sub-concept should be meaningfully distinct
- If fewer than 2 sub-concepts make sense, suggest stopping the drill-down
- Assign sub-concepts to appropriate ontology layers (domain/task/application)
- Include cross-cutting relationships to other existing concepts`;

const ONTOLOGY_DRILL_DOWN_USER = (
  concept: OntologyConcept,
  existingConcepts: OntologyConcept[],
  domain: string,
  depth: number
) => `
Domain: ${domain}
Current depth: ${depth}

Concept to drill down into:
- Name: ${concept.name}
- Description: ${concept.description}
- Layer: ${concept.ontologyLayer}
- Current properties: ${concept.properties.map(p => p.name).join(', ')}

Existing concepts in the ontology:
${existingConcepts.map(c => `- ${c.name} (${c.ontologyLayer})`).join('\n')}

Generate sub-concepts and relationships. Return JSON:
{
  "shouldContinue": true|false,
  "stopReason": "reason if shouldContinue is false",
  "subConcepts": [
    {
      "name": "SubConceptName",
      "description": "...",
      "ontologyLayer": "domain|task|application",
      "properties": [...]
    }
  ],
  "newRelations": [
    {
      "name": "relation name",
      "sourceConcept": "...",
      "targetConcept": "...",
      "cardinality": "...",
      "relationType": "..."
    }
  ],
  "additionalParentProperties": [
    {
      "name": "newPropName",
      "description": "...",
      "dataType": "...",
      "isRequired": false
    }
  ]
}`;
```

### 5.5 工作流提取 Prompt

```typescript
const WORKFLOW_EXTRACTION_SYSTEM = `You are a business process analyst. Given an ontology of concepts and relationships, identify the key business workflows in this domain.

For each workflow:
1. Name it clearly
2. List steps in order
3. For each step, identify: actor (who), inputs, outputs, conditions
4. Map steps to ontology concepts`;

const WORKFLOW_EXTRACTION_USER = (
  domain: string,
  concepts: OntologyConcept[],
  relations: OntologyRelation[]
) => `
Domain: ${domain}

Ontology concepts:
${concepts.map(c => `- ${c.name}: ${c.description} [${c.ontologyLayer}]`).join('\n')}

Relationships:
${relations.map(r => `- ${r.name}: ${concepts.find(c=>c.id===r.sourceConceptId)?.name} → ${concepts.find(c=>c.id===r.targetConceptId)?.name} (${r.cardinality})`).join('\n')}

Identify business workflows. Return JSON:
{
  "workflows": [
    {
      "name": "Workflow Name",
      "description": "...",
      "steps": [
        {
          "name": "Step Name",
          "description": "...",
          "order": 1,
          "actorConcept": "ConceptName or null",
          "inputConcepts": ["Concept1"],
          "outputConcepts": ["Concept2"],
          "conditions": "optional precondition",
          "rules": "optional business rule"
        }
      ],
      "involvedConcepts": ["Concept1", "Concept2"]
    }
  ]
}`;
```

### 5.6 关系推演 Prompt

```typescript
const RELATION_INFERENCE_SYSTEM = `You are an ontology relationship analyst. Given an ontology and its workflows, infer additional relationships that haven't been explicitly stated but can be derived from the workflow analysis.

Focus on:
1. Data flow relationships (what data flows between concepts via workflows)
2. Dependency relationships (what must exist before what)
3. Temporal relationships (what happens before/after what)
4. Aggregation relationships (what composes what)

For each inferred relationship, explain WHY it should exist.`;

const RELATION_INFERENCE_USER = (
  concepts: OntologyConcept[],
  existingRelations: OntologyRelation[],
  workflows: Workflow[]
) => `
Concepts:
${concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Existing relationships:
${existingRelations.map(r => `- ${r.name}: source→target (${r.cardinality})`).join('\n')}

Workflows:
${workflows.map(w => `
${w.name}:
${w.steps.map(s => `  ${s.order}. ${s.name} [actor: ${s.actorConceptId || 'system'}]`).join('\n')}
`).join('\n')}

Infer additional relationships. Return JSON:
{
  "inferredRelations": [
    {
      "name": "relation name",
      "sourceConcept": "...",
      "targetConcept": "...",
      "cardinality": "...",
      "relationType": "...",
      "reasoning": "why this relationship should exist"
    }
  ]
}`;
```

### 5.7 完备性检查 Prompt

```typescript
const COMPLETENESS_CHECK_SYSTEM = `You are an ontology quality auditor. Review the ontology for completeness and consistency issues.`;

const COMPLETENESS_CHECK_USER = (graph: OntologyGraph) => `
Review this ontology:

Concepts (${graph.concepts.length}):
${graph.concepts.map(c => `- ${c.name} (${c.ontologyLayer}, ${c.properties.length} props, depth ${c.depth})`).join('\n')}

Relations (${graph.relations.length}):
${graph.relations.map(r => `- ${r.name}: source→target`).join('\n')}

Workflows (${graph.workflows.length}):
${graph.workflows.map(w => `- ${w.name}: ${w.steps.length} steps`).join('\n')}

Identify issues:
{
  "issues": [
    {
      "type": "orphan_concept|missing_property|missing_relation|inconsistency|incomplete_workflow",
      "severity": "high|medium|low",
      "description": "what's wrong",
      "suggestion": "how to fix it",
      "affectedElements": ["element names"]
    }
  ]
}`;
```

---

## 6. 图可视化方案

### 6.1 技术选择：React Flow

**理由**：
- React 原生集成，组件化开发
- 支持自定义节点（可嵌入丰富 UI）
- 满足 1000 节点性能要求
- 内置缩略图、控件、背景
- 活跃社区和良好文档

### 6.2 自定义节点设计

```typescript
// ConceptNode — 概念节点
interface ConceptNodeData {
  concept: OntologyConcept;
  isSelected: boolean;
  isExpanded: boolean;
  onDrillDown: (id: string) => void;
  onEdit: (id: string) => void;
}

// 节点外观
// ┌─────────────────────────┐
// │ ■ ConceptName           │  ← 颜色条表示 ontologyLayer
// │ Description...          │
// │ ────────────            │
// │ 📋 5 properties         │
// │ 🔗 3 relations          │
// │ 📊 depth: 2             │
// │                         │
// │ [Drill ↓] [Edit ✎]     │  ← 操作按钮
// └─────────────────────────┘

// 颜色映射
const LAYER_COLORS = {
  upper: '#8B5CF6',        // Purple
  domain: '#3B82F6',       // Blue
  task: '#10B981',         // Green
  application: '#F59E0B',  // Amber
};

// 状态标记
const STATUS_INDICATORS = {
  generated: '○',    // 空心圆 — LLM 生成，未确认
  confirmed: '●',    // 实心圆 — 用户确认
  modified: '◐',     // 半圆 — 用户修改过
  deprecated: '✗',   // 叉 — 已弃用
};
```

### 6.3 边（关系）设计

```typescript
// RelationEdge
// 实线 = confirmed, 虚线 = generated/inferred
// 箭头方向表示关系方向
// 标签显示关系名称和基数

// is_a:          ──▷  (三角箭头，继承)
// has_a:         ──◇  (菱形，组合)
// part_of:       ──◆  (实心菱形，聚合)
// others:        ──→  (普通箭头)
```

### 6.4 自动布局

```typescript
// 使用 dagre 库做层次化布局
import dagre from 'dagre';

function autoLayout(concepts: OntologyConcept[], relations: OntologyRelation[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });
  
  concepts.forEach(c => g.setNode(c.id, { width: 240, height: 140 }));
  relations.forEach(r => g.setEdge(r.sourceConceptId, r.targetConceptId));
  
  dagre.layout(g);
  
  return concepts.map(c => ({
    ...c,
    position: { x: g.node(c.id).x, y: g.node(c.id).y },
  }));
}
```

---

## 7. Provider 接口定义

### 7.1 LLM Provider

```typescript
// src/services/llm/LLMProvider.ts

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface LLMProvider {
  readonly name: string;
  
  configure(config: LLMProviderConfig): void;
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<LLMChunk>;
  validate(): Promise<boolean>;
}

// Provider Factory
export function createLLMProvider(type: 'openai' | 'anthropic' | 'mock'): LLMProvider {
  switch (type) {
    case 'openai': return new OpenAIProvider();
    case 'anthropic': return new AnthropicProvider();
    case 'mock': return new MockProvider();
  }
}
```

### 7.2 Storage Provider

```typescript
// src/services/persistence/StorageProvider.ts

export interface StorageProvider {
  // Projects
  listProjects(): Promise<MiningProject[]>;
  getProject(id: string): Promise<MiningProject | undefined>;
  saveProject(project: MiningProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
  
  // Steps
  getSteps(projectId: string, phase?: MiningPhase): Promise<StepSnapshot[]>;
  getActiveSteps(projectId: string): Promise<StepSnapshot[]>;
  saveStep(step: StepSnapshot): Promise<void>;
  
  // Ontology elements
  getConcepts(projectId: string): Promise<OntologyConcept[]>;
  saveConcepts(concepts: OntologyConcept[]): Promise<void>;
  getRelations(projectId: string): Promise<OntologyRelation[]>;
  saveRelations(relations: OntologyRelation[]): Promise<void>;
  getWorkflows(projectId: string): Promise<Workflow[]>;
  saveWorkflows(workflows: Workflow[]): Promise<void>;
  
  // Bulk operations
  exportProject(projectId: string): Promise<ProjectExportData>;
  importProject(data: ProjectExportData): Promise<string>;
  clearAll(): Promise<void>;
}

// Default implementation: DexieStorageProvider
```

### 7.3 Export Provider

```typescript
// src/services/export/ExportProvider.ts

export interface ExportProvider {
  readonly format: ExportFormat;
  readonly fileExtension: string;
  readonly mimeType: string;
  
  export(graph: OntologyGraph, project: MiningProject): ExportedFile;
}

// Implementations:
// - JsonExporter → .json (完整数据，可重新导入)
// - MarkdownExporter → .md (人类可读文档)
// - JsonLdExporter → .jsonld (语义网标准)
// - CsvExporter → .zip (多个 CSV 文件)
// - MermaidExporter → .md (Mermaid 图表代码)
```

---

## 8. 状态管理设计（Zustand）

### 8.1 Mining Store（核心状态）

```typescript
// src/stores/useMiningStore.ts

interface MiningState {
  // 当前项目上下文
  currentProject: MiningProject | null;
  currentPhase: MiningPhase;
  
  // 各阶段数据
  domainDescription: string;
  competencyQuestions: CompetencyQuestion[];
  selectedCQIds: string[];
  expandedCQs: ExpandedCQ[];
  
  // 本体数据
  concepts: OntologyConcept[];
  relations: OntologyRelation[];
  workflows: Workflow[];
  
  // 版本管理
  steps: StepSnapshot[];
  activeStepIds: string[];
  
  // UI 状态
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  
  // Actions
  loadProject: (projectId: string) => Promise<void>;
  setDomainDescription: (desc: string) => void;
  generateCQs: () => Promise<void>;
  selectCQs: (ids: string[]) => void;
  expandCQs: () => Promise<void>;
  confirmExpansion: (cqId: string, confirmed: boolean) => void;
  extractOntology: () => Promise<void>;
  drillDown: (conceptId: string) => Promise<void>;
  extractWorkflows: () => Promise<void>;
  inferRelations: () => Promise<void>;
  
  // Navigation
  advancePhase: () => void;
  backtrackToPhase: (phase: MiningPhase) => Promise<void>;
  
  // Editing
  addConcept: (concept: Partial<OntologyConcept>) => void;
  updateConcept: (id: string, updates: Partial<OntologyConcept>) => void;
  deleteConcept: (id: string, cascade: boolean) => void;
  addRelation: (relation: Partial<OntologyRelation>) => void;
  updateRelation: (id: string, updates: Partial<OntologyRelation>) => void;
  deleteRelation: (id: string) => void;
}
```

### 8.2 自动保存 Middleware

```typescript
// Zustand middleware for auto-save
const autoSaveMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      set(...args);
      // Debounced save to IndexedDB
      debouncedSave(get());
    },
    get,
    api
  );

const debouncedSave = debounce(async (state: MiningState) => {
  if (!state.currentProject) return;
  await db.transaction('rw', [db.projects, db.concepts, db.relations, db.workflows], async () => {
    await db.projects.put(state.currentProject!);
    await db.concepts.where('projectId').equals(state.currentProject!.id).delete();
    await db.concepts.bulkPut(state.concepts);
    // ... same for relations, workflows
  });
}, 500);
```
