# Ontology Miner v2 — 需求规格说明

## 1. 项目概述

**产品名称**：Ontology Miner v2（本体知识挖掘工具 v2）

**目标**：在 v1 的 CQ 驱动本体挖掘基础上，大幅提升挖掘深度与广度、支持多源数据输入、实现自动化中间过程、引入多 Agent 辩论机制、构建 Label Studio 式标注验证系统、提供多种图可视化方式。

**核心升级方向**：
1. 增加每次迭代的深度和广度
2. 多源数据输入（URL、PDF、Excel、CSV、Markdown、图片）
3. 自动模式 — 减少人工干预
4. Label Studio 式标注验证系统（多人投票 + 专家匹配）
5. 多 Agent 辩论机制（Proposer-Challenger-Judge 协议）
6. 多种图可视化（6 种图类型 + 统计仪表盘）

**v1 保留功能**：11 步流程、React Flow 图谱、Mock/OpenAI/Anthropic Provider、IndexedDB 持久化、JSON/Markdown/JSON-LD/CSV/Mermaid 导出。

---

## 2. 用户角色

| 角色 | 描述 | 新增场景（v2） |
|---|---|---|
| 领域专家（Domain Expert） | 拥有领域深度知识的业务人员 | 参与标注验证问卷 |
| 知识工程师（Knowledge Engineer） | 负责本体质量的技术人员 | 配置辩论策略、管理数据源、审查辩论记录 |
| 标注专家（Annotation Expert） | 受邀验证本体的外部/内部专家 | 通过分享链接回答验证问题 |

---

## 3. 用户故事

### 3.1 需求1：增加迭代深度和广度

**US-101: 增强 CQ 生成**
> **When** the system generates CQs, **the system shall** produce 15-20 CQs (configurable) with 7 categories: scoping, foundational, relationship, process, constraint, temporal, quality.

验收标准：
- [ ] 默认生成 15 个 CQ，可配置 10-25
- [ ] 新增分类：temporal（时序相关）、quality（质量/度量相关）
- [ ] 每个 CQ 附带 relevance score (0-1) 表示与领域的相关度
- [ ] CQ 之间的依赖关系可视化（哪些 CQ 是另一个的前置问题）

**US-102: 增强本体提取深度**
> **When** extracting ontology from expanded CQs, **the system shall** produce 10-20 concepts per extraction with enriched properties.

验收标准：
- [ ] 每个概念至少包含 3 个属性
- [ ] 每个属性包含：名称、描述、数据类型、是否必填、约束条件、示例值（至少 2 个）
- [ ] 数据类型支持：string, number, boolean, date, datetime, enum, reference, list, object, money, percentage, duration, geo
- [ ] 关系推演包括：直接关系、间接关系（通过中间概念）、继承关系（is_a）、组合关系（part_of/has_a）
- [ ] 每个关系附带置信度 (0-1) 和推理依据

**US-103: 增强关系推演**
> **When** performing relationship inference, **the system shall** infer indirect relationships, inheritance chains, and composition hierarchies.

验收标准：
- [ ] 关系类型扩展：is_a, has_a, part_of, depends_on, triggers, produces, consumes, associated_with, inherits_from, composed_of, aggregates, specializes, generalizes, precedes, follows, constrains, enables
- [ ] 间接关系推演：如果 A→B 且 B→C，推演 A→C 的传递关系
- [ ] 推演结果标记为"推演"（非直接提取），需要确认
- [ ] 推演时考虑已导入的数据源内容

### 3.2 需求2：多源数据输入

**US-201: URL 内容抓取**
> **When** the user pastes one or more URLs, **the system shall** fetch the page content, extract readable text, and add it as a data source.

验收标准：
- [ ] 支持粘贴多个 URL（每行一个或逗号分隔）
- [ ] 使用 CORS proxy 抓取页面内容
- [ ] 用 Readability.js 提取正文（去除导航、广告、脚注）
- [ ] 显示抓取状态：加载中/成功/失败
- [ ] 抓取失败时显示原因（CORS 阻止、404、超时）
- [ ] 支持配置自定义 CORS proxy URL
- [ ] 抓取内容可预览、编辑、删除
- [ ] 每个 URL 数据源显示：标题、来源域名、抓取时间、内容长度

**US-202: 文档上传与解析**
> **When** the user uploads a file, **the system shall** parse the file content and add it as a data source.

