import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentId, AppMode, ChatConversation, ChatMessage, Task, TaskStep } from "./types";
import { LOGGING_TASK_STEPS, SEED_TASKS, getAgent } from "./data";

interface OilGasState {
  mode: AppMode;
  currentAgentId: AgentId;
  tasks: Task[];
  activeTaskId: string | null;
  activeStepId: string | null;
  // chat-mode conversations (multiple, each with own message history)
  conversations: ChatConversation[];
  activeConversationId: string | null;
  sidebarOpen: boolean;

  setMode: (m: AppMode) => void;
  setAgent: (id: AgentId) => void;
  setSidebarOpen: (v: boolean) => void;
  setActiveTask: (id: string | null) => void;
  setActiveStepId: (id: string | null) => void;
  setActiveConversation: (id: string | null) => void;

  createTask: (agentId: AgentId, title: string, instruction: string) => string;
  deleteTask: (id: string) => void;
  renameTask: (id: string, title: string) => void;

  // chat conversations
  createConversation: () => string;  // creates empty conversation, returns id
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  addConversationMessage: (convId: string, msg: Omit<ChatMessage, "id" | "createdAt">) => void;
  getActiveConversation: () => ChatConversation | null;

  addTaskMessage: (taskId: string, msg: Omit<ChatMessage, "id" | "createdAt">) => void;

  // step control
  setStepStatus: (taskId: string, stepId: string, status: TaskStep["status"], duration?: number) => void;
  advanceStep: (taskId: string) => void;
  setStepVersions: (taskId: string, stepId: string, versions: TaskStep["versions"], active: number) => void;
  updateTaskParams: (taskId: string, params: Partial<Task["params"]>) => void;

  archiveTask: (taskId: string, project: string, taskType: string, resultType: string) => void;
  unarchiveTask: (taskId: string) => void;
}

