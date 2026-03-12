# Ontology Miner — Domain Analysis

## 1. 领域概述

### 1.1 本体论（Ontology）基础

本体论在知识工程中是对某个领域内概念及其关系的形式化、显式化描述。一个本体包含：

- **概念（Concepts/Classes）**：领域中的核心实体类型
- **属性（Properties/Attributes）**：描述概念特征的数据项
- **关系（Relations/Links）**：概念之间的语义连接
- **实例（Instances）**：具体的对象
- **公理（Axioms）**：约束和规则

### 1.2 本体层次结构

```
Upper Ontology（上层本体）
  ├── 通用概念：时间、空间、事件、Agent、过程
  └── 示例：BFO, DOLCE, SUMO

Domain Ontology（领域本体）
  ├── 特定领域的概念体系
  └── 示例：物流领域 → 货物、仓库、运输、订单

Task Ontology（任务本体）
  ├── 解决特定任务需要的知识结构
  └── 示例：订单履约任务 → 拣货、打包、发货

Application Ontology（应用本体）
  ├── 面向具体应用的本体
  └── 示例：WMS系统本体 → 库位、SKU、入库单、出库单
```

### 1.3 Palantir Foundry Ontology 的映射

| Foundry 概念 | Ontology Miner 对应 | 说明 |
|---|---|---|
| Object Type | OntologyConcept | 领域中的实体类型 |
| Property | ConceptProperty | 概念的属性 |
| Link Type | OntologyRelation | 概念间的关系 |
| Action | WorkflowStep | 对本体的操作/业务动作 |
| Semantic Layer | 概念模型层 | 定义本体结构 |
| Kinetic Layer | 数据映射层 | 本体到实际数据的连接（未来功能） |
| Dynamic Layer | 应用交互层 | 基于本体的应用（Agent Factory） |

### 1.4 Competency Questions (CQ) 方法论

CQ 是本体工程的核心驱动方法，源自 METHONTOLOGY 和 NeOn 方法论：

**CQ 的分类（NeOn）**：
- **SCQ（Scoping CQ）**：界定本体范围
- **VCQ（Validating CQ）**：验证本体完备性
- **FCQ（Foundational CQ）**：定义基础概念
- **RCQ（Relationship CQ）**：发现关系
- **MpCQ（Metaproperty CQ）**：定义元属性

**CQ 驱动的开发流程**：
1. 从领域描述生成初始 CQ
2. 通过 CQ 识别核心概念（名词提取）
3. 通过 CQ 发现关系（动词/介词提取）
4. 通过 CQ 验证本体完备性
5. 迭代细化直到 CQ 都能被回答

---

## 2. 知识挖掘流程状态机

### 2.1 主状态机

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mining Session FSM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [INIT] ──→ [DOMAIN_INPUT] ──→ [CQ_GENERATION] ──→            │
│                                                                 │
│  [CQ_SELECTION] ──→ [CQ_EXPANSION] ──→ [CQ_CONFIRMATION] ──→  │
│                                                                 │
│  [ONTOLOGY_EXTRACTION] ──→ [ONTOLOGY_REFINEMENT] ──→           │
│                                                                 │
│  [WORKFLOW_EXTRACTION] ──→ [RELATION_MAPPING] ──→              │
│                                                                 │
│  [REVIEW] ──→ [EXPORT]                                         │
│                                                                 │
│  任意状态 ←─── [BACKTRACK] ───→ 任意前置状态                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 状态详细定义