验收标准：
- [ ] 支持拖拽上传和文件选择器
- [ ] PDF 解析：使用 `pdfjs-dist` 提取文本，按页组织，保留段落结构
- [ ] Excel 解析：使用 `xlsx` (SheetJS)，解析所有 sheet，识别表头，展示为结构化表格
- [ ] CSV 解析：使用 `papaparse`，自动检测分隔符和编码
- [ ] Markdown 解析：使用 `marked`，保留结构
- [ ] 文件大小限制：PDF < 50MB，Excel < 20MB，CSV < 10MB，MD < 5MB
- [ ] 解析错误时提供友好的错误信息
- [ ] 解析结果可预览（PDF 显示文本，Excel 显示表格，CSV 显示表格）

**US-203: 图片分析**
> **When** a document contains images or the user uploads images, **the system shall** use LLM vision to analyze the image content.

验收标准：
- [ ] 支持直接上传图片文件（PNG, JPG, GIF, WebP）
- [ ] PDF 中提取的图片（如有）也可送 vision 分析
- [ ] 图片转 base64 后随 prompt 发送到支持 vision 的模型
- [ ] 如果当前模型不支持 vision，显示提示并允许切换模型
- [ ] 图片分析结果以文本形式添加到数据源
- [ ] 特别适合：流程图、架构图、ER 图、组织架构图

**US-204: 数据源管理**
> **The system shall** provide a data source manager for viewing, organizing, and referencing imported data.

验收标准：
- [ ] 数据源列表面板，显示所有已导入的数据源
- [ ] 每个数据源显示：名称、类型图标、来源、导入时间、内容长度、使用状态
- [ ] 支持重命名、删除、编辑数据源
- [ ] 数据源标签系统：用户可打标签（如"核心文档"、"参考资料"、"待验证"）
- [ ] 在挖掘过程的任何步骤，LLM prompt 中都附带所有数据源内容（或用户选择的子集）
- [ ] 数据源内容作为 LLM 的参考上下文，影响 CQ 生成、本体提取、关系推演等所有步骤
- [ ] 数据源持久化到 IndexedDB，随项目保存/导出

### 3.3 需求3：自动模式

**US-301: 模式切换**
> **The system shall** provide Auto Mode and Manual Mode toggle.

验收标准：
- [ ] 工具栏提供 Auto/Manual 模式切换按钮
- [ ] Manual 模式：兼容 v1 行为，每步等待用户确认
- [ ] Auto 模式流程：
  1. ✋ 用户设置领域描述 → 手动
  2. ✋ 用户选择顶层 CQ → 手动
  3. ✋ 用户确认顶层本体 → 手动
  4. 🤖 CQ 展开 → 自动
  5. 🤖 本体提取 → 自动
  6. 🤖 深入推演 → 自动（直到 LLM 建议停止或达到 maxDepth）
  7. 🤖 工作流提取 → 自动
  8. 🤖 关系推演 → 自动
  9. ✋ 标注验证 → 手动
  10. ✋ 导出 → 手动
- [ ] 模式可以在运行中切换（自动→手动 立即暂停，手动→自动 跳过剩余确认）

**US-302: 自动模式进度展示**
> **When** running in Auto Mode, **the system shall** display real-time progress of the automated mining process.

验收标准：
- [ ] 进度面板显示：
  - 当前正在执行的步骤名称和描述
  - 总进度条（百分比）
  - 当前步骤的流式输出（LLM 正在生成的内容）
  - 已完成步骤的摘要（"已提取 15 个概念"、"已发现 23 条关系"）
  - 如果开启辩论模式，显示当前辩论轮次
  - 预估剩余时间
- [ ] 暂停按钮：立即暂停自动流程，用户可查看当前结果
- [ ] 继续按钮：从暂停处继续
- [ ] 取消按钮：终止自动流程，保留已完成的结果
- [ ] 每完成一个步骤，自动保存到 IndexedDB

**US-303: 自动模式错误处理**
> **When** an error occurs during Auto Mode, **the system shall** pause and allow the user to intervene.

验收标准：
- [ ] LLM API 错误：暂停，显示错误，提供重试/跳过/切换模型选项
- [ ] LLM 输出解析失败：暂停，显示原始输出，允许手动修正
- [ ] 连续失败 3 次：自动切换到 Manual 模式
- [ ] 所有错误和重试记录在日志中

