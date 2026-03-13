# Ontology Miner v2 — 任务分解

## 任务总览

共 6 个 Epic，分解为若干 Task。建议按 Epic 顺序实现（后续 Epic 依赖前序）。

| Epic | 描述 | 估算 | 优先级 |
|---|---|---|---|
| E1 | 增加迭代深度和广度 | 3-4h | P0 |
| E2 | 多源数据输入 | 8-10h | P0 |
| E3 | 自动模式 | 6-8h | P0 |
| E4 | 标注验证系统 | 12-16h | P1 |
| E5 | 多 Agent 辩论 | 10-14h | P1 |
| E6 | 多种图可视化 | 10-12h | P1 |

**总估算：49-64 小时**

---

## Epic 1: 增加迭代深度和广度 (P0)

### Task 1.1: 扩展类型定义
**文件**: `src/types/ontology.ts`, `src/types/cq.ts`
**内容**:
- 扩展 `OntologyProperty` 添加 `constraints`, `exampleValues` (string[]), 扩展 `dataType` 枚举增加 `money`, `percentage`, `duration`, `geo`
- 扩展 `OntologyRelation` 添加 `confidence` (number), `inferenceType` ('direct'|'indirect'|'inherited'|'composed'), `inferenceChain` (string[]), `evidence` (string)
- 扩展 `CompetencyQuestion` 添加 `relevanceScore` (number), `dependsOnCQs` (number[]), 扩展 `category` 增加 `temporal`, `quality`
- 扩展 `OntologyConcept` 添加 `confidence` (number), `source` 字段
**估算**: 1h

### Task 1.2: 更新 LLM Prompts
**文件**: `src/services/mining/prompts-v2.ts` (新建)
**内容**:
- 实现 `CQ_GENERATION_V2_SYSTEM` 和 `CQ_GENERATION_V2_USER` — 支持 15-20 个 CQ，7 个分类，含 relevanceScore
- 实现 `ONTOLOGY_EXTRACTION_V2_SYSTEM` 和 `ONTOLOGY_EXTRACTION_V2_USER` — 10-20 概念，详细属性
- 实现 `RELATION_INFERENCE_V2` — 间接关系、继承、组合推演
- 更新 `ONTOLOGY_DRILL_DOWN` — 每层生成更多子概念和关系
- 所有 prompt 支持 `dataSourceContext` 参数注入
**估算**: 2h
**依赖**: Task 1.1

### Task 1.3: 更新 LLM 输出解析器
**文件**: `src/services/mining/parsers.ts`
**内容**:
- 更新 CQ 解析器支持新字段 (relevanceScore, dependsOnCQs)
- 更新本体提取解析器支持 confidence, inferenceType, evidence
- 更新关系解析器支持扩展的 relationType 枚举
- 添加解析失败的容错处理（字段缺失时使用默认值）
**估算**: 1h
**依赖**: Task 1.2

### Task 1.4: 更新设置 UI
**文件**: `src/pages/SettingsPage.tsx`
**内容**:
- CQ Count 范围改为 10-25，默认 15
- 添加 CQ 分类说明提示
**估算**: 0.5h

---

## Epic 2: 多源数据输入 (P0)

### Task 2.1: 数据源类型定义
**文件**: `src/types/datasource.ts` (新建)
**内容**:
- 定义 `SourceType`, `DataSource`, `ParsedContent` 接口（见 design.md §3.2）
- 定义 `DataSourceStore` 接口
**估算**: 0.5h

### Task 2.2: 数据源 Store
**文件**: `src/stores/useDataSourceStore.ts` (新建)
**内容**:
- Zustand store: `dataSources`, `addDataSource`, `removeDataSource`, `updateDataSource`, `toggleActive`, `getActiveSourcesContext`
- 持久化中间件连接 Dexie
**估算**: 1h
**依赖**: Task 2.1

### Task 2.3: IndexedDB v2 迁移
**文件**: `src/services/persistence/db-v2.ts` (新建或修改 db.ts)
**内容**:
- 添加 `dataSources` 表，索引: `id, projectId, type, [projectId+type]`
- 后续 Task 4/5 的表也在此定义（debateRecords, validationQuestions, annotationResults, expertProfiles）
- 实现 v1→v2 数据迁移（Dexie version upgrade）
**估算**: 1h

