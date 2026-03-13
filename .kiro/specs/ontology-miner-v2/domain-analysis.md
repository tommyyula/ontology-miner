# Ontology Miner v2 — 领域分析

## 1. 领域研究综述

### 1.1 本体工程方法论

#### 1.1.1 CQ 驱动方法的局限性与改进

v1 采用的 Competency Question (CQ) 驱动方法源自 Grüninger & Fox (1995) 的本体设计方法论。该方法的核心优势是以问题为导向驱动本体构建，但存在以下已知局限：

- **浅层覆盖**：每次迭代生成的概念数量有限（v1 默认 10 个 CQ），导致需要多轮迭代才能覆盖领域全貌
- **单一视角**：单个 LLM 的知识偏差可能导致本体不完整或偏向某个子领域
- **人工瓶颈**：每一步都需要人工确认，严重降低了挖掘效率

v2 的改进策略：
1. **广度**：增加每次迭代的 CQ 数量（15-20），并引入更细的分类体系
2. **深度**：每个概念提取更丰富的属性（数据类型、约束、示例值）
3. **多视角**：多 Agent 辩论确保不同角度的覆盖
4. **自动化**：中间步骤全自动执行，只在关键决策点要求人工介入

#### 1.1.2 本体一致性与完备性验证

本体论中的一致性检查方法包括：

| 检查类型 | 描述 | 实现方式 |
|---|---|---|
| **逻辑一致性** | 概念层级无环、关系无矛盾 | 图遍历算法检测环路 |
| **命名一致性** | 无重复概念、别名统一 | 字符串相似度 + LLM 判断 |
| **基数一致性** | 关系基数不冲突（A→B 1:N 与 B→A 不能同时 1:N） | 规则引擎校验 |
| **层级一致性** | 子概念不能跨越超过 2 个层级 | 深度检查 |
| **完备性** | 所有 CQ 都能被本体回答 | CQ↔概念映射覆盖率 |
| **连通性** | 无孤立概念（所有概念至少有 1 条关系） | 图连通性分析 |

### 1.2 多 Agent 辩论方法

#### 1.2.1 学术基础

**Society of Mind (Minsky, 1986)**：智能产生于大量简单代理的交互。v2 将此理论应用于本体挖掘——不同 Agent 扮演不同角色（提取者、审查者、裁判），通过结构化辩论产生更高质量的本体。

**Multi-Agent Debate (MAD) 范式**：
- Du et al. (2023) "Improving Factuality and Reasoning" — 多个 LLM 互相辩论提升准确性
- Liang et al. (2023) "Encouraging Divergent Thinking" — 辩论促进多角度思考
- Khan et al. (2024) "Debating with More Persuasive LLMs" — 即使小模型也能通过辩论达到大模型水平

**Constitutional AI (Anthropic)**：AI 自我审查和修正的方法论，v2 的审查 Agent 借鉴此思路。

#### 1.2.2 辩论协议设计

基于文献综合，v2 采用以下辩论协议：

```
Round 0: Agent A (Proposer) — 生成初始本体提取结果
Round 1: Agent B (Challenger) — 审查并提出质疑
  - 缺失概念？
  - 关系不准确？
  - 属性不完整？
  - 层级划分不合理？
Round 2: Agent A (Defender) — 回应质疑，修改或坚持
Round 3: Agent C (Judge) — 综合 A 和 B 的论点，做最终裁决
```

关键设计原则：
- 每个 Agent 必须提供论据支撑（不是简单的同意/反对）
- 裁判 Agent 可以引入两方都没提到的新观点
- 辩论记录完整保存，用户可查看思维过程
- 共识结论 vs 辩论后决定 需明确标注

### 1.3 Label Studio 标注工作流

#### 1.3.1 标注系统设计模式

Label Studio 的核心设计模式：

1. **任务驱动**：每个标注任务是一个独立单元，包含数据和标注指南
2. **多标注者分配**：同一任务分配给多人，通过 IAA (Inter-Annotator Agreement) 衡量共识
3. **审查流程**：低共识任务进入专家审查队列
4. **指标体系**：Cohen's Kappa、Fleiss' Kappa、Krippendorff's Alpha 等一致性指标

v2 借鉴但有重要差异：
- Label Studio 标注的是数据集，v2 标注的是本体元素的正确性
- Label Studio 的标注是独立的，v2 的标注结果需要反馈回本体并触发更新
- v2 需要生成问题（LLM 自动生成验证问题），Label Studio 的标注任务是预定义的

#### 1.3.2 Prodigy 的交互设计启示

Prodigy（spaCy 团队的标注工具）的 UX 设计特点：
- **最小化认知负担**：每次只展示一个标注任务
- **二元决策优先**：是/否 判断比多选更快
- **进度可见**：实时显示标注进度和一致性分数
- **键盘优先**：快捷键加速标注