### 3.4 需求4：标注验证系统

**US-401: 验证问题自动生成**
> **When** the mining process reaches the review phase, **the system shall** automatically generate validation questions from the extracted ontology.

验收标准：
- [ ] 问题类型 1 — 判断题：
  - 格式："以下关系是否正确：'{概念A}' {关系类型} '{概念B}'？"
  - 选项：是 / 否 / 不确定
  - 数量：每条关系生成 1 个判断题
- [ ] 问题类型 2 — 选择题：
  - 格式："'{概念A}' 和 '{概念B}' 之间的关系最准确的描述是？"
  - 选项：A. 包含 B. 关联 C. 继承 D. 无关 E. 其他（请说明）
  - 数量：对每对有关系的概念生成 1 个选择题
- [ ] 问题类型 3 — 排序题：
  - 格式："请按重要性排列以下概念对于'{领域}'领域的重要程度"
  - 选项：5-8 个概念的拖拽排序
  - 数量：每个 ontologyLayer 生成 1 个排序题
- [ ] 问题类型 4 — 补充题（开放式）：
  - 格式："您认为 '{流程名}' 还缺少哪些步骤？"
  - 输入：自由文本
  - 数量：每个工作流生成 1 个补充题
- [ ] 问题总数上限可配置（默认 50 题）
- [ ] 问题难度标记：简单/中等/困难（基于概念层级深度和关系复杂度）
- [ ] 问题领域标记：与哪些概念/关系相关

**US-402: 标注界面**
> **The system shall** provide a clean annotation interface for experts to answer validation questions.

验收标准：
- [ ] 每次显示 1 个问题（Prodigy 式）
- [ ] 判断题：大按钮 是/否/不确定 + 备注框
- [ ] 选择题：单选按钮组 + "其他"自由输入
- [ ] 排序题：拖拽排序列表
- [ ] 补充题：多行文本输入
- [ ] 键盘快捷键：1=是/A, 2=否/B, 3=不确定/C, Enter=下一题, Backspace=上一题
- [ ] 进度条："第 5/50 题"
- [ ] 跳过按钮：标记为"跳过"
- [ ] 预估完成时间："约需 10 分钟"
- [ ] 标注结果实时保存

**US-403: 多人参与机制**
> **The system shall** support multiple experts answering the same set of questions.

验收标准：
- [ ] 方案 A（纯前端 — 默认）：
  - 导出验证问卷为 JSON 文件
  - 分发给多个专家（邮件/IM）
  - 每个专家在自己浏览器打开应用，导入问卷并作答
  - 导出标注结果 JSON
  - 发起者导入所有标注结果，系统自动合并统计
- [ ] 方案 B（轻量后端 — 可选）：
  - 配置 Firebase Realtime DB 或 Cloudflare KV
  - 生成唯一分享链接（含项目 ID + 问卷 ID）
  - 专家通过链接直接在浏览器标注
  - 实时同步所有标注结果
  - 发起者实时查看投票统计
- [ ] 无论哪种方案，最终展示投票统计面板：
  - 每个问题的回答分布（饼图/柱状图）
  - 共识度指标（simple agreement + weighted agreement）
  - "达成共识" vs "存在争议"标记
  - 排序题显示加权平均排名

**US-404: 专家画像与匹配**
> **The system shall** collect expert profiles and match questions to appropriate experts.

验收标准：
- [ ] 专家画像字段：姓名、邮箱、领域专长（多选标签）、经验年限、角色/级别（初级/中级/高级/资深）
- [ ] 问题-专家匹配规则：
  - 问题的领域标签 匹配 专家的领域专长
  - 困难问题 优先分配给 高级/资深 专家
  - 每个问题至少 3 个专家回答
- [ ] 可信度权重：
  - 资深 = 1.5x，高级 = 1.2x，中级 = 1.0x，初级 = 0.8x
  - 领域匹配 = 1.3x，不匹配 = 0.7x
  - 最终权重 = 资历权重 × 领域权重
- [ ] 加权投票：加权后重新计算共识度
- [ ] 专家画像持久化存储，跨项目复用

**US-405: 反馈循环**
> **When** annotation results are collected, **the system shall** update the ontology based on expert consensus.