### Task 2.4: PDF 解析器
**文件**: `src/services/datasource/PDFParser.ts` (新建)
**内容**:
- 安装 `pdfjs-dist`，配置 Web Worker
- 实现 `parsePDF(file: File): Promise<DataSource>` — 逐页提取文本，合并段落
- 处理大文件（> 50MB 拒绝）
- 错误处理：加密 PDF、损坏文件
**估算**: 2h

### Task 2.5: Excel/CSV 解析器
**文件**: `src/services/datasource/ExcelParser.ts`, `CSVParser.ts` (新建)
**内容**:
- 安装 `xlsx`, `papaparse`
- ExcelParser: 解析所有 sheet，识别表头行，构建 structured content
- CSVParser: 自动检测分隔符/编码，解析为表格
- 文件大小限制检查
**估算**: 1.5h

### Task 2.6: URL 抓取器
**文件**: `src/services/datasource/URLFetcher.ts`, `src/lib/cors-proxy.ts` (新建)
**内容**:
- 安装 `@mozilla/readability`
- 实现 CORS proxy 调用（默认 allorigins.win）
- 用 DOMParser 解析 HTML，Readability 提取正文
- 支持自定义 proxy URL
- 超时处理（10s）
- 批量抓取（Promise.allSettled）
**估算**: 2h

### Task 2.7: Markdown 解析器 + 图片分析器
**文件**: `src/services/datasource/MarkdownParser.ts`, `ImageAnalyzer.ts` (新建)
**内容**:
- MarkdownParser: 读取文本，用 `marked` 解析为 AST 提取标题/段落结构
- ImageAnalyzer: File → base64，调用 LLM Vision API，保存描述文本
- LLMProvider 扩展：`supportsVision()`, `completeWithImages()`
**估算**: 1.5h

### Task 2.8: 数据源协调服务
**文件**: `src/services/datasource/DataSourceService.ts` (新建)
**内容**:
- 统一入口：`fetchURLs()`, `parseFile()`, `analyzeImage()`
- `buildContextFromSources()` — 将所有活跃数据源组装为 LLM 上下文字符串
- 文件类型自动检测
**估算**: 1h
**依赖**: Task 2.4, 2.5, 2.6, 2.7

### Task 2.9: 数据源 UI 组件
**文件**: `src/components/mining/DataSourcePanel.tsx`, `DataSourceUpload.tsx`, `DataSourcePreview.tsx` (新建)
**内容**:
- DataSourcePanel: 数据源列表，显示名称/类型/状态/标签
- DataSourceUpload: 拖拽上传 + URL 输入框
- DataSourcePreview: PDF→文本预览，Excel→表格预览，URL→正文预览
- 标签编辑（inline tag editor）
- 激活/停用切换
**估算**: 2h
**依赖**: Task 2.8

### Task 2.10: Mining Engine 集成数据源
**文件**: `src/services/mining/MiningEngine.ts`
**内容**:
- 在每个步骤的 LLM 调用中注入 `dataSourceContext`
- 使用 `DataSourceService.buildContextFromSources()` 构建上下文
- 处理上下文过长时的截断策略（按优先级截断）
**估算**: 1h
**依赖**: Task 2.8, 1.2

---

## Epic 3: 自动模式 (P0)

### Task 3.1: 自动模式引擎
**文件**: `src/services/mining/AutoModeEngine.ts` (新建)
**内容**:
- 实现 `AutoModeEngine` 类（见 design.md §5.6）
- 步骤列表构建：CQ展开→本体提取→深入推演→工作流→关系推演→生成验证问题
- `run()`, `pause()`, `resume()`, `cancel()` 方法
- 每步完成后自动保存
- 错误处理：重试/跳过/停止
- 连续 3 次失败自动切换 Manual 模式
**估算**: 3h
**依赖**: Task 1.2

### Task 3.2: 自动模式 Store + Hook
**文件**: `src/stores/useMiningStore.ts` (修改), `src/hooks/useAutoMode.ts` (新建)
**内容**:
- Store 添加: `mode: 'auto'|'manual'`, `autoProgress: AutoModeProgress`, `isAutoRunning`, `isPaused`
- Hook: `useAutoMode()` — 封装 AutoModeEngine 的调用，管理进度更新
- 模式切换逻辑（运行中切换的处理）
**估算**: 1.5h
**依赖**: Task 3.1

