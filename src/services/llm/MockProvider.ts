import type { ILLMProvider, LLMProviderConfig, LLMRequest, LLMResponse, LLMChunk } from '../../types/llm';

export class MockProvider implements ILLMProvider {
  readonly name = 'Mock';
  private _delay = 800;

  configure(_config: LLMProviderConfig): void {
    // Mock doesn't need configuration
  }

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
      await this.delay(5);
      yield { delta: words[i], done: i === words.length - 1 };
    }
  }

  async validate(): Promise<boolean> {
    return true;
  }

  private getMockResponse(request: LLMRequest): string {
    const prompt = request.userPrompt.toLowerCase();
    
    if (prompt.includes('competency questions') || prompt.includes('generate exactly')) {
      return JSON.stringify(this.mockCQGeneration());
    }
    if (prompt.includes('competency questions to expand') || prompt.includes('expand')) {
      return JSON.stringify(this.mockCQExpansion());
    }
    if (prompt.includes('extract the top-level ontology')) {
      return JSON.stringify(this.mockOntologyExtraction());
    }
    if (prompt.includes('drill down') || prompt.includes('generate sub-concepts')) {
      return JSON.stringify(this.mockDrillDown());
    }
    if (prompt.includes('identify business workflows')) {
      return JSON.stringify(this.mockWorkflowExtraction());
    }
    if (prompt.includes('infer additional relationships')) {
      return JSON.stringify(this.mockRelationInference());
    }
    if (prompt.includes('review this ontology')) {
      return JSON.stringify(this.mockCompletenessCheck());
    }
    
    return JSON.stringify({ message: 'Mock response for unknown prompt type' });
  }

  private mockCQGeneration() {
    return {
      cqs: [
        {
          text: '该领域中存在哪些核心实体和它们的基本属性？',
          category: 'foundational',
          importance: 'high',
          relatedConcepts: ['实体', '属性', '分类'],
        },
        {
          text: '不同实体之间存在哪些层级关系（如包含、从属）？',
          category: 'relationship',
          importance: 'high',
          relatedConcepts: ['层级', '包含', '从属'],
        },
        {
          text: '该领域的业务边界和范围如何界定？',
          category: 'scoping',
          importance: 'high',
          relatedConcepts: ['边界', '范围', '上下文'],
        },
        {
          text: '核心业务流程包含哪些步骤和参与者？',
          category: 'process',
          importance: 'high',
          relatedConcepts: ['流程', '步骤', '参与者'],
        },
        {
          text: '存在哪些业务规则和约束条件？',
          category: 'constraint',
          importance: 'medium',
          relatedConcepts: ['规则', '约束', '条件'],
        },
        {
          text: '不同角色的用户如何与系统交互？',
          category: 'process',
          importance: 'medium',
          relatedConcepts: ['角色', '用户', '交互'],
        },
        {
          text: '数据在不同实体间如何流转和变换？',
          category: 'relationship',
          importance: 'medium',
          relatedConcepts: ['数据流', '转换', '传递'],
        },
        {
          text: '哪些实体的状态会发生变化？变化的触发条件是什么？',
          category: 'process',
          importance: 'medium',
          relatedConcepts: ['状态', '变化', '触发'],
        },
        {
          text: '不同实体的生命周期是怎样的？',
          category: 'foundational',
          importance: 'low',
          relatedConcepts: ['生命周期', '创建', '销毁'],
        },
        {
          text: '有哪些外部系统或接口需要集成？',
          category: 'scoping',
          importance: 'low',
          relatedConcepts: ['外部系统', '集成', '接口'],
        },
      ],
    };
  }

  private mockCQExpansion() {
    return {
      expansions: [
        {
          cqIndex: 0,
          expansion: '在该领域中，核心实体构成了整个知识体系的基础。每个实体都有其独特的属性集合，这些属性定义了实体的特征和行为。核心实体通常包括业务对象（如订单、产品、客户）、组织单元（如部门、团队）、以及资源（如设备、场地）。每个实体的属性可以分为标识属性（唯一标识实体的属性）、描述属性（描述实体特征的属性）和状态属性（反映实体当前状态的属性）。理解这些实体及其属性是构建领域本体的第一步，也是后续发现关系和流程的基础。',
          subQuestions: [
            '哪些实体是业务运营中不可或缺的？',
            '每个核心实体有哪些关键属性？',
            '如何唯一标识每个实体？',
            '实体的属性中哪些是必填的，哪些是可选的？',
          ],
          extractedConcepts: ['订单', '产品', '客户', '部门', '团队', '设备', '场地'],
          extractedRelations: [
            '客户 --下单--> 订单',
            '订单 --包含--> 产品',
            '部门 --管理--> 团队',
          ],
        },
        {
          cqIndex: 1,
          expansion: '层级关系是本体结构中最重要的关系类型之一。在该领域中，层级关系主要体现在：组织层级（公司→部门→团队→个人）、分类层级（类别→子类别→具体项目）、以及空间层级（区域→建筑→楼层→房间）。包含关系表示一个实体由多个子实体组成，从属关系表示一个实体归属于另一个实体。理清这些层级关系有助于建立清晰的本体层次结构，避免概念重叠和遗漏。',
          subQuestions: [
            '组织结构中有几个层级？',
            '产品或资源的分类体系是怎样的？',
            '物理空间是如何分层管理的？',
          ],
          extractedConcepts: ['组织', '分类', '区域', '建筑'],
          extractedRelations: [
            '公司 --包含--> 部门',
            '部门 --包含--> 团队',
            '区域 --包含--> 建筑',
          ],
        },
      ],
    };
  }

  private mockOntologyExtraction() {
    return {
      concepts: [
        {
          name: '组织',
          description: '参与业务运营的组织实体，包括公司、部门、团队等',
          aliases: ['机构', 'Organization'],
          ontologyLayer: 'upper',
          properties: [
            { name: '名称', description: '组织的正式名称', dataType: 'string', isRequired: true, exampleValues: ['XX公司'] },
            { name: '类型', description: '组织类型', dataType: 'enum', isRequired: true, exampleValues: ['公司', '部门', '团队'] },
            { name: '层级', description: '在组织架构中的层级深度', dataType: 'number', isRequired: true },
          ],
        },
        {
          name: '人员',
          description: '参与业务的具体人员，包括员工、管理者、客户等',
          aliases: ['用户', 'Person'],
          ontologyLayer: 'upper',
          properties: [
            { name: '姓名', description: '人员姓名', dataType: 'string', isRequired: true },
            { name: '角色', description: '在业务中承担的角色', dataType: 'enum', isRequired: true, exampleValues: ['管理员', '操作员', '客户'] },
            { name: '联系方式', description: '邮箱或电话', dataType: 'string', isRequired: false },
          ],
        },
        {
          name: '产品',
          description: '业务中涉及的产品或商品',
          aliases: ['商品', 'Product'],
          ontologyLayer: 'domain',
          properties: [
            { name: 'SKU', description: '产品唯一标识符', dataType: 'string', isRequired: true },
            { name: '名称', description: '产品名称', dataType: 'string', isRequired: true },
            { name: '分类', description: '产品分类', dataType: 'string', isRequired: true },
            { name: '单价', description: '产品单价', dataType: 'number', isRequired: true },
            { name: '状态', description: '产品状态', dataType: 'enum', isRequired: true, exampleValues: ['在售', '下架', '缺货'] },
          ],
        },
        {
          name: '订单',
          description: '业务交易的核心实体，记录一次完整的业务操作',
          aliases: ['交易', 'Order'],
          ontologyLayer: 'domain',
          properties: [
            { name: '订单号', description: '订单唯一标识', dataType: 'string', isRequired: true },
            { name: '状态', description: '订单状态', dataType: 'enum', isRequired: true, exampleValues: ['待确认', '进行中', '已完成', '已取消'] },
            { name: '创建时间', description: '订单创建时间', dataType: 'datetime', isRequired: true },
            { name: '总金额', description: '订单总金额', dataType: 'number', isRequired: true },
          ],
        },
        {
          name: '客户',
          description: '业务的客户方，发起订单和需求的主体',
          aliases: ['Customer', '甲方'],
          ontologyLayer: 'domain',
          properties: [
            { name: '名称', description: '客户名称', dataType: 'string', isRequired: true },
            { name: '类型', description: '客户类型', dataType: 'enum', isRequired: true, exampleValues: ['企业客户', '个人客户'] },
            { name: '等级', description: '客户等级', dataType: 'enum', isRequired: false, exampleValues: ['VIP', '普通', '新客'] },
          ],
        },
        {
          name: '资源',
          description: '业务运营中使用的各类资源，包括设备、场地、工具等',
          aliases: ['Resource', '设施'],
          ontologyLayer: 'domain',
          properties: [
            { name: '名称', description: '资源名称', dataType: 'string', isRequired: true },
            { name: '类型', description: '资源类型', dataType: 'enum', isRequired: true, exampleValues: ['设备', '场地', '工具'] },
            { name: '状态', description: '当前使用状态', dataType: 'enum', isRequired: true, exampleValues: ['可用', '使用中', '维护中'] },
          ],
        },
        {
          name: '流程',
          description: '业务运营中的标准操作流程',
          aliases: ['Process', '业务流程'],
          ontologyLayer: 'upper',
          properties: [
            { name: '名称', description: '流程名称', dataType: 'string', isRequired: true },
            { name: '步骤数', description: '流程包含的步骤数量', dataType: 'number', isRequired: true },
            { name: '预估时长', description: '完成流程的预估时间', dataType: 'string', isRequired: false },
          ],
        },
        {
          name: '规则',
          description: '业务运营中需要遵守的规则和约束',
          aliases: ['Rule', '业务规则', '约束'],
          ontologyLayer: 'domain',
          properties: [
            { name: '名称', description: '规则名称', dataType: 'string', isRequired: true },
            { name: '描述', description: '规则详细描述', dataType: 'string', isRequired: true },
            { name: '优先级', description: '规则优先级', dataType: 'enum', isRequired: true, exampleValues: ['高', '中', '低'] },
          ],
        },
      ],
      relations: [
        { name: '下属于', description: '组织之间的从属关系', sourceConcept: '人员', targetConcept: '组织', cardinality: 'N:1', relationType: 'part_of' },
        { name: '下单', description: '客户创建订单', sourceConcept: '客户', targetConcept: '订单', cardinality: '1:N', relationType: 'triggers' },
        { name: '包含', description: '订单包含产品', sourceConcept: '订单', targetConcept: '产品', cardinality: 'N:M', relationType: 'has_a' },
        { name: '使用', description: '流程使用资源', sourceConcept: '流程', targetConcept: '资源', cardinality: 'N:M', relationType: 'consumes' },
        { name: '约束', description: '规则约束流程', sourceConcept: '规则', targetConcept: '流程', cardinality: 'N:M', relationType: 'depends_on' },
        { name: '执行', description: '人员执行流程', sourceConcept: '人员', targetConcept: '流程', cardinality: 'N:M', relationType: 'triggers' },
        { name: '服务', description: '组织服务于客户', sourceConcept: '组织', targetConcept: '客户', cardinality: 'N:M', relationType: 'associated_with' },
      ],
    };
  }

  private mockDrillDown() {
    return {
      shouldContinue: true,
      stopReason: null,
      subConcepts: [
        {
          name: '子类型A',
          description: '该概念的第一个子类型，代表更具体的分类',
          ontologyLayer: 'domain',
          properties: [
            { name: '特征属性', description: '区分子类型的特征', dataType: 'string', isRequired: true },
          ],
        },
        {
          name: '子类型B',
          description: '该概念的第二个子类型，代表另一种具体分类',
          ontologyLayer: 'domain',
          properties: [
            { name: '规格', description: '子类型的规格参数', dataType: 'string', isRequired: false },
          ],
        },
        {
          name: '子类型C',
          description: '该概念的第三个子类型，代表特殊场景下的变体',
          ontologyLayer: 'task',
          properties: [
            { name: '场景', description: '适用的业务场景', dataType: 'enum', isRequired: true },
          ],
        },
      ],
      newRelations: [
        { name: '继承', sourceConcept: '子类型A', targetConcept: '父概念', cardinality: '1:1', relationType: 'is_a' },
        { name: '继承', sourceConcept: '子类型B', targetConcept: '父概念', cardinality: '1:1', relationType: 'is_a' },
      ],
      additionalParentProperties: [
        { name: '子类型数量', description: '包含的子类型总数', dataType: 'number', isRequired: false },
      ],
    };
  }

  private mockWorkflowExtraction() {
    return {
      workflows: [
        {
          name: '订单处理流程',
          description: '从客户下单到订单完成的完整业务流程',
          steps: [
            { name: '接收订单', description: '系统接收客户提交的新订单', order: 1, actorConcept: '客户', inputConcepts: ['产品'], outputConcepts: ['订单'], conditions: '客户已登录且产品有库存' },
            { name: '审核订单', description: '操作员审核订单信息的完整性和合规性', order: 2, actorConcept: '人员', inputConcepts: ['订单', '规则'], outputConcepts: ['订单'], conditions: '订单已创建' },
            { name: '分配资源', description: '根据订单需求分配所需的资源', order: 3, actorConcept: '人员', inputConcepts: ['订单', '资源'], outputConcepts: ['资源'], conditions: '订单已审核通过' },
            { name: '执行操作', description: '按流程执行具体的业务操作', order: 4, actorConcept: '人员', inputConcepts: ['订单', '资源'], outputConcepts: ['订单'], conditions: '资源已分配' },
            { name: '完成确认', description: '确认订单已完成所有操作', order: 5, actorConcept: '人员', inputConcepts: ['订单'], outputConcepts: ['订单'], conditions: '所有操作步骤已完成' },
          ],
          involvedConcepts: ['客户', '订单', '产品', '人员', '资源', '规则'],
        },
        {
          name: '资源管理流程',
          description: '资源的申请、分配、使用和回收流程',
          steps: [
            { name: '资源申请', description: '提交资源使用申请', order: 1, actorConcept: '人员', inputConcepts: ['资源'], outputConcepts: [], conditions: null },
            { name: '审批分配', description: '管理员审批并分配资源', order: 2, actorConcept: '人员', inputConcepts: ['资源'], outputConcepts: ['资源'], conditions: '有可用资源' },
            { name: '使用监控', description: '监控资源使用情况', order: 3, actorConcept: null, inputConcepts: ['资源'], outputConcepts: [], conditions: '资源已分配' },
            { name: '回收归还', description: '使用完毕后回收资源', order: 4, actorConcept: '人员', inputConcepts: ['资源'], outputConcepts: ['资源'], conditions: '使用完毕' },
          ],
          involvedConcepts: ['人员', '资源', '组织'],
        },
      ],
    };
  }

  private mockRelationInference() {
    return {
      inferredRelations: [
        {
          name: '数据依赖',
          sourceConcept: '订单',
          targetConcept: '客户',
          cardinality: 'N:1',
          relationType: 'depends_on',
          reasoning: '订单的创建依赖于客户信息的存在，客户是订单的必要前提。从工作流分析中可以看出，接收订单步骤需要客户先登录。',
        },
        {
          name: '产出',
          sourceConcept: '流程',
          targetConcept: '订单',
          cardinality: '1:N',
          relationType: 'produces',
          reasoning: '从订单处理流程中可以看出，业务流程的执行会改变订单的状态，流程是订单状态变更的推动者。',
        },
        {
          name: '管理',
          sourceConcept: '组织',
          targetConcept: '资源',
          cardinality: '1:N',
          relationType: 'has_a',
          reasoning: '从资源管理流程可以推演出，资源属于特定组织管理，组织负责资源的分配和回收。',
        },
      ],
    };
  }

  private mockCompletenessCheck() {
    return {
      issues: [
        {
          type: 'missing_property',
          severity: 'medium',
          description: '产品概念缺少"库存数量"属性',
          suggestion: '添加"库存数量"属性（number类型，必填），用于跟踪产品可用量',
          affectedElements: ['产品'],
        },
        {
          type: 'missing_relation',
          severity: 'low',
          description: '客户和产品之间可能缺少"关注/收藏"关系',
          suggestion: '添加"关注"关系（客户→产品，N:M），记录客户对产品的兴趣',
          affectedElements: ['客户', '产品'],
        },
        {
          type: 'orphan_concept',
          severity: 'low',
          description: '规则概念与客户之间没有直接关系',
          suggestion: '考虑添加"适用于"关系（规则→客户类型），不同客户等级可能适用不同规则',
          affectedElements: ['规则', '客户'],
        },
      ],
    };
  }
}