验收标准：
- [ ] 共识度 ≥ 0.7 的回答自动应用：
  - 判断题"否" → 标记关系为"错误"，从本体中移除或标记
  - 选择题 → 更新关系类型
  - 排序题 → 更新概念的 importance 属性
  - 补充题 → 添加为用户注释，触发针对性重新挖掘
- [ ] 共识度 < 0.7 的回答标记为"争议"：
  - 高亮显示在图谱中（黄色标记）
  - 建议分配给更高级专家裁决
  - 可触发 LLM 重新分析并生成新的验证问题
- [ ] 生成标注报告：
  - 总参与人数、完成率
  - 整体共识度分布
  - 每个问题的详细统计
  - 本体修改记录（before/after）
  - 覆盖率（多少本体元素经过了验证）

### 3.5 需求5：多 Agent 辩论机制

**US-501: 辩论配置**
> **The system shall** allow configuring multi-agent debate settings.

验收标准：
- [ ] 辩论模式开关：全局开启/关闭
- [ ] 可配置哪些步骤启用辩论：
  - 本体提取 ✅ 默认开启
  - 深入推演 ✅ 默认开启
  - 关系推演 ✅ 默认开启
  - CQ 生成 ❌ 默认关闭
  - 工作流提取 ❌ 默认关闭
- [ ] Agent 角色配置：
  - Proposer（提议者）：模型选择 + 自定义 system prompt
  - Challenger（挑战者）：模型选择 + 自定义 system prompt
  - Judge（裁判）：模型选择 + 自定义 system prompt
- [ ] 辩论轮数：1-5，默认 3
- [ ] 每个角色可选择不同模型（如 GPT-4o + Claude + GPT-4o-mini）
- [ ] 预设配置模板：
  - "快速模式"：1 轮辩论，同一模型
  - "标准模式"：3 轮辩论，两个不同模型
  - "深度模式"：5 轮辩论，三个不同模型

**US-502: 辩论执行**
> **When** debate mode is enabled for a step, **the system shall** execute the Proposer-Challenger-Judge debate protocol.

验收标准：
- [ ] Round 0 — Proposer 生成初始结果（与非辩论模式相同的 prompt）
- [ ] Round 1+ — Challenger 审查：
  - 输入：Proposer 的结果 + 原始上下文
  - 输出结构化审查：
    ```json
    {
      "agreements": ["同意的部分及理由"],
      "challenges": [
        {
          "target": "被质疑的概念/关系",
          "issue": "问题描述",
          "suggestion": "建议修改",
          "evidence": "支撑论据"
        }
      ],
      "additions": ["Challenger 认为遗漏的内容"]
    }
    ```
- [ ] Round 2+ — Proposer 回应：
  - 输入：Challenger 的审查 + 自己的原始结果
  - 输出：修改后的结果 + 每个质疑的回应（接受/拒绝/修改 + 理由）
- [ ] 循环直到达到配置轮数
- [ ] 最终 — Judge 裁决：
  - 输入：完整辩论记录（所有轮次）
  - 输出：最终本体结果 + 裁决说明（每个争议点的判断依据）
- [ ] 辩论记录完整保存到 IndexedDB

**US-503: 辩论过程展示**
> **The system shall** display the debate thinking process in a dedicated panel.

验收标准：
- [ ] 辩论面板可展开/折叠，位于主内容区右侧或底部
- [ ] 聊天记录风格展示：
  - 每条消息标注 Agent 角色和模型名称
  - Proposer 消息靠左（蓝色），Challenger 消息靠右（红色），Judge 消息居中（金色）
  - 时间戳和 token 消耗
- [ ] 每条消息可展开查看完整内容或折叠为摘要
- [ ] 共识标注：
  - 🟢 共识（所有 Agent 一致）
  - 🟡 辩论后决定（经过辩论，Judge 裁定）
  - 🔴 未解决争议（即使 Judge 裁定，仍标记为低信心）
- [ ] 流式展示：辩论进行时实时显示每个 Agent 的输出
- [ ] 支持全屏查看辩论记录

**US-504: 多模型支持**
> **The system shall** support using different LLM models for different agent roles.

验收标准：
- [ ] 每个 Agent 角色独立配置：Provider + Model + API Key
- [ ] 支持混合使用 OpenAI 和 Anthropic
- [ ] 每个角色的 temperature 独立配置
- [ ] 如果某个模型的 API Key 未配置，回退到默认模型
- [ ] 模型列表动态更新（硬编码常用模型 + 自定义模型名输入）

