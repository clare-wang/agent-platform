// Types for the Well Location Deployment Intelligent Agent Platform

export type AgentId = "seismic" | "geology" | "logging" | "optimization";

export interface Agent {
  id: AgentId;
  name: string;        // 测井评价智能体
  shortName: string;   // 测井评价
  domain: string;      // 核心领域
  intelligence: string; // 算法智能 / 推理智能 / 工具智能 / 策略智能
  capabilities: string[]; // 能力列表
  inputs: string[];
  outputs: string[];
  tech: string;
  accent: string;      // hex for dots/badges
  icon: string;        // lucide icon name
  welcome: string;     // welcome message
}

export type TaskStatus =
  | "completed"
  | "executing"
  | "waiting"
  | "paused"     // needs user confirmation
  | "failed"
  | "pending";   // not started

export type ResultType =
  | "structure-map"   // 构造图
  | "seismic-section" // 地震剖面
  | "composite-log"   // 综合柱状图
  | "data-table"      // 数据表
  | "report";         // 报告

export interface TaskStep {
  id: string;
  index: number;
  name: string;
  description: string;
  status: TaskStatus;
  duration?: number;       // seconds
  thinking?: string[];     // reasoning steps
  resultSummary?: string;
  resultType?: ResultType;
  needsConfirmation?: boolean;
  confirmationNote?: string;
  versions?: StepVersion[];
  activeVersion?: number;
}

export interface StepVersion {
  id: number;
  label: string;          // v1, v2
  createdAt: string;
  params: Record<string, string | number>;
  note?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;          // bytes
  type: string;          // mime type
  category: "image" | "document" | "data" | "other";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentId?: AgentId | "multi";
  createdAt: string;
  // optional rich payload
  kind?: "text" | "task-plan" | "task-pause" | "task-done" | "agent-collab";
  meta?: Record<string, unknown>;
  attachments?: FileAttachment[];
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  agentId?: AgentId | "multi";  // primary agent if any
}

export interface TaskParams {
  targetLayer: string;     // 目标层系
  evalPurpose: string;     // 评价目的
  evalMethod: string;      // 评价方法
  region: string;          // 区域
  area: string;            // 面积
  wells: string[];         // 评价井
}

export interface Task {
  id: string;
  title: string;
  agentId: AgentId;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  params: TaskParams;
  steps: TaskStep[];
  messages: ChatMessage[];
  archived?: boolean;
  archiveInfo?: {
    project: string;
    taskType: string;
    resultType: string;
    archivedAt: string;
  };
  currentStepIndex: number;
}

export type AppMode = "chat" | "agent";