```typescript
enum MiningPhase {
  // 阶段 1：领域定义
  DOMAIN_INPUT = 'domain_input',           // 用户输入领域/问题描述
  
  // 阶段 2：CQ 驱动的需求发现
  CQ_GENERATION = 'cq_generation',         // LLM 生成 CQ 列表
  CQ_SELECTION = 'cq_selection',           // 用户选择核心 CQ
  CQ_EXPANSION = 'cq_expansion',           // LLM 展开选中的 CQ
  CQ_CONFIRMATION = 'cq_confirmation',     // 用户确认展开内容
  
  // 阶段 3：本体构建
  ONTOLOGY_EXTRACTION = 'ontology_extraction',   // LLM 提取顶层本体
  ONTOLOGY_REFINEMENT = 'ontology_refinement',   // 逐层深入业务本体
  
  // 阶段 4：流程与关系
  WORKFLOW_EXTRACTION = 'workflow_extraction',    // 提取业务工作流
  RELATION_MAPPING = 'relation_mapping',         // 推演本体关系
  
  // 阶段 5：审查与导出
  REVIEW = 'review',                       // 整体审查
  EXPORT = 'export',                       // 导出知识库
}
```

### 2.3 状态转换规则

```typescript
interface StateTransition {
  from: MiningPhase;
  to: MiningPhase;
  trigger: 'user_confirm' | 'user_edit' | 'user_backtrack' | 'auto' | 'llm_complete';
  guard?: (context: MiningContext) => boolean;
}

const transitions: StateTransition[] = [
  // 正向流程
  { from: 'domain_input', to: 'cq_generation', trigger: 'user_confirm' },
  { from: 'cq_generation', to: 'cq_selection', trigger: 'llm_complete' },
  { from: 'cq_selection', to: 'cq_expansion', trigger: 'user_confirm',
    guard: (ctx) => ctx.selectedCQs.length > 0 },
  { from: 'cq_expansion', to: 'cq_confirmation', trigger: 'llm_complete' },
  { from: 'cq_confirmation', to: 'ontology_extraction', trigger: 'user_confirm' },
  { from: 'ontology_extraction', to: 'ontology_refinement', trigger: 'llm_complete' },
  { from: 'ontology_refinement', to: 'ontology_refinement', trigger: 'user_confirm',
    guard: (ctx) => ctx.canDrillDeeper() },  // 递归深入
  { from: 'ontology_refinement', to: 'workflow_extraction', trigger: 'user_confirm',
    guard: (ctx) => !ctx.canDrillDeeper() || ctx.userStopsDeepening },
  { from: 'workflow_extraction', to: 'relation_mapping', trigger: 'llm_complete' },
  { from: 'relation_mapping', to: 'review', trigger: 'user_confirm' },
  { from: 'review', to: 'export', trigger: 'user_confirm' },
  
  // 回溯（任意状态可回溯到任意前置状态）
  { from: '*', to: '*', trigger: 'user_backtrack',
    guard: (ctx) => ctx.targetPhase < ctx.currentPhase },
    
  // 编辑后重新推演
  { from: '*', to: 'auto_next', trigger: 'user_edit' },
];
```

### 2.4 递归深入机制（Ontology Refinement）

本体细化是可无限递归的。每一层都是一个子状态机：

```
[选择要深入的概念] → [LLM 生成子概念] → [用户确认/修改] →
  ├── [继续深入] → 递归进入下一层
  └── [返回上层] → 回到父级概念
```

**深入策略**：
- 每个概念节点都有 `depth` 属性，记录当前层级
- 用户可以在图谱上点击任意节点进入深入
- 系统建议：当 LLM 生成的子概念少于 2 个时，建议停止深入
- 用户可随时停止深入，转入下一阶段

---

## 3. 本体元素数据结构

### 3.1 核心数据模型