v2 标注界面应结合两者优点：问题类型丰富（Label Studio），但交互简洁（Prodigy）。

### 1.4 Delphi 方法与多专家共识

#### 1.4.1 经典 Delphi 方法

Delphi 方法的核心要素：
1. **匿名性**：专家互不知道彼此的回答
2. **迭代性**：多轮反馈，逐步收敛
3. **受控反馈**：每轮后展示统计摘要
4. **统计汇总**：最终用中位数/四分位距表示共识

#### 1.4.2 Real-Time Delphi (RTD)

传统 Delphi 的异步多轮模式在 v2 中不适用（太慢）。RTD 变体更适合：
- 专家可以实时看到当前投票分布
- 随时可以修改自己的回答
- 达到共识阈值后自动结束

v2 的标注验证系统采用 RTD 变体：
- 生成分享链接后，专家可异步或同时参与
- 实时更新投票统计
- 自动标记"达成共识"和"存在争议"的问题

---

## 2. 技术可行性分析

### 2.1 多源数据输入

#### 2.1.1 文件解析方案

| 文件类型 | 库 | 浏览器兼容 | 注意事项 |
|---|---|---|---|
| PDF | `pdfjs-dist` (Mozilla) | ✅ Web Worker | 仅文本提取；扫描件需 OCR（v2 暂不支持） |
| Excel (.xlsx) | `xlsx` (SheetJS CE) | ✅ 纯 JS | 社区版免费；复杂公式不解析 |
| Excel (.xls) | `xlsx` (SheetJS CE) | ✅ | 旧格式支持较好 |
| CSV | `papaparse` | ✅ 纯 JS | 自动检测分隔符、编码 |
| Markdown | `marked` 或自定义 | ✅ | 简单解析即可 |
| 图片 | LLM Vision API | ✅ | 需要支持 vision 的模型 |

#### 2.1.2 URL 内容抓取

纯前端抓取受 CORS 限制，解决方案：

1. **CORS Proxy 服务**（推荐）：
   - `allorigins.win`、`corsproxy.io` 等公共代理
   - 自建轻量 proxy（Cloudflare Worker / Vercel Edge Function）
   - 优点：零后端部署；缺点：依赖第三方服务
   
2. **浏览器扩展**（备选）：
   - 开发配套 Chrome 扩展绕过 CORS
   - 用户体验较差，需安装额外软件

3. **服务端代理**（最可靠但违背纯前端原则）

v2 方案：默认使用公共 CORS proxy，提供自定义 proxy URL 设置项。用 `Readability.js`（Mozilla）提取正文内容，去除广告/导航等噪音。

#### 2.1.3 图片分析

利用 LLM 的多模态能力：
- OpenAI GPT-4o：支持 image URL 或 base64
- Anthropic Claude：支持 image media type
- 图片转 base64 后随 prompt 发送
- 适用场景：文档中的流程图、架构图、ER 图

### 2.2 多 Agent 调度

#### 2.2.1 前端并发方案

```typescript
// 辩论调度器核心逻辑
interface DebateConfig {
  proposerModel: ModelConfig;    // Agent A
  challengerModel: ModelConfig;  // Agent B
  judgeModel: ModelConfig;       // Agent C
  maxRounds: number;             // 默认 3
  autoResolve: boolean;          // 辩论后是否自动采纳裁判结果
}

// 调度流程：
// 1. Agent A 生成初始结果 (Promise)
// 2. Agent B 审查 (依赖 A 的结果)
// 3. Agent A 回应 (依赖 B 的审查)
// 4. 循环 2-3 直到 maxRounds
// 5. Agent C 裁判 (依赖完整辩论记录)
```

性能考量：
- 每轮辩论需要 2-3 次 LLM 调用
- 3 轮辩论 = 7 次 API 调用（1 提议 + 3 审查 + 3 回应 + 1 裁判 = 8 次）
- 估算耗时：每次调用 5-15 秒，总计 40-120 秒
- 用户需要实时看到进度（流式展示每个 Agent 的思考过程）

#### 2.2.2 状态管理

辩论状态机：

```
IDLE → PROPOSING → CHALLENGING → DEFENDING → 
  ↑________________________________________|  (循环直到 maxRounds)
                                            ↓
                                         JUDGING → COMPLETE
```

每个状态转换都需要：
- 更新 UI 状态
- 保存中间结果到 IndexedDB
- 触发下一步的 LLM 调用

### 2.3 标注验证系统

#### 2.3.1 纯前端分享方案

挑战：纯前端应用如何实现多人标注？

方案 A：**URL 编码方案**
- 将验证问题序列化为 JSON → base64 → URL 参数
- 问题：URL 长度限制（~2000 字符），大型本体的验证问题可能有几十个
- 适合：小规模验证（< 20 个问题）

