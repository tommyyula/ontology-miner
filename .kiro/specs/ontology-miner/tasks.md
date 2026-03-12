# Ontology Miner — Implementation Tasks

## 实现策略

分 5 个阶段迭代交付，每个阶段都产出可运行的产品。总估计工时：**40-50 小时**（coding agent 执行时间）。

---

## Phase 1: 项目骨架与基础设施（8h）

### Task 1.1: 项目初始化
**完成标准**：`npm run dev` 能启动，显示空白页面
**复杂度**：低
**依赖**：无

- [ ] Vite + React + TypeScript 项目脚手架
- [ ] Tailwind CSS + shadcn/ui 配置
- [ ] React Router v7 路由配置
- [ ] 目录结构创建（按 design.md 的项目结构）
- [ ] ESLint + Prettier 配置

### Task 1.2: 类型定义
**完成标准**：所有 `src/types/*.ts` 文件完成，TypeScript 编译无错误
**复杂度**：低
**依赖**：1.1

- [ ] `project.ts` — MiningProject, ProjectSettings
- [ ] `ontology.ts` — OntologyConcept, OntologyRelation, ConceptProperty, OntologyLayer
- [ ] `mining.ts` — MiningPhase, StepSnapshot, StepInput, StepOutput, Modification
- [ ] `cq.ts` — CompetencyQuestion, CQCategory, ExpandedCQ
- [ ] `workflow.ts` — Workflow, WorkflowStep
- [ ] `llm.ts` — LLMProvider, LLMRequest, LLMResponse, LLMChunk
- [ ] `index.ts` — 统一导出

### Task 1.3: 数据库层
**完成标准**：Dexie DB 可用，CRUD 操作通过单元测试
**复杂度**：中
**依赖**：1.2

- [ ] Dexie 数据库定义（`db.ts`）
- [ ] 数据库迁移机制（`migrations.ts`）
- [ ] StorageProvider 接口定义
- [ ] DexieStorageProvider 实现
- [ ] 单元测试：CRUD 项目、概念、关系

### Task 1.4: LLM Provider 层
**完成标准**：Mock Provider 返回预设数据，OpenAI Provider 能调通 API
**复杂度**：中
**依赖**：1.2

- [ ] LLMProvider 接口定义
- [ ] MockProvider 实现（返回 `mock/*.json` 数据）
- [ ] OpenAIProvider 实现（`/v1/chat/completions`）
- [ ] AnthropicProvider 实现（`/v1/messages`）
- [ ] 流式响应支持（ReadableStream 解析）
- [ ] Provider 工厂函数
- [ ] 连接测试功能

### Task 1.5: Zustand Stores
**完成标准**：stores 初始化正常，基本的 get/set 操作工作
**复杂度**：中
**依赖**：1.3, 1.4

- [ ] useProjectStore — 项目列表管理
- [ ] useMiningStore — 挖掘状态机基础框架
- [ ] useSettingsStore — 设置管理
- [ ] 自动保存 middleware
- [ ] Store ↔ DB 同步逻辑

---

## Phase 2: 项目管理 + CQ 流程（10h）

### Task 2.1: 应用布局
**完成标准**：AppLayout 渲染，路由导航工作
**复杂度**：低
**依赖**：1.1

- [ ] AppLayout 组件（Header + Content area）
- [ ] Header 导航（返回、项目名、设置入口）
- [ ] SaveIndicator 组件

### Task 2.2: 项目列表页
**完成标准**：可创建、浏览、删除项目
**复杂度**：中
**依赖**：1.5, 2.1

- [ ] ProjectListPage 页面
- [ ] 项目卡片组件（名称、阶段、统计、时间）
- [ ] 新建项目对话框（名称 + 描述）
- [ ] 项目操作菜单（重命名、复制、删除）
- [ ] 空状态展示
- [ ] 导入项目功能（JSON 文件选择）

### Task 2.3: 设置页
**完成标准**：LLM Provider 可配置，API Key 可保存和测试
**复杂度**：低
**依赖**：1.4, 2.1

- [ ] SettingsPage 页面
- [ ] LLM Provider 选择（下拉框）
- [ ] Model 选择（动态根据 provider 变化）
- [ ] API Key 输入（密码框 + 显示/隐藏）
- [ ] 连接测试按钮
- [ ] Mining 默认设置（CQ 数量、最大深度、语言）
- [ ] 数据管理（导出全部、清除全部）

### Task 2.4: 挖掘工作台框架
**完成标准**：工作台页面渲染，PhaseProgress 步骤条工作
**复杂度**：中
**依赖**：2.1

- [ ] MiningWorkspacePage 页面框架
- [ ] PhaseProgress 步骤条组件（10 个阶段，可点击已完成阶段）
- [ ] 左侧 Phase Panel 框架
- [ ] 主内容区域（根据 phase 条件渲染）
- [ ] 底部图谱区域占位

### Task 2.5: Domain Input 组件
**完成标准**：用户可输入领域描述，点确认进入 CQ 生成
**复杂度**：低
**依赖**：2.4

