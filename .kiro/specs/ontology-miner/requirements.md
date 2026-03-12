# Ontology Miner — Requirements Specification

## 1. 项目概述

**产品名称**：Ontology Miner（本体知识挖掘工具）

**目标**：通过 LLM 驱动的交互式对话，系统化地从领域专家知识中挖掘、结构化和建模知识，产出完整的本体知识库，为 Agent Factory 提供基础输入。

**核心价值**：将传统需要本体工程师数周完成的知识建模工作，通过 AI 辅助降低到领域专家数小时内可独立完成。

---

## 2. 用户角色

| 角色 | 描述 | 技术水平 |
|---|---|---|
| 领域专家（Domain Expert） | 拥有特定领域深度知识的业务人员 | 非技术，熟悉业务 |
| 知识工程师（Knowledge Engineer） | 负责本体质量和结构的技术人员 | 技术，了解本体论 |

---

## 3. 用户故事（EARS 格式）

### 3.1 项目管理

**US-001: 创建知识挖掘项目**
> **When** the user opens the application, **the system shall** display a project list and a "New Project" button. **When** the user clicks "New Project" and provides a name and domain description, **the system shall** create a new mining project and navigate to the mining workspace.

验收标准：
- [ ] 项目列表显示所有已创建的项目，按更新时间倒序
- [ ] 新建项目需输入名称（必填）和领域描述（必填，最少 20 字符）
- [ ] 创建后自动进入 Domain Input 阶段
- [ ] 项目数据持久化到 IndexedDB

**US-002: 管理项目列表**
> **The system shall** allow the user to view, rename, duplicate, and delete projects from the project list.

验收标准：
- [ ] 支持重命名（inline 编辑）
- [ ] 支持复制项目（深拷贝所有数据）
- [ ] 删除需二次确认
- [ ] 显示项目的当前阶段、概念数量、最后更新时间

**US-003: 配置 LLM Provider**
> **When** the user opens project settings, **the system shall** allow configuration of the LLM provider (OpenAI/Anthropic/Mock), model selection, API key, and language preference.

验收标准：
- [ ] 支持 OpenAI（gpt-4o, gpt-4o-mini）和 Anthropic（claude-sonnet-4, claude-haiku）
- [ ] API Key 存储在 IndexedDB，前端不明文显示
- [ ] Mock 模式返回预设数据（用于开发/演示）
- [ ] 语言选择：中文 / English / 自动检测
- [ ] 连接测试按钮验证 API Key 有效性

### 3.2 Phase 1: 领域输入

**US-010: 输入领域描述**
> **When** the user enters a domain or problem description (free-form text), **the system shall** accept the input, display it in an editable text area, and enable the "Generate CQs" button.

验收标准：
- [ ] 文本框支持多行输入，最少 20 字符
- [ ] 显示字符计数和建议长度（100-500 字）
- [ ] 提供 3 个示例领域供参考（物流仓储、电商运营、供应链管理）
- [ ] 用户可编辑已输入的描述

### 3.3 Phase 2: CQ 生成与选择

**US-020: 生成 Competency Questions**
> **When** the user confirms the domain description, **the system shall** call the LLM to generate a configurable number (default 10) of Competency Questions and display them as a selectable list.

验收标准：
- [ ] 每个 CQ 显示：序号、问题文本、分类标签（Scoping/Foundational/Relationship/Process/Constraint）
- [ ] 显示 loading 状态和预估等待时间
- [ ] 生成失败时显示错误信息和重试按钮
- [ ] 支持"重新生成"（重新调 LLM）
- [ ] CQ 数量可在设置中调整（5-20）

**US-021: 选择核心 CQ**
> **When** the CQ list is displayed, **the system shall** allow the user to select one or more CQs as the core questions, and optionally add custom CQs.

验收标准：
- [ ] Checkbox 多选，至少选择 1 个
- [ ] 支持拖拽排序调整优先级
- [ ] 支持添加自定义 CQ（手动输入）
- [ ] 支持编辑已生成的 CQ 文本
- [ ] 选中的 CQ 高亮显示
- [ ] 显示已选数量 "已选 3/10"

### 3.4 Phase 3: CQ 展开

**US-030: 展开选中的 CQ**
> **When** the user confirms the selected CQs, **the system shall** call the LLM to expand each selected CQ into detailed content, including sub-questions, related concepts, and relationships.

验收标准：
- [ ] 每个 CQ 展开为一个卡片，包含：
  - 原始问题
  - 详细展开描述（200-500 字）
  - 衍生子问题（3-5 个）
  - 提取的概念列表
  - 提取的关系列表
- [ ] 支持逐个展开或批量展开
- [ ] 展开过程显示流式输出（streaming）
- [ ] 每个卡片可独立编辑和确认