### 3.6 需求6：多种图可视化

**US-601: 知识图谱视图（Neo4j 风格）**
> **The system shall** provide an interactive knowledge graph view.

验收标准：
- [ ] 节点 = 概念，边 = 关系
- [ ] 节点样式：
  - 圆形/椭圆形节点
  - 颜色按 ontologyLayer 区分（upper=蓝, domain=绿, task=橙, application=紫）
  - 大小按关系数量（连接度）缩放
  - 显示名称，hover 显示描述
- [ ] 边样式：
  - 实线 = 已确认关系，虚线 = 推演/待确认关系
  - 边上显示关系名称
  - 箭头方向表示关系方向
  - 粗细按置信度缩放
- [ ] 交互：
  - 拖拽移动节点
  - 滚轮缩放
  - 框选多个节点
  - 双击节点展开/折叠子概念
  - 右键菜单：编辑、删除、深入展开、查看详情
  - 搜索框快速定位节点
- [ ] 布局算法：力导向（默认）、层级（dagre）、径向
- [ ] 小地图（minimap）
- [ ] 图例

**US-602: 属性图视图**
> **The system shall** provide a property graph view showing entity details.

验收标准：
- [ ] 基于 React Flow，使用自定义节点
- [ ] 每个节点展示为卡片：
  - 标题：概念名称
  - 属性列表：名称 | 类型 | 必填标记
  - 底部：关系数量徽章
- [ ] 点击节点展开详细属性面板（侧边抽屉）：
  - 所有属性的完整信息（名称、描述、类型、约束、示例值）
  - 关联关系列表
  - 所属工作流列表
  - 编辑按钮
- [ ] 边显示关系名称和基数（如 "1:N"）
- [ ] 支持按 ontologyLayer 过滤显示

**US-603: 层级树状图**
> **The system shall** provide a hierarchical tree view of ontology inheritance.

验收标准：
- [ ] 使用 D3.js d3-hierarchy 实现
- [ ] 树状布局：根节点在左，叶子节点在右（或顶→底）
- [ ] 只显示 is_a、part_of、composed_of 层级关系
- [ ] 可折叠/展开分支
- [ ] 节点颜色按 ontologyLayer
- [ ] 点击节点高亮该概念在其他图类型中的位置
- [ ] 支持搜索
- [ ] 显示每个分支的深度标注

**US-604: 关系矩阵**
> **The system shall** provide a relationship matrix / heatmap view.

验收标准：
- [ ] 行和列 = 概念名称
- [ ] 单元格颜色 = 关系强度（无关系=空白，弱关系=浅色，强关系=深色）
- [ ] 关系强度计算：直接关系=1.0，间接关系(1跳)=0.5，间接关系(2跳)=0.25
- [ ] hover 单元格显示关系详情（关系名称、类型、置信度）
- [ ] 点击单元格跳转到知识图谱视图中对应的边
- [ ] 支持排序（按名称、按关系数量、按聚类）
- [ ] 概念数量 > 30 时支持滚动和缩放
- [ ] 使用 D3.js 或 Recharts 实现

**US-605: 时序流程图**
> **The system shall** provide a temporal workflow visualization.

验收标准：
- [ ] 每个工作流渲染为一个独立的流程图
- [ ] 使用 React Flow + dagre 布局（自上而下或自左向右）
- [ ] 步骤节点显示：名称、执行者、输入/输出
- [ ] 节点间箭头表示执行顺序
- [ ] 条件分支显示为菱形决策节点
- [ ] 并行步骤显示为并排布局
- [ ] 点击步骤节点显示详情：涉及的概念、前置条件、后置条件
- [ ] 步骤节点颜色按执行者角色区分
- [ ] 支持多个工作流的 Tab 切换

**US-606: 统计仪表盘**
> **The system shall** provide a statistics dashboard overview.

验收标准：
- [ ] 核心指标卡片：
  - 概念总数（按 layer 分布饼图）
  - 关系总数（按类型分布柱状图）
  - 工作流总数
  - 最大深度
  - 平均每概念属性数
  - 平均每概念关系数
- [ ] 覆盖度分析：
  - CQ 覆盖率：多少 CQ 被本体概念覆盖
  - 属性完备性：多少概念有 ≥ 3 个属性
  - 关系密度：概念间的平均连接度