```typescript
// ===============================
// 项目与会话
// ===============================

interface MiningProject {
  id: string;                          // UUID
  name: string;                        // 项目名称
  description: string;                 // 领域/问题描述
  createdAt: number;                   // 创建时间戳
  updatedAt: number;                   // 最后更新时间戳
  currentPhase: MiningPhase;           // 当前阶段
  currentStepId: string | null;        // 当前步骤 ID
  ontologyId: string;                  // 关联的本体 ID
  settings: ProjectSettings;           // 项目设置
}

interface ProjectSettings {
  llmProvider: 'openai' | 'anthropic' | 'mock';
  llmModel: string;
  language: 'zh' | 'en' | 'auto';     // 输出语言
  maxCQCount: number;                  // CQ 生成数量（默认 10）
  maxDepth: number;                    // 最大深入层数（默认 10，0=无限）
}

// ===============================
// 版本历史（快照树）
// ===============================

interface StepSnapshot {
  id: string;                          // 步骤 ID
  projectId: string;                   // 所属项目
  phase: MiningPhase;                  // 所属阶段
  parentStepId: string | null;         // 父步骤（形成树结构）
  createdAt: number;
  
  // 步骤内容（根据 phase 不同而不同）
  input: StepInput;                    // 本步骤的输入
  output: StepOutput;                  // 本步骤的输出（LLM 生成 + 用户修改后）
  llmRawOutput: string;                // LLM 原始输出（用于审计）
  userModifications: Modification[];   // 用户的修改记录
  
  // 分支管理
  isActive: boolean;                   // 是否为当前活跃分支
  branchLabel?: string;                // 分支标签（回溯时自动创建）
}

type StepInput = 
  | { type: 'domain_input'; description: string }
  | { type: 'cq_generation'; domainDescription: string }
  | { type: 'cq_selection'; cqs: CompetencyQuestion[] }
  | { type: 'cq_expansion'; selectedCQs: CompetencyQuestion[] }
  | { type: 'cq_confirmation'; expandedCQs: ExpandedCQ[] }
  | { type: 'ontology_extraction'; confirmedContent: ExpandedCQ[] }
  | { type: 'ontology_refinement'; parentConcept: OntologyConcept; depth: number }
  | { type: 'workflow_extraction'; concepts: OntologyConcept[]; relations: OntologyRelation[] }
  | { type: 'relation_mapping'; concepts: OntologyConcept[]; workflows: Workflow[] }
  | { type: 'review'; fullOntology: OntologyGraph }
  | { type: 'export'; fullOntology: OntologyGraph; format: ExportFormat };

type StepOutput =
  | { type: 'domain_input'; normalizedDescription: string; suggestedKeywords: string[] }
  | { type: 'cq_generation'; cqs: CompetencyQuestion[] }
  | { type: 'cq_selection'; selectedIds: string[] }
  | { type: 'cq_expansion'; expandedCQs: ExpandedCQ[] }
  | { type: 'cq_confirmation'; confirmedCQs: ExpandedCQ[] }
  | { type: 'ontology_extraction'; concepts: OntologyConcept[]; relations: OntologyRelation[] }
  | { type: 'ontology_refinement'; concepts: OntologyConcept[]; relations: OntologyRelation[] }
  | { type: 'workflow_extraction'; workflows: Workflow[] }
  | { type: 'relation_mapping'; relations: OntologyRelation[] }
  | { type: 'review'; approved: boolean; notes: string }
  | { type: 'export'; exportedFiles: ExportedFile[] };

interface Modification {
  timestamp: number;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason?: string;
}

// ===============================
// Competency Questions
// ===============================

interface CompetencyQuestion {
  id: string;
  text: string;                        // CQ 文本
  category: CQCategory;               // CQ 分类
  importance: 'high' | 'medium' | 'low';
  selected: boolean;                   // 是否被选中
  relatedConcepts: string[];           // 关联的概念名称（LLM 提取）
}

enum CQCategory {
  SCOPING = 'scoping',               // 范围界定
  FOUNDATIONAL = 'foundational',     // 基础概念
  RELATIONSHIP = 'relationship',     // 关系发现
  PROCESS = 'process',               // 流程相关
  CONSTRAINT = 'constraint',         // 约束规则
}

interface ExpandedCQ {
  cqId: string;                        // 原始 CQ ID
  originalText: string;                // 原始 CQ 文本
  expansion: string;                   // 展开的详细内容
  subQuestions: string[];              // 衍生的子问题
  extractedConcepts: string[];         // 从展开内容中提取的概念
  extractedRelations: string[];        // 从展开内容中提取的关系
  confirmed: boolean;
  userNotes: string;                   // 用户的补充说明
}

// ===============================
// 本体元素
// ===============================

interface OntologyConcept {
  id: string;
  name: string;                        // 概念名称
  description: string;                 // 概念描述
  aliases: string[];                   // 别名/同义词
  
  // 层级结构
  parentId: string | null;             // 父概念 ID（null = 顶层）
  depth: number;                       // 层级深度（0 = 顶层）
  ontologyLayer: OntologyLayer;        // 所属本体层
  
  // 属性
  properties: ConceptProperty[];       // 概念的属性列表
  
  // 来源追溯
  sourceCQIds: string[];               // 来源 CQ
  sourceStepIds: string[];             // 来源步骤
  
  // 状态
  status: 'generated' | 'confirmed' | 'modified' | 'deprecated';
  isExpanded: boolean;                 // 是否已深入展开
  
  // 位置（用于图可视化）
  position?: { x: number; y: number };
}

enum OntologyLayer {
  UPPER = 'upper',                     // 上层本体
  DOMAIN = 'domain',                   // 领域本体
  TASK = 'task',                       // 任务本体
  APPLICATION = 'application',         // 应用本体
}

interface ConceptProperty {
  id: string;
  name: string;                        // 属性名
  description: string;                 // 属性描述
  dataType: PropertyDataType;          // 数据类型
  isRequired: boolean;
  constraints?: string;                // 约束描述
  exampleValues?: string[];            // 示例值
}

type PropertyDataType = 
  | 'string' | 'number' | 'boolean' | 'date' | 'datetime'
  | 'enum' | 'reference' | 'list' | 'object';

interface OntologyRelation {
  id: string;
  name: string;                        // 关系名称（如"包含"、"依赖"、"触发"）
  description: string;
  
  sourceConceptId: string;             // 源概念
  targetConceptId: string;             // 目标概念
  
  cardinality: Cardinality;            // 基数
  relationType: RelationType;          // 关系类型
  
  // 关系属性
  properties: ConceptProperty[];       // 关系本身的属性
  
  // 来源追溯
  sourceCQIds: string[];
  sourceStepIds: string[];
  
  status: 'generated' | 'confirmed' | 'modified' | 'deprecated';
}

type Cardinality = '1:1' | '1:N' | 'N:1' | 'N:M';

enum RelationType {
  IS_A = 'is_a',                       // 继承/分类
  HAS_A = 'has_a',                     // 组合
  PART_OF = 'part_of',                 // 部分
  DEPENDS_ON = 'depends_on',           // 依赖
  TRIGGERS = 'triggers',              // 触发
  PRODUCES = 'produces',              // 产出
  CONSUMES = 'consumes',              // 消费
  ASSOCIATED_WITH = 'associated_with', // 关联
  CUSTOM = 'custom',                   // 自定义
}

// ===============================
// 工作流
// ===============================

interface Workflow {
  id: string;
  name: string;
  description: string;
  
  steps: WorkflowStep[];              // 步骤列表（有序）
  involvedConcepts: string[];          // 涉及的概念 ID
  
  sourceCQIds: string[];
  sourceStepIds: string[];
  status: 'generated' | 'confirmed' | 'modified';
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  order: number;
  
  actorConceptId: string | null;       // 执行者概念
  inputConceptIds: string[];           // 输入概念
  outputConceptIds: string[];          // 输出概念
  
  conditions?: string;                 // 前置条件
  rules?: string;                      // 业务规则
}

// ===============================
// 完整本体图谱
// ===============================

interface OntologyGraph {
  projectId: string;
  concepts: OntologyConcept[];
  relations: OntologyRelation[];
  workflows: Workflow[];
  
  // 统计
  stats: {
    totalConcepts: number;
    totalRelations: number;
    totalWorkflows: number;
    maxDepth: number;
    layerDistribution: Record<OntologyLayer, number>;
  };
}

// ===============================
// 导出
// ===============================

type ExportFormat = 'json' | 'markdown' | 'json-ld' | 'csv' | 'mermaid';

interface ExportedFile {
  filename: string;
  format: ExportFormat;
  content: string;
  size: number;
}
```