**US-031: 确认展开内容**
> **When** the expanded CQs are displayed, **the system shall** allow the user to confirm, edit, or reject each expanded CQ, and add supplementary notes.

验收标准：
- [ ] 每个展开卡片有：确认 ✓ / 编辑 ✎ / 拒绝 ✗ 按钮
- [ ] 编辑模式下所有字段可修改
- [ ] 补充说明框供用户添加领域专有知识
- [ ] 至少确认 1 个展开内容才能进入下一阶段
- [ ] 确认后显示"已确认 X/Y"进度

### 3.5 Phase 4: 本体提取与细化

**US-040: 提取顶层本体**
> **When** the user confirms expanded CQs, **the system shall** call the LLM to extract top-level ontology concepts and their relationships, and display them as an interactive graph.

验收标准：
- [ ] 从确认的展开内容中提取概念和关系
- [ ] 图谱显示：概念为节点，关系为边
- [ ] 节点显示：名称、层级（Upper/Domain）、属性数量
- [ ] 边显示：关系名称、基数
- [ ] 支持缩放、平移、自动布局
- [ ] 同时提供列表视图

**US-041: 深入细化本体**
> **When** the user clicks on a concept node in the graph, **the system shall** allow drilling down to generate sub-concepts, additional properties, and relationships at the next level.

验收标准：
- [ ] 点击节点显示操作面板：深入展开 / 编辑属性 / 查看详情
- [ ] "深入展开"调用 LLM 生成子概念
- [ ] 新生成的子概念自动添加到图谱
- [ ] 支持无限层级深入（受 maxDepth 设置限制）
- [ ] 每层深入都创建版本快照
- [ ] 深度指示器显示当前层级 "Layer 3/10"
- [ ] LLM 建议何时停止深入（子概念 < 2 个时）

**US-042: 编辑本体元素**
> **The system shall** allow the user to manually add, edit, or delete concepts, properties, and relationships at any time.

验收标准：
- [ ] 右键菜单或面板操作
- [ ] 添加概念：名称、描述、别名、属性
- [ ] 编辑概念：所有字段可修改
- [ ] 删除概念：级联选项（是否删除子概念和关联关系）
- [ ] 添加/编辑关系：选择源、目标概念，定义关系类型和基数
- [ ] 所有修改记录在版本历史中

### 3.6 Phase 5: 工作流提取

**US-050: 提取业务工作流**
> **When** the user transitions to the workflow extraction phase, **the system shall** call the LLM to identify business workflows based on the current ontology, and display them as step-by-step flows.

验收标准：
- [ ] 从概念和关系中推演出业务流程
- [ ] 每个工作流包含：名称、步骤列表、涉及的概念
- [ ] 步骤显示：名称、执行者、输入、输出、条件
- [ ] 支持编辑、添加、删除工作流和步骤
- [ ] 工作流可视化为流程图

### 3.7 Phase 6: 关系推演

**US-060: 推演本体关系**
> **When** the user confirms workflows, **the system shall** call the LLM to infer additional relationships between concepts based on workflow analysis, and update the ontology graph.

验收标准：
- [ ] 新发现的关系用虚线显示（与已确认的实线区分）
- [ ] 用户可确认或拒绝每条新关系
- [ ] 关系推演说明（为什么认为存在这个关系）
- [ ] 更新后的图谱高亮新增内容

### 3.8 Phase 7: 审查与导出

**US-070: 整体审查**
> **When** the user enters the review phase, **the system shall** display a comprehensive summary of the entire ontology, including statistics, completeness indicators, and a full interactive graph.

验收标准：
- [ ] 统计面板：概念数、关系数、工作流数、最大深度、各层分布
- [ ] 完备性检查：孤立概念（无关系）、缺少属性的概念、单向关系
- [ ] 全图展示（可折叠层级）
- [ ] 一键修复建议（LLM 建议补充缺失的关系/属性）

**US-071: 导出知识库**
> **The system shall** allow exporting the complete ontology in multiple formats.

验收标准：
- [ ] JSON 格式：完整数据结构，可重新导入
- [ ] Markdown 格式：人类可读的文档
- [ ] JSON-LD 格式：语义网标准格式
- [ ] CSV 格式：概念表 + 关系表 + 工作流表
- [ ] Mermaid 格式：可嵌入 Markdown 的图表代码
- [ ] 支持选择导出范围（全部 / 按层级 / 按工作流）

**US-072: 导入项目**
> **The system shall** allow importing a previously exported JSON file to restore a project.

验收标准：
- [ ] 拖拽或文件选择器导入
- [ ] 导入前预览：项目名称、概念数、关系数
- [ ] 与现有项目名称冲突时自动重命名
- [ ] 导入后可继续编辑