- [ ] 质量指标（如果开启了辩论模式）：
  - 共识率：多少结论是所有 Agent 一致的
  - 辩论修改率：多少结论在辩论中被修改
  - 平均辩论轮数
- [ ] 标注验证指标（如果已完成标注）：
  - 专家参与率
  - 平均共识度
  - 争议问题比例
- [ ] 使用 Recharts 实现，响应式布局

**US-607: 图类型切换与通用交互**
> **The system shall** provide unified graph type switching and cross-graph interactions.

验收标准：
- [ ] Tab 栏或下拉菜单切换 6 种图类型 + 仪表盘
- [ ] 所有图类型共享同一份数据（Zustand store）
- [ ] 在任何图中选中元素 → 其他图中对应元素高亮（跨图联动）
- [ ] 全屏模式：每种图都可全屏展示
- [ ] 图片导出：
  - PNG 导出：使用 `html2canvas`
  - SVG 导出：序列化 SVG DOM
  - 导出当前视口或完整图谱
- [ ] 图谱设置面板：
  - 节点大小
  - 边粗细
  - 标签显示/隐藏
  - 布局算法选择
  - 颜色主题

---

## 4. 非功能需求

### 4.1 性能

| 指标 | v1 目标 | v2 目标 |
|---|---|---|
| 首屏加载时间 | < 2s | < 3s（新增依赖） |
| 图谱渲染（100 节点） | < 500ms | < 500ms |
| 图谱渲染（500 节点） | < 2s | < 2s |
| 图谱渲染（2000 节点） | — | < 5s（新增） |
| 辩论单轮耗时 | — | < 30s（每次 LLM 调用） |
| 辩论总耗时（3 轮） | — | < 3min |
| 文件解析（50MB PDF） | — | < 10s |
| 自动模式全流程 | — | < 30min（中等领域） |

### 4.2 数据安全（新增）

- API Key 仍存储在本地 IndexedDB
- 上传的文件内容存储在 IndexedDB，不上传到任何服务器
- 分享链接（方案 B）使用 Firebase/Cloudflare 时，数据加密存储
- 专家画像信息本地存储，不随分享链接传播

### 4.3 可扩展性

- 单个项目概念数上限从 1000 提升到 5000
- 数据源总大小上限 200MB
- 标注问卷最多 200 题
- 专家池最多 50 人

---

## 5. LLM 接口扩展

### 5.1 Provider 接口扩展

```typescript
interface LLMProvider {
  name: string;
  
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<LLMChunk>;
  validate(): Promise<boolean>;
  
  // v2 新增
  supportsVision(): boolean;
  completeWithImages(request: LLMRequestWithImages): Promise<LLMResponse>;
}

interface LLMRequestWithImages extends LLMRequest {
  images: Array<{
    type: 'base64' | 'url';
    mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
    data: string;
  }>;
}

// v2 新增：辩论相关
interface DebateConfig {
  enabled: boolean;
  rounds: number;                  // 1-5, default 3
  proposer: AgentRoleConfig;
  challenger: AgentRoleConfig;
  judge: AgentRoleConfig;
  enabledSteps: {
    ontologyExtraction: boolean;
    drillDown: boolean;
    relationInference: boolean;
    cqGeneration: boolean;
    workflowExtraction: boolean;
  };
}

interface AgentRoleConfig {
  provider: 'openai' | 'anthropic' | 'mock';
  model: string;
  apiKey?: string;                 // 如果不同于全局 API Key
  temperature?: number;
  systemPromptOverride?: string;   // 覆盖默认的角色 prompt
}
```

---

## 6. 约束与假设

### 新增约束（v2）
- URL 抓取依赖 CORS proxy（公共或自建），可能有可用性风险
- 多 Agent 辩论会显著增加 API 调用量和成本（约 3-8x）
- 纯前端多人标注方案（方案 A）需要手动传文件，体验有限
- 图片分析需要支持 vision 的模型（GPT-4o 或 Claude Sonnet/Opus）
- 浏览器 IndexedDB 存储上限通常为磁盘的 50-80%（实际约 1-2GB），大量数据源可能接近上限

### 新增假设（v2）
- 辩论模式下用户接受更长的等待时间（3-5 分钟 vs 30 秒）
- 标注验证环节至少有 3 位专家参与
- 用户愿意为更高质量的本体支付更多 API 费用