---

## 4. 业务流程图

### 4.1 端到端知识挖掘流程

```
用户                           系统                           LLM
 │                              │                              │
 │  1. 输入领域描述              │                              │
 │ ────────────────────────────→│                              │
 │                              │  2. 发送 CQ 生成 Prompt       │
 │                              │────────────────────────────→ │
 │                              │  3. 返回 10 个 CQ             │
 │                              │←──────────────────────────── │
 │  4. 展示 CQ 列表             │                              │
 │ ←────────────────────────────│                              │
 │                              │                              │
 │  5. 选择核心 CQ（勾选）       │                              │
 │ ────────────────────────────→│                              │
 │                              │  6. 发送 CQ 展开 Prompt       │
 │                              │────────────────────────────→ │
 │                              │  7. 返回展开内容               │
 │                              │←──────────────────────────── │
 │  8. 展示展开内容              │                              │
 │ ←────────────────────────────│                              │
 │                              │                              │
 │  9. 确认/修改展开内容         │                              │
 │ ────────────────────────────→│                              │
 │                              │  10. 发送本体提取 Prompt       │
 │                              │────────────────────────────→ │
 │                              │  11. 返回顶层本体               │
 │                              │←──────────────────────────── │
 │  12. 展示本体图谱             │                              │
 │ ←────────────────────────────│                              │
 │                              │                              │
 │  13. 选择要深入的概念          │                              │
 │ ────────────────────────────→│                              │
 │                              │  14. 发送深入 Prompt           │
 │                              │────────────────────────────→ │
 │                              │  15. 返回子概念和关系           │
 │                              │←──────────────────────────── │
 │  16. 展示更新的图谱           │                              │
 │ ←────────────────────────────│                              │
 │                              │                              │
 │  ... (重复 13-16 直到满意)    │                              │
 │                              │                              │
 │  17. 结束深入，进入工作流提取   │                              │
 │ ────────────────────────────→│                              │
 │                              │  18. 发送工作流提取 Prompt      │
 │                              │────────────────────────────→ │
 │                              │  19. 返回工作流列表             │
 │                              │←──────────────────────────── │
 │  20. 展示工作流               │                              │
 │ ←────────────────────────────│                              │
 │                              │                              │
 │  21. 确认工作流，进入关系推演   │                              │
 │ ────────────────────────────→│                              │
 │                              │  22. 发送关系推演 Prompt        │
 │                              │────────────────────────────→ │
 │                              │  23. 返回完整关系图             │
 │                              │←──────────────────────────── │
 │  24. 展示完整本体图谱          │                              │
 │ ←────────────────────────────│                              │
 │                              │                              │
 │  25. 审查 → 导出              │                              │
 │ ────────────────────────────→│                              │
 │  26. 下载文件                 │                              │
 │ ←────────────────────────────│                              │
```

### 4.2 回溯流程

```
当前状态：Ontology Refinement (Layer 3)

用户点击"回溯到 CQ Selection"
        │
        ▼
系统创建当前状态的分支快照
        │
        ▼
系统标记当前分支为 inactive
        │
        ▼
系统恢复目标步骤的状态
        │
        ▼
创建新的活跃分支
        │
        ▼
用户从 CQ Selection 重新开始
（下游所有步骤自动失效，需重新生成）
```

### 4.3 Agent Factory 集成流程（未来）

```
Ontology Miner 输出
        │
        ▼
JSON-LD / 自定义 JSON 格式的知识库
        │
        ├──→ Business Rules → Prompt 模板生成
        ├──→ API Spec → MCP/Webhook 定义
        ├──→ DB Structure → 数据模型
        └──→ Workflow → Agent 行为定义
                │
                ▼
        Agent Factory → AaaS
```