- [ ] DomainInput 组件
- [ ] 多行文本框 + 字符计数
- [ ] 示例领域按钮（点击填入预设文本）
- [ ] 确认按钮（最少 20 字符才可用）
- [ ] 连接 useMiningStore.setDomainDescription

### Task 2.6: CQ 生成 + 选择
**完成标准**：LLM 生成 CQ 列表，用户可选择，支持流式显示
**复杂度**：高
**依赖**：1.4, 2.4

- [ ] Prompt 模板实现（`prompts.ts` — CQ_GENERATION）
- [ ] LLM 输出解析器（`parsers.ts` — parseCQResponse）
- [ ] CQList 组件（Checkbox 列表）
- [ ] CQ 分类标签样式（5 种颜色）
- [ ] 自定义 CQ 添加功能
- [ ] CQ 文本编辑功能
- [ ] 重新生成按钮
- [ ] Loading 状态 + StreamingText 组件
- [ ] 错误处理 + 重试

### Task 2.7: CQ 展开 + 确认
**完成标准**：选中 CQ 可展开为详细内容，用户可确认/编辑
**复杂度**：高
**依赖**：2.6

- [ ] Prompt 模板实现（CQ_EXPANSION）
- [ ] 输出解析器（parseExpansionResponse）
- [ ] CQExpansionCard 组件（展开内容卡片）
- [ ] 卡片操作：确认 ✓ / 编辑 ✎ / 拒绝 ✗
- [ ] 编辑模式（所有字段可修改）
- [ ] 用户补充说明文本框
- [ ] CQConfirmation 汇总面板
- [ ] 进度指示 "已确认 X/Y"

---

## Phase 3: 本体提取与图可视化（12h）

### Task 3.1: React Flow 集成
**完成标准**：空白 React Flow 画布渲染，支持缩放平移
**复杂度**：中
**依赖**：1.1

- [ ] 安装 `@xyflow/react` 和 `dagre`
- [ ] OntologyGraph 主组件
- [ ] React Flow Provider 配置
- [ ] 基础控件（缩放、适应、缩略图）
- [ ] 背景网格

### Task 3.2: 自定义节点和边
**完成标准**：概念节点和关系边正确渲染
**复杂度**：高
**依赖**：3.1

- [ ] ConceptNode 自定义节点
  - 颜色条（按 ontologyLayer）
  - 名称、描述（截断）
  - 属性数量、关系数量
  - 状态指示器（generated/confirmed/modified）
  - 操作按钮（Drill Down / Edit）
- [ ] RelationEdge 自定义边
  - 实线（confirmed）vs 虚线（generated）
  - 标签（关系名称 + 基数）
  - 不同 relationType 的箭头样式
- [ ] GraphLegend 图例组件
- [ ] GraphToolbar（布局、缩放、视图切换）

### Task 3.3: 自动布局引擎
**完成标准**：概念图谱自动按层次排列
**复杂度**：中
**依赖**：3.1

- [ ] dagre 集成
- [ ] 层次化布局（上层→领域→任务→应用，从上到下）
- [ ] useGraphLayout hook
- [ ] 布局动画过渡
- [ ] 手动拖拽后位置保存

### Task 3.4: 顶层本体提取
**完成标准**：LLM 从确认的 CQ 中提取本体，显示在图谱上
**复杂度**：高
**依赖**：2.7, 3.2

- [ ] Prompt 模板（ONTOLOGY_EXTRACTION）
- [ ] 输出解析器（parseOntologyResponse）
- [ ] OntologyExtraction 组件
- [ ] 提取结果同时显示为列表和图谱
- [ ] 用户可确认/修改每个概念和关系
- [ ] 概念名称去重和合并建议

### Task 3.5: 本体深入细化
**完成标准**：点击概念可深入生成子概念，支持多层
**复杂度**：高
**依赖**：3.4

- [ ] Prompt 模板（ONTOLOGY_DRILL_DOWN）
- [ ] 输出解析器（parseDrillDownResponse）
- [ ] OntologyRefinement 组件
- [ ] NodeDetailPanel（点击节点后的详情面板）
- [ ] "Drill Down" 交互流程
- [ ] 深度指示器
- [ ] LLM 停止建议处理
- [ ] 版本快照创建

### Task 3.6: 本体元素编辑
**完成标准**：可手动添加/编辑/删除概念、属性、关系
**复杂度**：中
**依赖**：3.4

- [ ] ConceptEditor 对话框（添加/编辑概念）
- [ ] PropertyEditor（管理概念属性）
- [ ] RelationEditor 对话框（添加/编辑关系）
- [ ] 右键上下文菜单
- [ ] 删除确认 + 级联选项
- [ ] 修改历史记录

---

## Phase 4: 工作流 + 关系 + 审查（8h）

### Task 4.1: 工作流提取
**完成标准**：LLM 从本体推演出工作流，显示为步骤列表
**复杂度**：中
**依赖**：3.5

- [ ] Prompt 模板（WORKFLOW_EXTRACTION）
- [ ] 输出解析器
- [ ] WorkflowExtraction 组件
- [ ] 工作流步骤列表视图
- [ ] 工作流简单流程图（使用 React Flow 的 step edge）
- [ ] WorkflowEditor（编辑步骤）