### Task 3.3: 模式切换 UI
**文件**: `src/components/mining/ModeToggle.tsx` (新建)
**内容**:
- Auto/Manual 切换按钮（带图标：⚡/🖐）
- 切换确认对话框（Auto→Manual: "将暂停自动流程"; Manual→Auto: "将跳过剩余确认步骤"）
**估算**: 0.5h

### Task 3.4: 自动模式进度面板
**文件**: `src/components/mining/AutoModeProgress.tsx` (新建)
**内容**:
- 总进度条（百分比 + 动画）
- 当前步骤名称和描述
- 流式输出展示区（LLM 正在生成的内容）
- 已完成步骤摘要（概念数、关系数）
- 预估剩余时间
- 暂停/继续/取消按钮
- 辩论轮次指示（如果开启辩论）
**估算**: 2h
**依赖**: Task 3.2

### Task 3.5: MiningWorkspacePage 集成
**文件**: `src/pages/MiningWorkspacePage.tsx`
**内容**:
- 工具栏添加 ModeToggle
- Auto 模式下显示 AutoModeProgress 替代手动步骤面板
- Auto 模式完成后自动跳转到标注验证步骤
- Phase Progress Bar 在 Auto 模式下自动前进
**估算**: 1.5h
**依赖**: Task 3.3, 3.4

---

## Epic 4: 标注验证系统 (P1)

### Task 4.1: 标注类型定义
**文件**: `src/types/annotation.ts` (新建)
**内容**:
- 定义 `QuestionType`, `Difficulty`, `ExpertLevel` 枚举
- 定义 `ValidationQuestion`, `AnnotationResult`, `ExpertProfile`, `ConsensusResult`, `AnnotationReport` 接口（见 design.md §3.2）
**估算**: 1h

### Task 4.2: 验证问题生成器
**文件**: `src/services/annotation/ValidationGenerator.ts` (新建)
**内容**:
- 实现 `generateQuestions()` 方法（见 design.md §5.4）
- 判断题：每条关系 → 1 题
- 选择题：每对概念 → 1 题
- 排序题：每个 ontologyLayer → 1 题
- 补充题：每个工作流 → 1 题
- 难度评估逻辑
- 领域标签提取
- maxQuestions 截断
**估算**: 2h
**依赖**: Task 4.1

### Task 4.3: 标注 Store
**文件**: `src/stores/useAnnotationStore.ts` (新建)
**内容**:
- 管理: questions[], results[], experts[], currentQuestionIndex, consensusResults[]
- CRUD 操作
- 持久化到 Dexie
**估算**: 1h
**依赖**: Task 4.1

### Task 4.4: 共识度计算器
**文件**: `src/services/annotation/ConsensusCalculator.ts` (新建)
**内容**:
- 实现 `calculateConsensus()` — Boolean, MC, Ranking, OpenEnded
- 简单一致率计算
- 加权一致率（专家权重）
- Fleiss' Kappa 计算
- 共识判定（threshold 比较）
- 权重计算: levelWeight × domainWeight
**估算**: 2h
**依赖**: Task 4.1

### Task 4.5: 标注界面组件
**文件**: `src/components/annotation/QuestionCard.tsx`, `BooleanQuestion.tsx`, `MultipleChoiceQuestion.tsx`, `RankingQuestion.tsx`, `OpenEndedQuestion.tsx` (新建)
**内容**:
- QuestionCard: 一次展示一题，进度条，快捷键提示
- BooleanQuestion: 3 个大按钮（是/否/不确定），键盘 1/2/3
- MultipleChoiceQuestion: 单选按钮组 + "其他"输入
- RankingQuestion: 使用 `@dnd-kit/sortable` 拖拽排序
- OpenEndedQuestion: 多行文本框
- 所有组件: 备注框、下一题/上一题/跳过按钮
**估算**: 3h
**依赖**: Task 4.3

### Task 4.6: 标注工作区页面
**文件**: `src/components/annotation/AnnotationWorkspace.tsx`, `src/pages/AnnotationPage.tsx` (新建)
**内容**:
- AnnotationWorkspace: 包含 QuestionCard 和导航
- AnnotationPage: 可通过分享链接独立访问 (`/annotate/:sessionId`)
- 键盘快捷键绑定
- 预估完成时间计算
- 完成后显示感谢页面
**估算**: 2h
**依赖**: Task 4.5

