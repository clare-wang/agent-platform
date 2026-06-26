import type { Agent, AgentId, Task, TaskStep } from "./types";

export const AGENTS: Agent[] = [
  {
    id: "logging",
    name: "测井评价智能体",
    shortName: "测井评价",
    domain: "储层参数、含气性、裂缝孔洞",
    intelligence: "算法智能",
    capabilities: ["曲线质控", "地层对比", "测井相分析", "岩性识别", "参数计算", "储层识别", "缝洞识别", "含气性评价"],
    inputs: ["测井曲线数据", "区域特征向量（来自地质认识）"],
    outputs: ["储层参数", "含气性评价结果", "裂缝孔洞特征", "区域特征向量（反馈地质认识）"],
    tech: "数据驱动 + 机器学习/深度学习，主动学习策略（置信度<85%推送专家标注）",
    accent: "#2563eb",
    icon: "activity",
    welcome:
      "您好，我是测井评价智能体。我可以帮您完成：测井曲线质控、岩性识别、孔渗饱参数计算、储层与裂缝孔洞识别、含气性评价。请输入您的需求，我将为您生成分析任务序列。",
  },
  {
    id: "seismic",
    name: "地震分析智能体",
    shortName: "地震分析",
    domain: "构造、断裂、地震响应、储层预测",
    intelligence: "工具智能",
    capabilities: ["层位追踪", "断裂提取", "地震属性分析", "叠前储层预测", "构造格架构建", "甜点体预测"],
    inputs: ["井-震协同（来自测井评价）", "目标空间约束", "储层参数预测"],
    outputs: ["构造特征分析", "储层属性提取", "地质体分析"],
    tech: "GeoEast成果调取 + LLM地质语义分析，人机协同分析",
    accent: "#0891b2",
    icon: "waves",
    welcome:
      "您好，我是地震分析智能体。我可以帮您完成：层位追踪、断裂提取、地震属性分析、叠前储层预测，生成构造格架与甜点体。",
  },
  {
    id: "geology",
    name: "地质认识智能体",
    shortName: "地质认识",
    domain: "沉积、成藏、气藏模式",
    intelligence: "推理智能",
    capabilities: ["沉积相编绘", "成藏模式分析", "有利区带划分", "单井相分析", "邻井历史分析", "点-面插值成图"],
    inputs: ["单井相→区域沉积模式（来自测井评价）", "构造框架→成藏模式（来自地震分析）", "多模态成图"],
    outputs: ["圈闭&潜力区", "区域特征向量（反馈测井评价）", "成藏模式"],
    tech: "知识图谱 + 多模态信息融合，关联映射&因果推理",
    accent: "#0d9488",
    icon: "layers",
    welcome:
      "您好，我是地质认识智能体。我可以帮您融合地震、测井及区域地质成果，自动编绘沉积相图、分析成藏模式、划分有利区带。",
  },
  {
    id: "optimization",
    name: "井位优选智能体",
    shortName: "井位优选",
    domain: "多目标优化、井位推荐",
    intelligence: "策略智能",
    capabilities: ["多目标优化", "井位推荐", "风险评价", "部署方案生成", "主控因素分析", "权重分析"],
    inputs: ["圈闭&潜力区（来自地质认识）", "主控因素分析", "有利区识别"],
    outputs: ["井位优选", "井位部署方案", "风险评价报告"],
    tech: "多目标优化 + 人机协同决策，三专业认识互通、一致性更新",
    accent: "#7c3aed",
    icon: "target",
    welcome:
      "您好，我是井位优选智能体。我可以综合构造、储层、含气性、工程风险等指标，自主优选出最优井位并生成论证报告。",
  },
];

export const AGENT_MAP: Record<AgentId, Agent> = AGENTS.reduce(
  (acc, a) => ({ ...acc, [a.id]: a }),
  {} as Record<AgentId, Agent>
);

export function getAgent(id: AgentId): Agent {
  return AGENT_MAP[id];
}

// ---- Task step templates per agent ----