### 3.9 通用功能

**US-080: 进度指示**
> **The system shall** always display the current phase, overall progress, and available actions.

验收标准：
- [ ] 顶部步骤条显示所有阶段，高亮当前阶段
- [ ] 已完成阶段显示 ✓
- [ ] 点击已完成阶段可回溯
- [ ] 侧边栏显示本阶段的详细进度

**US-081: 回溯功能**
> **When** the user clicks on a previous phase in the progress bar, **the system shall** create a snapshot of the current state and restore the selected phase's state.

验收标准：
- [ ] 回溯前自动保存当前状态
- [ ] 创建分支（不删除原有进度）
- [ ] 下游阶段标记为"待重新生成"
- [ ] 分支管理面板显示所有历史分支
- [ ] 可在分支间切换

**US-082: 键盘快捷键**
> **The system shall** support keyboard shortcuts for common actions.

验收标准：
- [ ] `Ctrl/Cmd + Enter`：确认当前步骤，进入下一步
- [ ] `Ctrl/Cmd + Z`：撤销最后一次编辑
- [ ] `Ctrl/Cmd + Shift + Z`：重做
- [ ] `Ctrl/Cmd + E`：导出
- [ ] `Ctrl/Cmd + S`：手动保存（虽然有自动保存）
- [ ] `Esc`：关闭当前面板/对话框

**US-083: 自动保存**
> **The system shall** automatically save project state to IndexedDB after every user action with a debounce of 500ms.

验收标准：
- [ ] 保存指示器（保存中... / 已保存 ✓）
- [ ] 保存失败时显示警告并提供重试
- [ ] 页面刷新后恢复到最后保存的状态

---

## 4. 非功能需求

### 4.1 性能

| 指标 | 目标 |
|---|---|
| 首屏加载时间 | < 2 秒 |
| 页面切换 | < 200ms |
| 图谱渲染（100 节点） | < 500ms |
| 图谱渲染（500 节点） | < 2 秒 |
| 自动保存延迟 | < 1 秒 |
| LLM 响应开始（streaming） | < 3 秒 |

### 4.2 浏览器兼容性

- Chrome 90+（主要目标）
- Firefox 90+
- Safari 15+
- Edge 90+

### 4.3 响应式设计

- 最小宽度：1024px（桌面优先）
- 图谱交互需要鼠标/触控板
- 不需要移动端适配（v1）

### 4.4 可访问性

- 所有交互元素支持键盘导航
- 颜色对比度满足 WCAG AA
- 图谱节点支持键盘选择和操作

### 4.5 数据安全

- API Key 仅存储在本地 IndexedDB
- LLM 调用直接从浏览器发起（无后端代理）
- 不收集用户数据
- 本地数据可完整导出/删除

---

## 5. LLM 接口定义

### 5.1 Provider 接口

```typescript
interface LLMProvider {
  name: string;
  
  /**
   * 发送 prompt 并获取完整响应
   */
  complete(request: LLMRequest): Promise<LLMResponse>;
  
  /**
   * 发送 prompt 并获取流式响应
   */
  stream(request: LLMRequest): AsyncIterable<LLMChunk>;
  
  /**
   * 验证 API Key 有效性
   */
  validate(): Promise<boolean>;
}

interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;          // 默认 0.7
  maxTokens?: number;            // 默认 4096
  responseFormat?: 'text' | 'json';
}

interface LLMResponse {
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: 'stop' | 'length' | 'error';
}

interface LLMChunk {
  delta: string;
  done: boolean;
}
```

### 5.2 LLM Prompt 定义

每个阶段的 LLM Prompt 详见 [design.md](./design.md#5-llm-prompt-设计)。

### 5.3 Provider 实现

| Provider | 接口 | 模型 | 备注 |
|---|---|---|---|
| OpenAI | `POST /v1/chat/completions` | gpt-4o, gpt-4o-mini | 支持 streaming, JSON mode |
| Anthropic | `POST /v1/messages` | claude-sonnet-4, claude-haiku | 支持 streaming |
| Mock | 本地模拟 | — | 返回预设数据，开发/演示用 |

---

## 6. 约束与假设

### 约束
- 纯前端应用，无后端服务器
- LLM API 调用从浏览器直接发起（需 CORS 支持）
- 数据全部存储在浏览器 IndexedDB 中
- 依赖用户自备 LLM API Key

### 假设
- 用户有稳定的互联网连接
- 用户有有效的 OpenAI 或 Anthropic API Key
- 用户使用现代桌面浏览器
- 单个本体项目的概念数不超过 1000 个（v1）