### Task 4.7: 投票统计面板
**文件**: `src/components/annotation/VotingStats.tsx`, `ConsensusReport.tsx` (新建)
**内容**:
- VotingStats: 每题的回答分布（Recharts 柱状图/饼图）
- 共识度指标显示（simple, weighted, kappa）
- 共识/争议标记
- 排序题显示加权平均排名
- ConsensusReport: 总览统计、按类型/难度分析、专家表现
**估算**: 2h
**依赖**: Task 4.4

### Task 4.8: 专家画像管理
**文件**: `src/components/annotation/ExpertProfileEditor.tsx`, `src/services/annotation/ExpertMatcher.ts` (新建)
**内容**:
- ExpertProfileEditor: 表单（姓名、邮箱、领域多选、经验年限、级别）
- ExpertMatcher: 问题-专家匹配（领域匹配 + 难度匹配）
- 权重计算和显示
- Settings 页面集成专家列表
**估算**: 1.5h

### Task 4.9: 分享机制（方案 A — 文件导入导出）
**文件**: `src/services/sharing/FileShareAdapter.ts` (新建)
**内容**:
- 导出验证问卷 JSON（不含答案）
- 导出标注结果 JSON
- 导入标注结果并合并
- 多人结果合并逻辑
**估算**: 1.5h

### Task 4.10: 分享机制（方案 B — Firebase，可选）
**文件**: `src/services/sharing/FirebaseShareAdapter.ts` (新建)
**内容**:
- Firebase Realtime DB 配置
- 创建分享 session（唯一 URL）
- 实时同步标注结果
- 实时投票统计更新
- Firebase 安全规则建议
**估算**: 2h

### Task 4.11: 反馈循环
**文件**: `src/services/annotation/FeedbackLoop.ts` (新建)
**内容**:
- 共识→本体更新：判断题→移除/保留关系，选择题→更新关系类型，排序题→更新 importance
- 争议处理：标记为 disputed，高亮显示
- 补充题→触发局部重新挖掘
- 更新 annotationStatus 字段
- 生成修改记录 (before/after diff)
**估算**: 2h
**依赖**: Task 4.4

---

## Epic 5: 多 Agent 辩论 (P1)

### Task 5.1: 辩论类型定义
**文件**: `src/types/debate.ts` (新建)
**内容**:
- 定义 `DebateConfig`, `AgentRoleConfig`, `DebateRecord`, `DebateRound`, `DebateChallenge`, `DebateChallengeResponse`, `DebateVerdict` 接口（见 design.md §3.2）
- 定义辩论状态枚举
**估算**: 0.5h

### Task 5.2: 辩论 Prompt 模板
**文件**: `src/services/debate/DebatePrompts.ts` (新建)
**内容**:
- `CHALLENGER_SYSTEM` + `CHALLENGER_USER` — 审查 prompt（见 design.md §5.3）
- `DEFENDER_SYSTEM` + `DEFENDER_USER` — 回应 prompt
- `JUDGE_SYSTEM` + `JUDGE_USER` — 裁判 prompt
- 所有 prompt 支持数据源上下文注入
- 本体提取、深入推演、关系推演各步骤的 prompt 变体
**估算**: 2h

### Task 5.3: 辩论状态机引擎
**文件**: `src/services/debate/DebateEngine.ts` (新建)
**内容**:
- 安装 `xstate`
- 实现 XState 状态机: idle → proposing → challenging → defending → (loop) → judging → complete
- `runDebate()` 方法: 接收 step、context、config，执行完整辩论
- 流式进度回调 `onProgress(DebateProgressEvent)`
- 每轮结果保存到 DebateRecord
- 错误处理和重试
**估算**: 3h
**依赖**: Task 5.1, 5.2

### Task 5.4: 辩论 Store + Hook
**文件**: `src/stores/useDebateStore.ts` (新建), `src/hooks/useDebate.ts` (新建)
**内容**:
- Store: currentDebate, debateHistory[], isDebating, debateProgress
- Hook: `useDebate()` — 封装 DebateEngine，提供 React-friendly API
- 辩论记录持久化到 Dexie
**估算**: 1.5h
**依赖**: Task 5.3