export const LOGGING_TASK_STEPS: Omit<TaskStep, "id" | "status" | "duration">[] = [
  {
    index: 1,
    name: "测井数据加载与质控",
    description: "加载目标井测井曲线，执行深度校正、环境校正、曲线拼接与质量检查",
    thinking: [
      "解析LAS/DLIS文件头，识别曲线通道（GR、SP、RT、AC、DEN、CNL等）",
      "对深度进行井斜校正与拼接对齐，消除重复段与空段",
      "执行环境校正：泥浆侵入、井径垮塌、围岩影响",
      "曲线质控：异常值检测、平滑滤波、信噪比评估",
    ],
    resultSummary: "完成 5 口井曲线质控，井段 3200-4600m，曲线质量评分 92/100",
    resultType: "data-table",
  },
  {
    index: 2,
    name: "岩性识别",
    description: "基于多曲线特征智能识别岩性，划分储层段",
    thinking: [
      "构建岩性识别特征向量：GR、SP、RT、AC、DEN、CNL 组合",
      "调用主动学习分类模型（已训练样本 1200+），预测岩性",
      "置信度<85%的样本自动推送专家标注，模型持续进化",
      "输出连续岩性剖面：灰岩、白云岩、砂屑岩、泥岩、膏盐岩",
    ],
    resultSummary: "识别 5 类岩性，储层段累计厚度 186m，置信度均值 0.91",
    resultType: "composite-log",
  },
  {
    index: 3,
    name: "孔渗饱参数计算",
    description: "计算孔隙度、渗透率、含气饱和度等储层参数",
    thinking: [
      "孔隙度：基于密度-中子交会法 + 声波时差校核",
      "渗透率：基于孔隙度-渗透率经验公式 + 神经网络拟合",
      "含气饱和度：基于阿尔奇公式，m、n 参数分区标定",
      "参数合理性校验与平滑处理",
    ],
    resultSummary: "孔隙度 3.2-8.7%，渗透率 0.05-12.4mD，含气饱和度 55-89%",
    resultType: "composite-log",
  },
  {
    index: 4,
    name: "裂缝孔洞识别",
    description: "识别裂缝发育段与孔洞特征，评价储层改造潜力",
    thinking: [
      "基于电成像测井（FMI）与声波测井联合识别裂缝",
      "计算裂缝孔隙度、裂缝开度、裂缝密度",
      "孔洞识别：基于井径、密度、声波时差异常",
      "缝洞组合分类：孔洞型、裂缝型、缝洞复合型",
    ],
    resultSummary: "识别裂缝发育段 12 段，孔洞发育段 7 段，缝洞复合型储层 9 段",
    resultType: "structure-map",
  },
  {
    index: 5,
    name: "含气性评价",
    description: "综合评价储层含气性，划分气层、差气层、干层",
    thinking: [
      "构建含气性评价指标：含气饱和度、孔隙度、电阻率、声波时差",
      "采用模糊综合评判 + 随机森林分类",
      "划分气层/差气层/干层/水层，输出综合解释成果",
      "与试气结论对比，验证评价精度",
    ],
    resultSummary: "评价气层 14 段、差气层 8 段、干层 23 段，与试气吻合率 87%",
    resultType: "composite-log",
    needsConfirmation: true,
    confirmationNote: "MX12 井 4280-4295m 评价为差气层，但试气显示为气层。是否调整含气性评价阈值并重新计算？",
  },
  {
    index: 6,
    name: "区域特征向量输出",
    description: "提取区域特征向量，反馈至地质认识智能体",
    thinking: [
      "提取各井储层参数特征：均值、方差、空间变异函数",
      "构建区域特征向量：岩相比例、储层厚度、物性参数、含气性指标",
      "输出特征向量至地质认识智能体，支撑区域沉积模式构建",
    ],
    resultSummary: "输出 5 口井区域特征向量，维度 64，覆盖灯影组四段",
    resultType: "report",
  },
];

// ---- Seed tasks for history demonstration ----

function makeSteps(
  template: Omit<TaskStep, "id" | "status" | "duration">[],
  completedUpTo: number
): TaskStep[] {
  return template.map((t) => {
    const status =
      t.index < completedUpTo
        ? "completed"
        : t.index === completedUpTo
        ? t.needsConfirmation
            ? "paused"
            : "executing"
        : "waiting";
    return {
      ...t,
      id: `step-${t.index}`,
      status,
      duration: t.index < completedUpTo ? Math.round(20 + Math.random() * 60) : undefined,
      versions: t.index < completedUpTo || status === "paused" ? [
        { id: 1, label: "v1", createdAt: "2026-06-25 10:24", params: { 阈值: "默认" }, note: "初始计算" },
      ] : undefined,
      activeVersion: 0,
    };
  });
}