function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowStr(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildStepsForAgent(agentId: AgentId): TaskStep[] {
  // For now all agents reuse logging steps skeleton adapted; logging uses full template.
  const template =
    agentId === "logging"
      ? LOGGING_TASK_STEPS
      : agentId === "seismic"
      ? SEISMIC_TASK_STEPS
      : agentId === "geology"
      ? GEOLOGY_TASK_STEPS
      : OPT_TASK_STEPS;
  return template.map((t, idx) => ({
    ...t,
    id: `step-${idx + 1}`,
    status: "pending" as const,
  }));
}

// Skeletons for other agents (kept here to keep data.ts focused)
const SEISMIC_TASK_STEPS: Omit<TaskStep, "id" | "status" | "duration">[] = [
  { index: 1, name: "地震数据加载与预处理", description: "加载地震体数据，去噪、能量均衡", resultType: "seismic-section", thinking: ["加载 SEG-Y 数据", "带通滤波去噪", "振幅能量均衡"] },
  { index: 2, name: "层位追踪", description: "自动追踪目标层位", resultType: "structure-map", thinking: ["种子点拾取", "相干体约束追踪", "层位闭合校验"] },
  { index: 3, name: "断裂提取", description: "基于相干/曲率属性提取断裂", resultType: "structure-map", thinking: ["相干体计算", "蚂蚁体追踪", "断裂组合"] },
  { index: 4, name: "叠前储层预测", description: "AVO/叠前反演预测储层", resultType: "seismic-section", thinking: ["道集质控", "AVO 属性分析", "叠前同步反演"] },
  { index: 5, name: "构造格架与甜点体", description: "构建构造格架，输出甜点体", resultType: "report", thinking: ["构造格架建模", "甜点属性融合", "甜点体输出"] },
];

const GEOLOGY_TASK_STEPS: Omit<TaskStep, "id" | "status" | "duration">[] = [
  { index: 1, name: "单井相分析", description: "基于测井评价结果分析单井相", resultType: "composite-log", thinking: ["测井相聚类", "岩相结合沉积构造", "单井相划分"] },
  { index: 2, name: "区域沉积相编绘", description: "点-面插值成图", resultType: "structure-map", thinking: ["相带边界提取", "克里金插值", "沉积相成图"] },
  { index: 3, name: "成藏模式分析", description: "构造框架+成藏要素分析", resultType: "report", thinking: ["烃源岩分布", "运移路径", "成藏模式推理"] },
  { index: 4, name: "有利区带划分", description: "多图叠加划分有利区", resultType: "structure-map", thinking: ["多要素叠加", "权重评分", "有利区边界"] },
];

const OPT_TASK_STEPS: Omit<TaskStep, "id" | "status" | "duration">[] = [
  { index: 1, name: "成果获取与预处理", description: "加载各专业成果并标准化", resultType: "data-table", thinking: ["成果加载", "坐标统一", "标准化"] },
  { index: 2, name: "评价指标体系构建", description: "构建多级评价指标体系", resultType: "data-table", thinking: ["指标梳理", "层级划分", "体系构建"] },
  { index: 3, name: "主控因素分析", description: "分析成藏/富集/运移控制因素", resultType: "report", thinking: ["相关性分析", "主成分分析", "主控因素筛选"] },
  { index: 4, name: "权重分析", description: "人工确认权重分配", resultType: "data-table", needsConfirmation: true, confirmationNote: "请确认各主控因素权重分配", thinking: ["AHP 层次分析", "熵权法", "组合赋权"] },
  { index: 5, name: "多图叠加分析", description: "多要素图件叠加", resultType: "structure-map", thinking: ["图件配准", "叠加分析", "综合评分"] },
  { index: 6, name: "有利区识别", description: "识别有利区带", resultType: "structure-map", thinking: ["评分阈值", "连通性分析", "有利区输出"] },
  { index: 7, name: "井位推荐", description: "多目标优化推荐井位", resultType: "structure-map", thinking: ["多目标优化", "帕累托前沿", "井位排序"] },
  { index: 8, name: "部署方案生成", description: "生成井位部署方案与风险评价", resultType: "report", thinking: ["方案编写", "风险评价", "报告输出"] },
];

export const useOilGasStore = create<OilGasState>()(
  persist(
    (set, get) => ({
      mode: "agent",
      currentAgentId: "logging",
      tasks: SEED_TASKS,
      activeTaskId: SEED_TASKS[0]?.id ?? null,
      activeStepId: null,
      conversations: [
        {
          id: uid("conv"),
          title: "MX12井储层评价对话",
          createdAt: "2026-06-26 08:40",
          updatedAt: "2026-06-26 09:05",
          messages: [
            {
              id: uid("cm"),
              role: "assistant",
              agentId: "multi",
              content:
                "您好，欢迎进入勘探开发智能体。您可在对话模式中直接描述需求，使用 @测井评价 / @地震分析 / @地质认识 / @井位优选 调用对应智能体，或同时调用多个智能体协同工作。",
              createdAt: "2026-06-26 08:40",
            },
            {
              id: uid("cm"),
              role: "user",
              content: "@测井评价 评价MX12井及邻井灯影组四段储层质量",
              createdAt: "2026-06-26 08:42",
            },
            {
              id: uid("cm"),
              role: "assistant",
              agentId: "logging",
              kind: "task-plan",
              content: "已为您生成测井评价任务序列，共6个任务。可在智能体模式查看进度。",
              createdAt: "2026-06-26 08:43",
              meta: {},
            },
          ],
        },
      ],
      activeConversationId: null,  // null = show welcome screen
      sidebarOpen: true,

      setMode: (m) => set({ mode: m }),
      setAgent: (id) => {
        set({ currentAgentId: id });
        // auto select first task of this agent if none active or active belongs to other agent
        const { tasks, activeTaskId, mode } = get();
        if (mode === "agent") {
          const active = tasks.find((t) => t.id === activeTaskId);
          if (!active || active.agentId !== id) {
            const first = tasks.find((t) => t.agentId === id);
            set({ activeTaskId: first?.id ?? null });
          }
        }
      },
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setActiveTask: (id) => set({ activeTaskId: id, activeStepId: null }),
      setActiveStepId: (id) => set({ activeStepId: id }),
      setActiveConversation: (id) => set({ activeConversationId: id }),

      createTask: (agentId, title, instruction) => {
        const id = uid("task");
        const agent = getAgent(agentId);
        const steps = buildStepsForAgent(agentId);
        const task: Task = {
          id,
          title,
          agentId,
          status: "pending",
          createdAt: nowStr(),
          updatedAt: nowStr(),
          params: {
            targetLayer: agentId === "logging" ? "灯影组四段" : "灯影组",
            evalPurpose: agent.domain.split("、")[0] + "评价",
            evalMethod: "智能分析",
            region: "川中 MX 区块",
            area: "约 128 km²",
            wells: ["MX12", "MX9", "MX15"],
          },
          steps,
          currentStepIndex: 0,
          messages: [
            {
              id: uid("m"),
              role: "user",
              content: instruction,
              createdAt: nowStr(),
            },
            {
              id: uid("m"),
              role: "assistant",
              agentId,
              kind: "task-plan",
              content: `好的，我是${agent.name}。已根据您的需求生成任务序列，共 ${steps.length} 个任务，预计耗时 ${Math.round(steps.length * 1.5)}-${steps.length * 2} 分钟。请在右侧查看任务进度，可随时调整参数。`,
              createdAt: nowStr(),
            },
          ],
        };
        set((s) => ({
          tasks: [task, ...s.tasks],
          activeTaskId: id,
          mode: "agent",
          currentAgentId: agentId,
        }));
        return id;
      },

      deleteTask: (id) =>
        set((s) => {
          const tasks = s.tasks.filter((t) => t.id !== id);
          const activeTaskId = s.activeTaskId === id ? tasks[0]?.id ?? null : s.activeTaskId;
          return { tasks, activeTaskId };
        }),

      renameTask: (id, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, title, updatedAt: nowStr() } : t)),
        })),

      addTaskMessage: (taskId, msg) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  updatedAt: nowStr(),
                  messages: [
                    ...t.messages,
                    { ...msg, id: uid("m"), createdAt: nowStr() },
                  ],
                }
              : t
          ),
        })),

      // ---- Chat conversations ----
      createConversation: () => {
        const id = uid("conv");
        const conv: ChatConversation = {
          id,
          title: "新对话",
          messages: [],
          createdAt: nowStr(),
          updatedAt: nowStr(),
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeConversationId = s.activeConversationId === id ? null : s.activeConversationId;
          return { conversations, activeConversationId };
        }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, title, updatedAt: nowStr() } : c)),
        })),

      addConversationMessage: (convId, msg) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  updatedAt: nowStr(),
                  title: c.messages.length === 0 && msg.content
                    ? msg.content.slice(0, 24)
                    : c.title,
                  messages: [...c.messages, { ...msg, id: uid("cm"), createdAt: nowStr() }],
                }
              : c
          ),
        })),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        if (!activeConversationId) return null;
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },

      setStepStatus: (taskId, stepId, status, duration) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  updatedAt: nowStr(),
                  steps: t.steps.map((st) =>
                    st.id === stepId ? { ...st, status, duration: duration ?? st.duration } : st
                  ),
                }
              : t
          ),
        })),

      advanceStep: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const steps = t.steps.map((st) => ({ ...st }));
            const idx = steps.findIndex((st) => st.status === "executing" || st.status === "paused");
            if (idx >= 0) {
              steps[idx].status = "completed";
              steps[idx].duration = steps[idx].duration ?? Math.round(20 + Math.random() * 50);
              if (!steps[idx].versions) {
                steps[idx].versions = [{ id: 1, label: "v1", createdAt: nowStr(), params: { 阈值: "默认" }, note: "初始计算" }];
                steps[idx].activeVersion = 0;
              }
            }
            const nextIdx = idx >= 0 ? idx + 1 : steps.findIndex((st) => st.status === "pending" || st.status === "waiting");
            if (nextIdx >= 0 && nextIdx < steps.length) {
              steps[nextIdx].status = steps[nextIdx].needsConfirmation ? "paused" : "executing";
            }
            const allDone = steps.every((st) => st.status === "completed");
            return {
              ...t,
              steps,
              currentStepIndex: nextIdx >= 0 ? steps[nextIdx].index - 1 : t.currentStepIndex,
              status: allDone ? "completed" : "executing",
              updatedAt: nowStr(),
            };
          }),
        })),

      setStepVersions: (taskId, stepId, versions, active) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  updatedAt: nowStr(),
                  steps: t.steps.map((st) =>
                    st.id === stepId ? { ...st, versions, activeVersion: active } : st
                  ),
                }
              : t
          ),
        })),

      updateTaskParams: (taskId, params) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, params: { ...t.params, ...params }, updatedAt: nowStr() } : t
          ),
        })),

      archiveTask: (taskId, project, taskType, resultType) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  archived: true,
                  archiveInfo: { project, taskType, resultType, archivedAt: nowStr() },
                  updatedAt: nowStr(),
                }
              : t
          ),
        })),

      unarchiveTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, archived: false, archiveInfo: undefined, updatedAt: nowStr() } : t
          ),
        })),
    }),
    {
      name: "oilgas-well-platform-v2",
      partialize: (s) => ({
        mode: s.mode,
        currentAgentId: s.currentAgentId,
        tasks: s.tasks,
        activeTaskId: s.activeTaskId,
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
);