### Task 5.5: Mining Engine 集成辩论
**文件**: `src/services/mining/MiningEngine.ts`
**内容**:
- 在 ontologyExtraction、drillDown、relationInference 步骤检查 debateConfig
- 如果辩论启用，调用 DebateEngine 替代直接 LLM 调用
- 辩论结果（Judge 的 finalResult）作为该步骤的输出
- 自动模式下的辩论进度集成
**估算**: 2h
**依赖**: Task 5.3, 3.1

### Task 5.6: 辩论面板 UI
**文件**: `src/components/debate/DebatePanel.tsx`, `DebateMessage.tsx`, `DebateProgress.tsx`, `ConsensusIndicator.tsx` (新建)
**内容**:
- DebatePanel: 可折叠右侧/底部面板，聊天记录风格
- DebateMessage: 单条消息（角色颜色：蓝/红/金，头像，模型名，时间戳，token 消耗）
- 消息可展开/折叠
- 流式渲染（辩论进行时实时显示）
- ConsensusIndicator: 🟢共识 🟡辩论后 🔴未解决
- 全屏查看模式
**估算**: 3h
**依赖**: Task 5.4

### Task 5.7: 辩论配置 UI
**文件**: `src/components/debate/DebateConfig.tsx` (新建)
**内容**:
- 辩论开关
- 预设模板选择（快速/标准/深度/自定义）
- 三个角色的 Provider + Model + Temperature 配置
- 辩论轮数滑块
- 步骤选择（哪些步骤启用辩论）
- 集成到 Settings 页面
**估算**: 1.5h

### Task 5.8: 多 Provider 支持增强
**文件**: `src/services/llm/OpenAIProvider.ts`, `AnthropicProvider.ts`
**内容**:
- 添加 `supportsVision()` 方法
- 添加 `completeWithImages()` 方法
- 支持为辩论角色使用不同 API Key
- 确保两个 Provider 可以同时活跃（辩论时 Proposer 用 OpenAI，Challenger 用 Anthropic）
**估算**: 1.5h

---

## Epic 6: 多种图可视化 (P1)

### Task 6.1: 可视化类型定义和 Store
**文件**: `src/types/visualization.ts` (新建), `src/stores/useVisualizationStore.ts` (新建)
**内容**:
- 定义 `GraphType` 枚举和 `VisualizationState` 接口（见 design.md §3.2）
- Store: activeGraphType, 各图类型的设置, selectedConceptId, highlightedConceptIds
- 跨图联动逻辑（选中一个图的元素 → 其他图高亮）
**估算**: 1h

### Task 6.2: 图类型选择器
**文件**: `src/components/graph/GraphTypeSelector.tsx` (新建)
**内容**:
- Tab 栏: 知识图谱 | 属性图 | 层级树 | 关系矩阵 | 时序流程 | 统计
- 每个 Tab 带图标
- 当前 Tab 高亮
- 全屏按钮
- 导出按钮（PNG/SVG）
**估算**: 1h

### Task 6.3: 知识图谱视图增强
**文件**: `src/components/graph/OntologyGraph.tsx` (修改)
**内容**:
- 节点大小按连接度缩放
- 边粗细按置信度缩放
- 双击展开/折叠子概念
- 搜索框快速定位
- 布局切换（力导向/dagre/径向）
- 按 ontologyLayer 过滤
- 框选支持
**估算**: 2h

### Task 6.4: 属性图视图
**文件**: `src/components/graph/PropertyGraphNode.tsx` (新建)
**内容**:
- React Flow 自定义节点: 卡片式，显示属性列表（名称|类型|必填标记）
- 点击打开侧边属性详情抽屉
- 关系数量徽章
- 边显示关系名称和基数
- 按 layer 过滤
**估算**: 2h

### Task 6.5: 层级树状图
**文件**: `src/components/graph/HierarchyTreeView.tsx` (新建)
**内容**:
- 安装/使用 `d3-hierarchy`
- 从本体数据构建树结构（只用 is_a, part_of, composed_of 关系）
- SVG 渲染: 节点 + 连线
- 可折叠/展开
- 颜色按 layer
- 方向切换（左→右 / 上→下）
- 搜索
- 深度标注
**估算**: 2h