export const SEED_TASKS: Task[] = [
  {
    id: "task-logging-1",
    title: "MX12井及邻井灯影组储层质量评价",
    agentId: "logging",
    status: "paused",
    createdAt: "2026-06-26 09:12",
    updatedAt: "2026-06-26 09:38",
    currentStepIndex: 4,
    params: {
      targetLayer: "灯影组四段",
      evalPurpose: "储层质量评价",
      evalMethod: "多曲线融合 + 机器学习分类",
      region: "川中 MX 区块",
      area: "约 128 km²",
      wells: ["MX12", "MX12-H1", "MX9", "MX15", "MX18"],
    },
    steps: makeSteps(LOGGING_TASK_STEPS, 5),
    messages: [
      {
        id: "m1",
        role: "user",
        content: "请评价 MX12 井及邻井灯影组四段储层质量，重点识别裂缝孔洞与含气性。",
        createdAt: "2026-06-26 09:12",
      },
      {
        id: "m2",
        role: "assistant",
        agentId: "logging",
        kind: "task-plan",
        content:
          "好的，已为您生成测井评价任务序列，预计执行 6 个任务，耗时约 8-10 分钟。任务包括：数据质控 → 岩性识别 → 孔渗饱计算 → 裂缝孔洞识别 → 含气性评价 → 区域特征向量输出。请确认任务，可调整分析参数。",
        createdAt: "2026-06-26 09:12",
      },
      {
        id: "m3",
        role: "assistant",
        agentId: "logging",
        kind: "task-pause",
        content:
          "任务 5「含气性评价」执行完成，但 MX12 井 4280-4295m 段评价为差气层，与试气结论（气层）存在差异。已暂停，等待您确认是否调整阈值重新计算。",
        createdAt: "2026-06-26 09:38",
      },
    ],
  },
  {
    id: "task-logging-2",
    title: "MX18井测井相分析与岩性识别",
    agentId: "logging",
    status: "completed",
    createdAt: "2026-06-25 14:20",
    updatedAt: "2026-06-25 15:02",
    currentStepIndex: 6,
    params: {
      targetLayer: "灯影组二段",
      evalPurpose: "岩性识别与测井相分析",
      evalMethod: "聚类分析 + 深度学习",
      region: "川中 MX 区块",
      area: "单井",
      wells: ["MX18"],
    },
    steps: makeSteps(LOGGING_TASK_STEPS, 7).slice(0, 4),
    messages: [
      {
        id: "m1",
        role: "user",
        content: "对 MX18 井开展测井相分析，识别岩性。",
        createdAt: "2026-06-25 14:20",
      },
      {
        id: "m2",
        role: "assistant",
        agentId: "logging",
        kind: "task-done",
        content: "任务完成。MX18 井灯影组二段识别岩性 5 类，划分测井相 8 种，输出综合柱状图。",
        createdAt: "2026-06-25 15:02",
      },
    ],
    archived: true,
    archiveInfo: {
      project: "川中灯影组勘探项目",
      taskType: "测井评价",
      resultType: "综合柱状图",
      archivedAt: "2026-06-25 15:10",
    },
  },
  {
    id: "task-logging-3",
    title: "MX9井孔渗饱参数精细计算",
    agentId: "logging",
    status: "completed",
    createdAt: "2026-06-24 10:05",
    updatedAt: "2026-06-24 10:31",
    currentStepIndex: 3,
    params: {
      targetLayer: "灯影组四段",
      evalPurpose: "储层参数计算",
      evalMethod: "交会法 + 神经网络",
      region: "川中 MX 区块",
      area: "单井",
      wells: ["MX9"],
    },
    steps: makeSteps(LOGGING_TASK_STEPS, 4).slice(0, 3),
    messages: [
      {
        id: "m1",
        role: "user",
        content: "精细计算 MX9 井灯影组四段孔渗饱参数。",
        createdAt: "2026-06-24 10:05",
      },
      {
        id: "m2",
        role: "assistant",
        agentId: "logging",
        kind: "task-done",
        content: "任务完成。MX9 井孔隙度 3.2-8.7%，渗透率 0.05-12.4mD，含气饱和度 55-89%。",
        createdAt: "2026-06-24 10:31",
      },
    ],
  },
];

export const PROJECTS = [
  "川中灯影组勘探项目",
  "蓬莱气区须家河组评价",
  "龙岗地区礁滩储层研究",
  "新场构造带开发项目",
];

export const ARCHIVE_RESULT_TYPES = ["构造图", "地震剖面", "综合柱状图", "储层参数表", "评价报告"];

export const ARCHIVE_TASK_TYPES = ["测井评价", "地震分析", "地质认识", "井位优选"];