方案 B：**IndexedDB + 手动合并**
- 每个专家在自己的浏览器上标注，导出 JSON 文件
- 发起者汇总所有 JSON 文件，系统自动合并和统计
- 适合：当前纯前端架构

方案 C：**轻量后端（推荐）**
- 用 Cloudflare Workers/KV 或 Firebase Realtime DB 存储共享标注数据
- 生成唯一的分享 URL
- 实时同步所有专家的标注结果
- 优点：真正的多人实时协作
- 成本：极低（KV 免费额度足够）

v2 方案：同时支持 B 和 C。默认提供 B（纯前端），可选配置 C（需要用户提供 Firebase 或 Cloudflare 配置）。

#### 2.3.2 共识度计算

```typescript
interface ConsensusMetrics {
  // 简单一致率：相同答案占比
  simpleAgreement: number;        // 0-1
  
  // Fleiss' Kappa：校正随机一致的多标注者一致性
  fleissKappa: number;            // -1 到 1，> 0.61 为实质性一致
  
  // 共识阈值
  consensusThreshold: number;     // 默认 0.7（70% 以上选择相同答案）
  
  // 争议标记
  isDisputed: boolean;            // simpleAgreement < threshold
  
  // 信心权重（基于专家资历）
  weightedAgreement: number;      // 加权一致率
}
```

### 2.4 图可视化技术栈

| 图类型 | 推荐库 | 理由 |
|---|---|---|
| 知识图谱（Neo4j 风格） | React Flow | v1 已使用，生态丰富，性能好 |
| 属性图视图 | React Flow + 自定义节点 | 复用 React Flow，扩展节点展示属性 |
| 层级树状图 | D3.js (d3-hierarchy) | 专业的树状布局算法 |
| 关系矩阵/热力图 | D3.js 或 Recharts | D3 灵活度高，Recharts 更简单 |
| 时序流程图 | React Flow (dagre 布局) | 复用 React Flow，用 dagre 做层级布局 |
| 统计仪表盘 | Recharts | React 生态，声明式 API |

性能基准：
- React Flow：1000 节点流畅，5000 节点需要虚拟化
- D3.js：取决于 DOM 节点数，SVG 方案 2000 节点无压力
- 图片导出：html2canvas（PNG）或 svg 序列化（SVG）

---

## 3. 竞品分析

### 3.1 相关工具对比

| 特性 | Ontology Miner v1 | Protégé | WebVOWL | OntoGPT |
|---|---|---|---|---|
| LLM 驱动 | ✅ | ❌ | ❌ | ✅ |
| 交互式 | ✅ | ✅ | 只读 | CLI |
| 多 Agent | ❌ | ❌ | ❌ | ❌ |
| 标注验证 | ❌ | ❌ | ❌ | ❌ |
| 多源输入 | ❌ | 手动 | ❌ | 文本 |
| Web 应用 | ✅ | ❌ (Java) | ✅ | ❌ |
| 多图类型 | 单一 | 多种 | 单一 | ❌ |

v2 的差异化：**唯一一个同时具备 LLM 驱动 + 多 Agent 辩论 + 人类标注验证 + 多图可视化的 Web 本体工具**

### 3.2 设计灵感来源

| 灵感来源 | 借鉴点 |
|---|---|
| Label Studio | 标注 UI 模式、IAA 指标、审查流程 |
| Prodigy | 最小化认知负担、键盘操作、进度可见 |
| Neo4j Browser | 知识图谱交互、节点详情面板 |
| Figma | 多人协作的实时光标、评论系统 |
| ChatGPT | 流式输出、思考过程展示 |
| Notion | 多种视图切换（表格/看板/日历/画廊） |

---

## 4. 风险评估

| 风险 | 影响 | 概率 | 缓解策略 |
|---|---|---|---|
| LLM API 成本过高（辩论模式） | 高 | 中 | 可配置辩论轮数，低优先级步骤跳过辩论 |
| 公共 CORS Proxy 不稳定 | 中 | 中 | 支持自定义 proxy，备选多个公共 proxy |
| 纯前端分享方案体验差 | 中 | 高 | 提供 Firebase/Cloudflare 可选后端 |
| 大型本体图谱渲染卡顿 | 高 | 低 | React Flow 虚拟化、分层渲染、LOD |
| 多模型 API 格式差异 | 中 | 中 | Provider 抽象层统一接口 |
| 自动模式下 LLM 产出质量不可控 | 高 | 中 | 辩论机制作为质量保障，标注验证作为最终兜底 |
| 专家标注参与率低 | 中 | 高 | 简化标注界面，支持异步标注，邮件/链接提醒 |