### Task 6.6: 关系矩阵/热力图
**文件**: `src/components/graph/RelationMatrix.tsx` (新建)
**内容**:
- D3.js SVG 渲染
- 行/列 = 概念名称
- 颜色映射: 无关系→空白, 弱(0.25)→浅色, 中(0.5)→中色, 强(1.0)→深色
- 直接/间接关系强度计算
- Hover tooltip 显示关系详情
- 点击跳转到知识图谱对应边
- 排序模式（名称/关系数/聚类）
- 滚动/缩放（概念 > 30 个时）
**估算**: 2h

### Task 6.7: 时序流程图
**文件**: `src/components/graph/WorkflowDiagram.tsx` (新建)
**内容**:
- React Flow + dagre 布局
- 步骤节点: 名称 + 执行者
- 箭头 = 执行顺序
- 菱形决策节点（条件分支）
- 并行步骤并排
- 点击步骤 → 详情面板
- 颜色按执行者角色
- 多工作流 Tab 切换
**估算**: 2h

### Task 6.8: 统计仪表盘
**文件**: `src/components/graph/StatsDashboard.tsx` (新建)
**内容**:
- Recharts 实现
- 指标卡片: 概念数、关系数、工作流数、最大深度、平均属性数
- 饼图: 概念按 layer 分布
- 柱状图: 关系按类型分布
- 覆盖度指标: CQ 覆盖率、属性完备性、关系密度
- 辩论指标（条件显示）: 共识率、修改率
- 标注指标（条件显示）: 参与率、共识度
**估算**: 2h

### Task 6.9: 图片导出
**文件**: `src/hooks/useGraphExport.ts`, `src/services/export/PNGExporter.ts`, `SVGExporter.ts` (新建)
**内容**:
- 安装 `html2canvas`
- PNG 导出: html2canvas 截取图谱容器
- SVG 导出: 序列化 SVG DOM 元素
- 导出当前视口 vs 完整图谱选项
- 下载触发
**估算**: 1h

### Task 6.10: 跨图联动
**文件**: `src/components/graph/` (多文件修改)
**内容**:
- 在任何图中选中元素 → 更新 Zustand store 的 selectedConceptId
- 其他图组件 watch selectedConceptId → 高亮对应元素
- 全屏模式切换
- 图谱设置面板（节点大小、边粗细、标签显隐、颜色主题）
**估算**: 1h
**依赖**: Task 6.3-6.8

---

## 实施顺序建议

```
Phase 1 (基础 — 必须先做):
  E1 (深度广度) ──→ E2 (数据源) ──→ E3 (自动模式)
  
Phase 2 (高级功能 — 可并行):
  E5 (辩论) ───→ 集成到 E3 的自动模式
  E4 (标注) ───→ 集成到挖掘流程末端
  E6 (可视化) ──→ 独立实现，最后集成

推荐开发路径:
  1. E1 (1.1→1.2→1.3→1.4)
  2. E2 (2.1→2.2→2.3→2.4/2.5/2.6/2.7并行→2.8→2.9→2.10)
  3. E3 (3.1→3.2→3.3/3.4并行→3.5)
  4. E5 (5.1→5.2→5.3→5.4→5.5→5.6/5.7并行→5.8)
  5. E4 (4.1→4.2/4.3并行→4.4→4.5→4.6→4.7→4.8→4.9→4.10→4.11)
  6. E6 (6.1→6.2→6.3/6.4/6.5/6.6/6.7/6.8并行→6.9→6.10)
```

---

## 质量检查清单

### 每个 Task 完成后
- [ ] TypeScript 类型无 any（除 LLM 输出的临时类型）
- [ ] 新增功能有对应的 Zustand store 或 hook
- [ ] IndexedDB 持久化正常（刷新页面不丢数据）
- [ ] 组件支持 loading/error/empty 状态
- [ ] 键盘快捷键（如有）正常工作

### 每个 Epic 完成后
- [ ] 与前序 Epic 集成测试
- [ ] 自动模式下该功能正常工作
- [ ] Mock Provider 下可演示
- [ ] 无 console 错误
- [ ] 性能指标达标（见 requirements.md §4.1）