### Task 4.2: 关系推演
**完成标准**：LLM 推演出新关系，用虚线显示在图谱上
**复杂度**：中
**依赖**：4.1

- [ ] Prompt 模板（RELATION_INFERENCE）
- [ ] 输出解析器
- [ ] RelationMapping 组件
- [ ] 新关系高亮（虚线 + 不同颜色）
- [ ] 逐条确认/拒绝
- [ ] 推理说明展示

### Task 4.3: 审查面板
**完成标准**：完整的统计和完备性检查
**复杂度**：中
**依赖**：4.2

- [ ] ReviewPanel 组件
- [ ] 统计仪表板（概念数、关系数、工作流数、各层分布）
- [ ] Prompt 模板（COMPLETENESS_CHECK）
- [ ] 问题列表 + 严重性标记
- [ ] 一键修复建议
- [ ] 全图模式（可折叠层级）

---

## Phase 5: 导出 + 回溯 + 打磨（7h）

### Task 5.1: 导出功能
**完成标准**：支持 5 种格式导出
**复杂度**：中
**依赖**：4.3

- [ ] ExportPanel 组件
- [ ] JsonExporter（完整数据，可重新导入）
- [ ] MarkdownExporter（人类可读文档，含 Mermaid 图）
- [ ] JsonLdExporter（标准 JSON-LD 格式）
- [ ] CsvExporter（概念表 + 关系表 + 工作流表，打包 ZIP）
- [ ] MermaidExporter（Mermaid 语法图谱代码）
- [ ] 文件下载触发
- [ ] 导出范围选择

### Task 5.2: 回溯与版本管理
**完成标准**：点击进度条任意已完成阶段可回溯，分支管理工作
**复杂度**：高
**依赖**：Phase 2-4 全部完成

- [ ] 回溯触发逻辑（PhaseProgress 点击事件）
- [ ] 自动快照保存
- [ ] 分支创建和标记
- [ ] 下游阶段失效处理
- [ ] 分支切换面板
- [ ] 分支间差异提示

### Task 5.3: 键盘快捷键
**完成标准**：所有定义的快捷键工作
**复杂度**：低
**依赖**：Phase 2-4

- [ ] useKeyboardShortcuts hook
- [ ] Ctrl/Cmd + Enter → 确认进入下一步
- [ ] Ctrl/Cmd + Z / Shift+Z → 撤销/重做
- [ ] Ctrl/Cmd + E → 导出
- [ ] Ctrl/Cmd + S → 手动保存
- [ ] Esc → 关闭面板
- [ ] 快捷键提示 tooltip

### Task 5.4: 错误处理与 UX 打磨
**完成标准**：所有边缘情况有合理处理
**复杂度**：中
**依赖**：Phase 2-4

- [ ] LLM 错误（网络、429、API Key 无效）→ 友好提示 + 重试
- [ ] JSON 解析失败 → 降级为文本展示 + 手动修正
- [ ] IndexedDB 存储满 → 警告 + 清理建议
- [ ] 大图谱性能优化（节点虚拟化）
- [ ] 空状态图示
- [ ] Loading 骨架屏
- [ ] Toast 通知系统
- [ ] 暗色模式支持（可选）

### Task 5.5: Mock 数据 & Demo 模式
**完成标准**：MockProvider 提供完整的演示体验
**复杂度**：低
**依赖**：Phase 2-4

- [ ] 物流仓储领域完整 Mock 数据
- [ ] 电商运营领域 Mock 数据
- [ ] Mock 响应带延迟模拟（500ms-2s）
- [ ] Mock 流式输出模拟

---

## 依赖关系总览

```
Phase 1 (基础设施)
  1.1 → 1.2 → 1.3
                1.4
         1.3 + 1.4 → 1.5

Phase 2 (项目 + CQ)
  1.1 → 2.1 → 2.2, 2.3, 2.4
  2.4 → 2.5
  1.4 + 2.4 → 2.6 → 2.7

Phase 3 (本体 + 图谱)
  1.1 → 3.1 → 3.2, 3.3
  2.7 + 3.2 → 3.4 → 3.5, 3.6

Phase 4 (工作流 + 审查)
  3.5 → 4.1 → 4.2 → 4.3

Phase 5 (导出 + 打磨)
  4.3 → 5.1
  All → 5.2, 5.3, 5.4, 5.5
```

---

## 技术风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|---|---|---|---|
| LLM 输出格式不稳定 | 高 | 高 | 严格的 JSON schema + 解析容错 + 重试机制 |
| CORS 限制阻止浏览器直调 LLM API | 中 | 高 | OpenAI 支持 CORS；Anthropic 需要代理或用 OpenAI 兼容端点 |
| React Flow 大图性能 | 低 | 中 | 节点虚拟化、按层级折叠、限制同屏节点数 |
| IndexedDB 存储上限 | 低 | 低 | 单项目数据 < 10MB，总量远低于配额 |
| Prompt 质量影响本体质量 | 高 | 高 | 精心设计 prompt、加入 few-shot 示例、用户可修改所有输出 |
