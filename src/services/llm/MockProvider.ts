import type { ILLMProvider, LLMProviderConfig, LLMRequest, LLMResponse, LLMChunk } from '../../types/llm';

export class MockProvider implements ILLMProvider {
  readonly name = 'Mock';
  private _delay = 600;

  configure(_config: LLMProviderConfig): void {}

  private async delay(ms?: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms ?? this._delay));
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    await this.delay();
    const content = this.getMockResponse(request);
    return {
      content,
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      finishReason: 'stop',
    };
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMChunk> {
    const content = this.getMockResponse(request);
    const words = content.split('');
    for (let i = 0; i < words.length; i++) {
      await this.delay(3);
      yield { delta: words[i], done: i === words.length - 1 };
    }
  }

  async validate(): Promise<boolean> {
    return true;
  }

  private getMockResponse(request: LLMRequest): string {
    const prompt = request.userPrompt.toLowerCase();
    const system = request.systemPrompt.toLowerCase();

    // v2 debate prompts
    if (system.includes('critical ontology reviewer') || prompt.includes('challenger')) {
      return JSON.stringify(this.mockChallengerResponse());
    }
    if (system.includes('defending your work') || prompt.includes('defender')) {
      return JSON.stringify(this.mockDefenderResponse());
    }
    if (system.includes('final arbiter') || prompt.includes('judge')) {
      return JSON.stringify(this.mockJudgeResponse());
    }
    if (system.includes('ontology validation') || prompt.includes('validation questions')) {
      return JSON.stringify(this.mockValidationQuestions());
    }

    // v1 prompts (enhanced for v2)
    if (prompt.includes('competency questions to expand')) {
      return JSON.stringify(this.mockCQExpansion());
    }
    if (prompt.includes('generate exactly') || prompt.includes('competency questions')) {
      return JSON.stringify(this.mockCQGeneration());
    }
    if (prompt.includes('extract') && (prompt.includes('ontology') || prompt.includes('comprehensive'))) {
      return JSON.stringify(this.mockOntologyExtraction());
    }
    if (prompt.includes('drill down') || prompt.includes('generate sub-concepts')) {
      return JSON.stringify(this.mockDrillDown());
    }
    if (prompt.includes('identify business workflows') || prompt.includes('workflow')) {
      return JSON.stringify(this.mockWorkflowExtraction());
    }
    if (prompt.includes('infer additional relationships') || prompt.includes('infer')) {
      return JSON.stringify(this.mockRelationInference());
    }
    if (prompt.includes('review this ontology')) {
      return JSON.stringify(this.mockCompletenessCheck());
    }

    return JSON.stringify({ message: 'Mock response' });
  }

  // ========== v2 Enhanced CQ Generation (15-20 CQs, 7 categories) ==========
  private mockCQGeneration() {
    return {
      cqs: [
        { text: '该领域中存在哪些核心实体和它们的基本属性？', category: 'foundational', importance: 'high', relevanceScore: 0.98, relatedConcepts: ['实体', '属性', '分类'], dependsOnCQs: [], expectedAnswerComplexity: 'moderate' },
        { text: '不同实体之间存在哪些层级关系（如包含、从属）？', category: 'relationship', importance: 'high', relevanceScore: 0.96, relatedConcepts: ['层级', '包含', '从属'], dependsOnCQs: [0], expectedAnswerComplexity: 'complex' },
        { text: '该领域的业务边界和范围如何界定？', category: 'scoping', importance: 'high', relevanceScore: 0.95, relatedConcepts: ['边界', '范围', '上下文'], dependsOnCQs: [], expectedAnswerComplexity: 'moderate' },
        { text: '核心业务流程包含哪些步骤和参与者？', category: 'process', importance: 'high', relevanceScore: 0.94, relatedConcepts: ['流程', '步骤', '参与者'], dependsOnCQs: [0], expectedAnswerComplexity: 'complex' },
        { text: '存在哪些业务规则和约束条件？', category: 'constraint', importance: 'high', relevanceScore: 0.93, relatedConcepts: ['规则', '约束', '条件'], dependsOnCQs: [0, 3], expectedAnswerComplexity: 'moderate' },
        { text: '不同角色的用户如何与系统交互？', category: 'process', importance: 'medium', relevanceScore: 0.90, relatedConcepts: ['角色', '用户', '交互'], dependsOnCQs: [0], expectedAnswerComplexity: 'moderate' },
        { text: '数据在不同实体间如何流转和变换？', category: 'relationship', importance: 'medium', relevanceScore: 0.89, relatedConcepts: ['数据流', '转换', '传递'], dependsOnCQs: [0, 1], expectedAnswerComplexity: 'complex' },
        { text: '哪些实体的状态会发生变化？变化的触发条件是什么？', category: 'temporal', importance: 'high', relevanceScore: 0.92, relatedConcepts: ['状态', '变化', '触发'], dependsOnCQs: [0], expectedAnswerComplexity: 'complex' },
        { text: '不同实体的生命周期是怎样的？', category: 'temporal', importance: 'medium', relevanceScore: 0.87, relatedConcepts: ['生命周期', '创建', '销毁'], dependsOnCQs: [0, 7], expectedAnswerComplexity: 'moderate' },
        { text: '有哪些外部系统或接口需要集成？', category: 'scoping', importance: 'medium', relevanceScore: 0.85, relatedConcepts: ['外部系统', '集成', '接口'], dependsOnCQs: [2], expectedAnswerComplexity: 'simple' },
        { text: '核心业务的关键绩效指标（KPI）有哪些？', category: 'quality', importance: 'high', relevanceScore: 0.91, relatedConcepts: ['KPI', '指标', '绩效'], dependsOnCQs: [3], expectedAnswerComplexity: 'moderate' },
        { text: '业务操作的时序依赖关系是什么？', category: 'temporal', importance: 'medium', relevanceScore: 0.86, relatedConcepts: ['时序', '依赖', '顺序'], dependsOnCQs: [3, 7], expectedAnswerComplexity: 'complex' },
        { text: '哪些数据需要满足特定的格式或范围约束？', category: 'constraint', importance: 'medium', relevanceScore: 0.84, relatedConcepts: ['格式', '范围', '验证'], dependsOnCQs: [0, 4], expectedAnswerComplexity: 'moderate' },
        { text: '如何衡量数据质量和完整性？', category: 'quality', importance: 'medium', relevanceScore: 0.83, relatedConcepts: ['数据质量', '完整性', '准确性'], dependsOnCQs: [0, 10], expectedAnswerComplexity: 'moderate' },
        { text: '不同概念之间是否存在组合或聚合关系？', category: 'relationship', importance: 'medium', relevanceScore: 0.82, relatedConcepts: ['组合', '聚合', '构成'], dependsOnCQs: [0, 1], expectedAnswerComplexity: 'moderate' },
      ],
    };
  }

  // ========== v2 Enhanced CQ Expansion ==========
  private mockCQExpansion() {
    return {
      expansions: [
        {
          cqIndex: 0,
          expansion: '在该领域中，核心实体构成了整个知识体系的基础。每个实体都有其独特的属性集合，包括标识属性、描述属性和状态属性。核心实体包括业务对象（订单、产品、客户）、组织单元（部门、团队）、资源（设备、场地、车辆）、以及规则（业务规则、约束条件）。每个实体需要详细的属性定义，包括数据类型（string, number, enum, date等）、是否必填、约束条件和示例值。这些实体及其属性是构建领域本体的基础。',
          subQuestions: ['哪些实体是业务运营中不可或缺的？', '每个核心实体有哪些关键属性？', '如何唯一标识每个实体？', '实体的属性中哪些是必填的？', '有哪些枚举类型的属性？'],
          extractedConcepts: ['订单', '产品', '客户', '部门', '团队', '设备', '场地', '车辆', '仓库', '库位'],
          extractedRelations: ['客户 --下单--> 订单', '订单 --包含--> 产品', '部门 --管理--> 团队', '仓库 --包含--> 库位', '车辆 --运输--> 订单'],
        },
        {
          cqIndex: 1,
          expansion: '层级关系是本体结构中最重要的关系类型之一。在该领域中，层级关系主要体现在：组织层级（公司→部门→团队→个人）、分类层级（类别→子类别→具体项目）、空间层级（区域→仓库→库区→库位）。包含关系、从属关系、继承关系、组合关系等17种关系类型需要全面识别。理清这些层级关系有助于建立清晰的本体层次结构。',
          subQuestions: ['组织结构中有几个层级？', '产品分类体系是怎样的？', '物理空间如何分层管理？', '概念之间是否有继承关系？'],
          extractedConcepts: ['组织', '分类', '区域', '库区', '供应商'],
          extractedRelations: ['公司 --包含--> 部门', '部门 --包含--> 团队', '仓库 --包含--> 库区', '库区 --包含--> 库位', '供应商 --供应--> 产品'],
        },
      ],
    };
  }

  // ========== v2 Enhanced Ontology Extraction (10-20 concepts, detailed props) ==========
  private mockOntologyExtraction() {
    return {
      concepts: [
        {
          name: '组织', description: '参与业务运营的组织实体', aliases: ['机构', 'Organization'], ontologyLayer: 'upper', confidence: 0.97,
          properties: [
            { name: '名称', description: '组织正式名称', dataType: 'string', isRequired: true, constraints: '最长100字符', exampleValues: ['XX物流公司', '华东分部'] },
            { name: '类型', description: '组织类型', dataType: 'enum', isRequired: true, constraints: 'enum: [公司, 部门, 团队, 分支机构]', exampleValues: ['公司', '部门'] },
            { name: '层级', description: '在组织架构中的层级深度', dataType: 'number', isRequired: true, constraints: '正整数, 0=顶层', exampleValues: ['0', '1', '2'] },
            { name: '成立日期', description: '组织成立日期', dataType: 'date', isRequired: false, constraints: '不早于1900年', exampleValues: ['2020-01-15'] },
          ],
        },
        {
          name: '人员', description: '参与业务的人员，含员工、管理者、客户联系人', aliases: ['用户', 'Person'], ontologyLayer: 'upper', confidence: 0.96,
          properties: [
            { name: '姓名', description: '人员姓名', dataType: 'string', isRequired: true, constraints: '2-50字符', exampleValues: ['张三', 'John Smith'] },
            { name: '工号', description: '员工唯一编号', dataType: 'string', isRequired: true, constraints: '格式: EMP-XXXX', exampleValues: ['EMP-0001', 'EMP-0245'] },
            { name: '角色', description: '业务角色', dataType: 'enum', isRequired: true, constraints: 'enum: [管理员, 操作员, 客服, 司机, 仓管员]', exampleValues: ['管理员', '操作员'] },
            { name: '联系电话', description: '联系电话', dataType: 'string', isRequired: false, constraints: '有效手机号/座机', exampleValues: ['13800138000'] },
          ],
        },
        {
          name: '产品', description: '业务中涉及的产品或商品', aliases: ['商品', 'Product', 'SKU'], ontologyLayer: 'domain', confidence: 0.98,
          properties: [
            { name: 'SKU', description: '产品唯一标识符', dataType: 'string', isRequired: true, constraints: '全局唯一', exampleValues: ['SKU-2024-001', 'PRD-A100'] },
            { name: '名称', description: '产品名称', dataType: 'string', isRequired: true, constraints: '最长200字符', exampleValues: ['电子元件A', '包装材料B'] },
            { name: '分类', description: '产品分类', dataType: 'string', isRequired: true, constraints: '多级分类用/分隔', exampleValues: ['电子/元器件/芯片', '包装/纸箱'] },
            { name: '单价', description: '产品单价', dataType: 'money', isRequired: true, constraints: '正数, 精度0.01', exampleValues: ['99.99', '1500.00'] },
            { name: '重量', description: '产品重量(kg)', dataType: 'number', isRequired: false, constraints: '正数', exampleValues: ['0.5', '25.0'] },
            { name: '状态', description: '产品状态', dataType: 'enum', isRequired: true, constraints: 'enum: [在售, 下架, 缺货, 预售]', exampleValues: ['在售', '缺货'] },
          ],
        },
        {
          name: '订单', description: '业务交易的核心实体', aliases: ['交易', 'Order'], ontologyLayer: 'domain', confidence: 0.99,
          properties: [
            { name: '订单号', description: '订单唯一标识', dataType: 'string', isRequired: true, constraints: '格式: ORD-YYYYMMDD-XXXX', exampleValues: ['ORD-20240315-0001'] },
            { name: '状态', description: '订单状态', dataType: 'enum', isRequired: true, constraints: 'enum: [待确认, 已确认, 处理中, 已发货, 已完成, 已取消]', exampleValues: ['待确认', '处理中'] },
            { name: '创建时间', description: '订单创建时间', dataType: 'datetime', isRequired: true, constraints: 'ISO 8601', exampleValues: ['2024-03-15T10:30:00Z'] },
            { name: '总金额', description: '订单总金额', dataType: 'money', isRequired: true, constraints: '正数', exampleValues: ['5999.00', '128.50'] },
            { name: '预计交付日期', description: '预计交付日期', dataType: 'date', isRequired: false, constraints: '不早于创建日期', exampleValues: ['2024-03-20'] },
            { name: '优先级', description: '处理优先级', dataType: 'enum', isRequired: true, constraints: 'enum: [紧急, 高, 中, 低]', exampleValues: ['中', '高'] },
          ],
        },
        {
          name: '客户', description: '业务的客户方', aliases: ['Customer', '甲方'], ontologyLayer: 'domain', confidence: 0.97,
          properties: [
            { name: '名称', description: '客户名称', dataType: 'string', isRequired: true, constraints: '最长200字符', exampleValues: ['XX贸易公司', '李四'] },
            { name: '类型', description: '客户类型', dataType: 'enum', isRequired: true, constraints: 'enum: [企业客户, 个人客户, 代理商]', exampleValues: ['企业客户'] },
            { name: '等级', description: '客户等级', dataType: 'enum', isRequired: false, constraints: 'enum: [VIP, 金牌, 银牌, 普通, 新客]', exampleValues: ['VIP', '普通'] },
            { name: '信用额度', description: '客户信用额度', dataType: 'money', isRequired: false, constraints: '非负数', exampleValues: ['100000.00', '50000.00'] },
          ],
        },
        {
          name: '仓库', description: '存储和管理货物的物理场所', aliases: ['Warehouse', '库房'], ontologyLayer: 'domain', confidence: 0.95,
          properties: [
            { name: '名称', description: '仓库名称', dataType: 'string', isRequired: true, constraints: '最长100字符', exampleValues: ['华东1号仓', '深圳中心仓'] },
            { name: '地址', description: '物理地址', dataType: 'string', isRequired: true, constraints: '完整地址', exampleValues: ['上海市浦东新区XX路100号'] },
            { name: '面积', description: '仓库面积(平方米)', dataType: 'number', isRequired: true, constraints: '正数', exampleValues: ['5000', '12000'] },
            { name: '类型', description: '仓库类型', dataType: 'enum', isRequired: true, constraints: 'enum: [常温, 冷藏, 冷冻, 危化品]', exampleValues: ['常温', '冷藏'] },
          ],
        },
        {
          name: '库位', description: '仓库中的具体存储位置', aliases: ['货位', 'Location', 'Bin'], ontologyLayer: 'domain', confidence: 0.94,
          properties: [
            { name: '编号', description: '库位编号', dataType: 'string', isRequired: true, constraints: '格式: A-01-02-03', exampleValues: ['A-01-02-03', 'B-03-01-01'] },
            { name: '容量', description: '最大存储容量', dataType: 'number', isRequired: true, constraints: '正数', exampleValues: ['100', '500'] },
            { name: '状态', description: '库位状态', dataType: 'enum', isRequired: true, constraints: 'enum: [空闲, 占用, 锁定, 维护中]', exampleValues: ['空闲', '占用'] },
          ],
        },
        {
          name: '车辆', description: '用于运输的车辆', aliases: ['Vehicle', '运输工具'], ontologyLayer: 'domain', confidence: 0.92,
          properties: [
            { name: '车牌号', description: '车辆牌照号码', dataType: 'string', isRequired: true, constraints: '有效车牌格式', exampleValues: ['沪A12345', '粤B67890'] },
            { name: '类型', description: '车辆类型', dataType: 'enum', isRequired: true, constraints: 'enum: [厢式货车, 冷藏车, 平板车, 小面包]', exampleValues: ['厢式货车'] },
            { name: '载重', description: '最大载重(吨)', dataType: 'number', isRequired: true, constraints: '正数', exampleValues: ['5', '10', '20'] },
            { name: '状态', description: '车辆状态', dataType: 'enum', isRequired: true, constraints: 'enum: [空闲, 运输中, 维修中, 停用]', exampleValues: ['空闲'] },
          ],
        },
        {
          name: '运输单', description: '运输任务的记录', aliases: ['运单', 'Shipment'], ontologyLayer: 'domain', confidence: 0.93,
          properties: [
            { name: '运单号', description: '运输单号', dataType: 'string', isRequired: true, constraints: '格式: SHP-XXXX', exampleValues: ['SHP-20240315-001'] },
            { name: '状态', description: '运输状态', dataType: 'enum', isRequired: true, constraints: 'enum: [待发车, 运输中, 已到达, 已签收, 异常]', exampleValues: ['运输中'] },
            { name: '预计到达时间', description: '预计送达时间', dataType: 'datetime', isRequired: false, constraints: 'ISO 8601', exampleValues: ['2024-03-16T14:00:00Z'] },
            { name: '运费', description: '运输费用', dataType: 'money', isRequired: true, constraints: '非负数', exampleValues: ['350.00', '1200.00'] },
          ],
        },
        {
          name: '供应商', description: '提供产品或服务的供应方', aliases: ['Supplier', '货源方'], ontologyLayer: 'domain', confidence: 0.91,
          properties: [
            { name: '名称', description: '供应商名称', dataType: 'string', isRequired: true, constraints: '最长200字符', exampleValues: ['XX制造厂'] },
            { name: '评级', description: '供应商评级', dataType: 'enum', isRequired: false, constraints: 'enum: [A, B, C, D]', exampleValues: ['A', 'B'] },
            { name: '合作状态', description: '合作状态', dataType: 'enum', isRequired: true, constraints: 'enum: [合作中, 暂停, 终止]', exampleValues: ['合作中'] },
          ],
        },
        {
          name: '库存记录', description: '产品在库位的库存信息', aliases: ['Inventory', '存货'], ontologyLayer: 'task', confidence: 0.93,
          properties: [
            { name: '数量', description: '当前库存数量', dataType: 'number', isRequired: true, constraints: '非负整数', exampleValues: ['100', '0', '5000'] },
            { name: '批次号', description: '批次编号', dataType: 'string', isRequired: false, constraints: '唯一', exampleValues: ['BAT-2024-001'] },
            { name: '入库时间', description: '入库时间', dataType: 'datetime', isRequired: true, constraints: 'ISO 8601', exampleValues: ['2024-03-10T08:00:00Z'] },
            { name: '保质期', description: '到期日期', dataType: 'date', isRequired: false, constraints: '晚于入库日期', exampleValues: ['2025-03-10'] },
          ],
        },
        {
          name: '业务规则', description: '业务运营的规则和约束', aliases: ['Rule', '约束'], ontologyLayer: 'domain', confidence: 0.90,
          properties: [
            { name: '名称', description: '规则名称', dataType: 'string', isRequired: true, exampleValues: ['最低起订量', '优先发货规则'] },
            { name: '描述', description: '规则详细描述', dataType: 'string', isRequired: true, exampleValues: ['VIP客户订单优先处理'] },
            { name: '优先级', description: '规则优先级', dataType: 'enum', isRequired: true, constraints: 'enum: [高, 中, 低]', exampleValues: ['高', '中'] },
            { name: '生效日期', description: '规则生效日期', dataType: 'date', isRequired: false, exampleValues: ['2024-01-01'] },
          ],
        },
      ],
      relations: [
        { name: '下属于', description: '人员属于组织', sourceConcept: '人员', targetConcept: '组织', cardinality: 'N:1', relationType: 'part_of', confidence: 0.96, evidence: '员工隶属于组织部门', inferenceType: 'direct' },
        { name: '下单', description: '客户创建订单', sourceConcept: '客户', targetConcept: '订单', cardinality: '1:N', relationType: 'triggers', confidence: 0.98, evidence: '订单由客户发起', inferenceType: 'direct' },
        { name: '包含产品', description: '订单包含产品', sourceConcept: '订单', targetConcept: '产品', cardinality: 'N:M', relationType: 'has_a', confidence: 0.97, evidence: '一个订单可包含多种产品', inferenceType: 'direct' },
        { name: '包含库位', description: '仓库包含多个库位', sourceConcept: '仓库', targetConcept: '库位', cardinality: '1:N', relationType: 'composed_of', confidence: 0.98, evidence: '仓库由库位组成', inferenceType: 'direct' },
        { name: '存储于', description: '库存记录关联库位', sourceConcept: '库存记录', targetConcept: '库位', cardinality: 'N:1', relationType: 'associated_with', confidence: 0.95, evidence: '库存存放在特定库位', inferenceType: 'direct' },
        { name: '记录产品', description: '库存记录对应产品', sourceConcept: '库存记录', targetConcept: '产品', cardinality: 'N:1', relationType: 'associated_with', confidence: 0.95, evidence: '每条库存记录对应一种产品', inferenceType: 'direct' },
        { name: '运输订单', description: '运输单关联订单', sourceConcept: '运输单', targetConcept: '订单', cardinality: 'N:1', relationType: 'associated_with', confidence: 0.94, evidence: '运输单服务于订单', inferenceType: 'direct' },
        { name: '使用车辆', description: '运输单使用车辆', sourceConcept: '运输单', targetConcept: '车辆', cardinality: 'N:1', relationType: 'consumes', confidence: 0.93, evidence: '运输需要车辆', inferenceType: 'direct' },
        { name: '供应', description: '供应商提供产品', sourceConcept: '供应商', targetConcept: '产品', cardinality: 'N:M', relationType: 'produces', confidence: 0.92, evidence: '供应商生产和供应产品', inferenceType: 'direct' },
        { name: '约束流程', description: '规则约束业务操作', sourceConcept: '业务规则', targetConcept: '订单', cardinality: 'N:M', relationType: 'constrains', confidence: 0.88, evidence: '业务规则约束订单处理', inferenceType: 'direct' },
        { name: '服务', description: '组织服务客户', sourceConcept: '组织', targetConcept: '客户', cardinality: 'N:M', relationType: 'associated_with', confidence: 0.91, evidence: '组织为客户提供服务', inferenceType: 'direct' },
        { name: '管理仓库', description: '组织管理仓库', sourceConcept: '组织', targetConcept: '仓库', cardinality: '1:N', relationType: 'has_a', confidence: 0.90, evidence: '组织拥有和管理仓库', inferenceType: 'direct' },
        { name: '处理订单', description: '人员处理订单', sourceConcept: '人员', targetConcept: '订单', cardinality: 'N:M', relationType: 'triggers', confidence: 0.89, evidence: '操作员处理订单', inferenceType: 'direct' },
        { name: '驾驶', description: '人员驾驶车辆', sourceConcept: '人员', targetConcept: '车辆', cardinality: 'N:1', relationType: 'associated_with', confidence: 0.87, evidence: '司机驾驶运输车辆', inferenceType: 'direct' },
      ],
    };
  }

  // ========== v2 Enhanced Drill Down ==========
  private mockDrillDown() {
    return {
      shouldContinue: true,
      stopReason: null,
      subConcepts: [
        {
          name: '子类型A', description: '第一个子类型，代表更具体的分类', ontologyLayer: 'domain', confidence: 0.90,
          properties: [
            { name: '特征属性', description: '区分子类型的特征', dataType: 'string', isRequired: true, constraints: '唯一标识', exampleValues: ['特征值1', '特征值2'] },
            { name: '规格', description: '规格参数', dataType: 'string', isRequired: false, exampleValues: ['100x200', '标准'] },
          ],
        },
        {
          name: '子类型B', description: '第二个子类型', ontologyLayer: 'domain', confidence: 0.88,
          properties: [
            { name: '规格', description: '规格参数', dataType: 'string', isRequired: false, exampleValues: ['大型', '小型'] },
            { name: '适用范围', description: '适用的业务范围', dataType: 'enum', isRequired: true, constraints: 'enum: [通用, 专用]', exampleValues: ['通用'] },
          ],
        },
        {
          name: '子类型C', description: '第三个子类型，特殊场景变体', ontologyLayer: 'task', confidence: 0.85,
          properties: [
            { name: '场景', description: '适用的业务场景', dataType: 'enum', isRequired: true, constraints: 'enum: [常规, 紧急, 特殊]', exampleValues: ['紧急'] },
          ],
        },
      ],
      newRelations: [
        { name: '互补', sourceConcept: '子类型A', targetConcept: '子类型B', cardinality: '1:1', relationType: 'associated_with', confidence: 0.80, evidence: '两者互补使用' },
      ],
      additionalParentProperties: [
        { name: '子类型数量', description: '包含的子类型总数', dataType: 'number', isRequired: false },
      ],
    };
  }

  // ========== v2 Enhanced Workflow Extraction ==========
  private mockWorkflowExtraction() {
    return {
      workflows: [
        {
          name: '订单处理流程', description: '从客户下单到订单完成的完整业务流程',
          steps: [
            { name: '接收订单', description: '系统接收客户提交的新订单', order: 1, actorConcept: '客户', inputConcepts: ['产品'], outputConcepts: ['订单'], conditions: '客户已登录且产品有库存' },
            { name: '审核订单', description: '操作员审核订单完整性和合规性', order: 2, actorConcept: '人员', inputConcepts: ['订单', '业务规则'], outputConcepts: ['订单'], conditions: '订单已创建' },
            { name: '分配库存', description: '根据订单分配库存', order: 3, actorConcept: '人员', inputConcepts: ['订单', '库存记录', '库位'], outputConcepts: ['库存记录'], conditions: '订单已审核通过' },
            { name: '安排运输', description: '创建运输单并分配车辆', order: 4, actorConcept: '人员', inputConcepts: ['订单', '车辆'], outputConcepts: ['运输单'], conditions: '库存已分配' },
            { name: '执行配送', description: '司机执行配送任务', order: 5, actorConcept: '人员', inputConcepts: ['运输单', '车辆'], outputConcepts: ['运输单'], conditions: '运输单已创建' },
            { name: '确认签收', description: '客户确认签收', order: 6, actorConcept: '客户', inputConcepts: ['订单', '运输单'], outputConcepts: ['订单'], conditions: '货物已送达' },
          ],
          involvedConcepts: ['客户', '订单', '产品', '人员', '库存记录', '库位', '车辆', '运输单', '业务规则'],
        },
        {
          name: '入库流程', description: '产品入库的完整流程',
          steps: [
            { name: '到货验收', description: '检查到货数量和质量', order: 1, actorConcept: '人员', inputConcepts: ['产品', '供应商'], outputConcepts: [], conditions: '供应商已发货' },
            { name: '质量检验', description: '对产品进行质量检验', order: 2, actorConcept: '人员', inputConcepts: ['产品'], outputConcepts: [], conditions: '已完成验收' },
            { name: '分配库位', description: '为合格产品分配存储库位', order: 3, actorConcept: '人员', inputConcepts: ['产品', '库位', '仓库'], outputConcepts: ['库位'], conditions: '质检通过' },
            { name: '上架入库', description: '将产品放入指定库位', order: 4, actorConcept: '人员', inputConcepts: ['产品', '库位'], outputConcepts: ['库存记录'], conditions: '库位已分配' },
          ],
          involvedConcepts: ['产品', '人员', '供应商', '库位', '仓库', '库存记录'],
        },
      ],
    };
  }

  // ========== v2 Enhanced Relation Inference ==========
  private mockRelationInference() {
    return {
      inferredRelations: [
        { name: '数据依赖', sourceConcept: '订单', targetConcept: '客户', cardinality: 'N:1', relationType: 'depends_on', reasoning: '订单创建依赖客户信息', confidence: 0.92, inferenceType: 'indirect' },
        { name: '时序依赖', sourceConcept: '运输单', targetConcept: '订单', cardinality: 'N:1', relationType: 'follows', reasoning: '运输单在订单确认后创建', confidence: 0.90, inferenceType: 'indirect' },
        { name: '管理', sourceConcept: '组织', targetConcept: '车辆', cardinality: '1:N', relationType: 'has_a', reasoning: '组织拥有和管理运输车辆', confidence: 0.88, inferenceType: 'indirect' },
        { name: '前序', sourceConcept: '库存记录', targetConcept: '运输单', cardinality: 'N:N', relationType: 'precedes', reasoning: '库存确认后才能安排运输', confidence: 0.85, inferenceType: 'indirect' },
        { name: '启用', sourceConcept: '业务规则', targetConcept: '库存记录', cardinality: 'N:M', relationType: 'enables', reasoning: '库存管理需遵循业务规则', confidence: 0.82, inferenceType: 'indirect' },
      ],
    };
  }

  private mockCompletenessCheck() {
    return {
      issues: [
        { type: 'missing_property', severity: 'medium', description: '产品概念缺少"库存数量"汇总属性', suggestion: '添加"库存总量"计算属性', affectedElements: ['产品'] },
        { type: 'missing_relation', severity: 'low', description: '客户和仓库之间缺少关联', suggestion: '添加"指定仓库"关系，不同客户可能有指定仓库', affectedElements: ['客户', '仓库'] },
        { type: 'missing_concept', severity: 'medium', description: '缺少"费用"或"账单"概念', suggestion: '添加"费用明细"概念以跟踪业务费用', affectedElements: [] },
      ],
    };
  }

  // ========== v2 Debate Mock Responses ==========
  private mockChallengerResponse() {
    return {
      agreements: [
        '核心实体识别全面，涵盖了组织、人员、产品、订单等关键概念',
        '关系类型使用正确，层级关系清晰',
        '属性定义详细，数据类型和约束合理',
      ],
      challenges: [
        { target: '库存记录', issue: '缺少"预警阈值"属性，无法支持库存预警功能', severity: 'major' as const, suggestion: '添加 minimumStock (number) 和 maximumStock (number) 属性', evidence: '库存管理的核心需求之一是库存预警' },
        { target: '运输单-订单关系', issue: '关系基数应为 N:N 而非 N:1，一个运输单可能包含多个订单', severity: 'major' as const, suggestion: '将关系基数改为 N:M，支持合单运输', evidence: '物流实践中经常将同方向的多个订单合并运输' },
        { target: '车辆', issue: '缺少"GPS位置"属性，无法支持车辆追踪', severity: 'minor' as const, suggestion: '添加 currentLocation (geo) 属性', evidence: '现代物流需要实时追踪车辆位置' },
      ],
      additions: [
        '缺少"退货单"概念 — 逆向物流是重要业务场景',
        '缺少"收货地址"概念 — 应该独立于客户，支持多地址',
      ],
    };
  }

  private mockDefenderResponse() {
    return {
      responses: [
        { challengeTarget: '库存记录', decision: 'accept' as const, reasoning: '库存预警确实是核心需求，添加阈值属性是合理的', modification: '添加 minimumStock 和 maximumStock 属性' },
        { challengeTarget: '运输单-订单关系', decision: 'accept' as const, reasoning: '合单运输是常见场景，需要支持 N:M', modification: '将基数从 N:1 改为 N:M' },
        { challengeTarget: '车辆', decision: 'modify' as const, reasoning: 'GPS 追踪有价值但不应该是核心属性，建议设为可选', modification: '添加 currentLocation (geo, optional) 属性' },
      ],
      updatedResult: {
        concepts: [],
        relations: [],
      },
    };
  }

  private mockJudgeResponse() {
    return {
      verdicts: [
        { item: '库存记录-预警阈值', consensusType: 'unanimous' as const, finalDecision: '添加 minimumStock 和 maximumStock', reasoning: '双方一致同意', confidence: 0.98 },
        { item: '运输单-订单基数', consensusType: 'unanimous' as const, finalDecision: '改为 N:M', reasoning: '合单运输是常见需求', confidence: 0.95 },
        { item: '车辆GPS属性', consensusType: 'debated' as const, finalDecision: '添加为可选属性', reasoning: 'Proposer 接受但设为可选，合理折中', confidence: 0.85 },
        { item: '退货单概念', consensusType: 'debated' as const, finalDecision: '建议在后续迭代中添加', reasoning: '重要但不影响核心模型', confidence: 0.80 },
        { item: '收货地址概念', consensusType: 'debated' as const, finalDecision: '添加为独立概念', reasoning: '多地址是常见需求', confidence: 0.88 },
      ],
      finalResult: {
        concepts: [],
        relations: [],
      },
    };
  }

  // ========== v2 Validation Questions ==========
  private mockValidationQuestions() {
    return {
      questions: [
        { questionType: 'boolean', text: '以下关系是否正确："仓库" 包含 "库位"？', difficulty: 'easy', domains: ['仓储'], relatedConceptIds: [], relatedRelationIds: [] },
        { questionType: 'boolean', text: '以下关系是否正确："客户" 下单创建 "订单"？', difficulty: 'easy', domains: ['交易'], relatedConceptIds: [], relatedRelationIds: [] },
        { questionType: 'boolean', text: '以下关系是否正确："供应商" 直接管理 "库位"？', difficulty: 'medium', domains: ['仓储', '供应链'], relatedConceptIds: [], relatedRelationIds: [] },
        { questionType: 'multiple_choice', text: '"订单" 和 "产品" 之间的关系最准确的描述是？', difficulty: 'medium', domains: ['交易'],
          options: [
            { id: 'a', text: '包含 (contains)' },
            { id: 'b', text: '关联 (associated with)' },
            { id: 'c', text: '继承 (inherits from)' },
            { id: 'd', text: '组成部分 (part of)' },
            { id: 'e', text: '无直接关系' },
          ],
        },
        { questionType: 'multiple_choice', text: '"库存记录" 和 "库位" 之间的关系最准确的描述是？', difficulty: 'medium', domains: ['仓储'],
          options: [
            { id: 'a', text: '存储于 (stored in)' },
            { id: 'b', text: '包含 (contains)' },
            { id: 'c', text: '管理 (manages)' },
            { id: 'd', text: '创建 (creates)' },
          ],
        },
        { questionType: 'ranking', text: '请按重要性排列以下概念（最重要的排在前面）：', difficulty: 'hard', domains: ['核心业务'],
          rankingItems: [
            { id: '1', text: '订单' },
            { id: '2', text: '客户' },
            { id: '3', text: '产品' },
            { id: '4', text: '仓库' },
            { id: '5', text: '运输单' },
          ],
        },
        { questionType: 'open_ended', text: '您认为 "订单处理流程" 还缺少哪些步骤？', context: '当前步骤：接收订单 → 审核订单 → 分配库存 → 安排运输 → 执行配送 → 确认签收', difficulty: 'hard', domains: ['流程优化'] },
        { questionType: 'boolean', text: '"运输单" 创建后必须在 "订单" 确认之后，这个时序关系是否正确？', difficulty: 'medium', domains: ['流程', '时序'] },
      ],
    };
  }
}
