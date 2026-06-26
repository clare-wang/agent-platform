"use client";

import * as React from "react";
import {
  Brain, ChevronDown, ChevronRight, CheckCircle2, Loader2, Clock, AlertCircle,
  Eye, ExternalLink, FolderCheck, Download, ChevronLeft, Save, RotateCw,
  Box, Map as MapIcon, GitBranch, FileSearch, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOilGasStore } from "@/lib/oilgas/store";
import { getAgent } from "@/lib/oilgas/data";
import { ResultViewer } from "@/lib/oilgas/visualizations";
import { ParamAdjustPanel } from "./ParamAdjustPanel";
import { ArchiveDialog } from "./ArchiveDialog";
import type { Task, TaskStatus, TaskStep } from "@/lib/oilgas/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TaskDetailPanel({ task }: { task: Task }) {
  const { activeStepId, setActiveStepId } = useOilGasStore();
  const [archiveOpenState, setArchiveOpenState] = React.useState(false);

  // pick active step: activeStepId -> matching step, else first completed/executing/paused, else last
  const step = React.useMemo(() => {
    if (activeStepId) {
      const s = task.steps.find((x) => x.id === activeStepId);
      if (s) return s;
    }
    const running = task.steps.find((x) => x.status === "executing" || x.status === "paused");
    if (running) return running;
    const lastDone = [...task.steps].reverse().find((x) => x.status === "completed");
    return lastDone ?? task.steps[0];
  }, [task.steps, activeStepId]);

  const agent = getAgent(task.agentId);

  const goToStep = (delta: number) => {
    const idx = task.steps.findIndex((s) => s.id === step.id);
    const next = task.steps[idx + delta];
    if (next) setActiveStepId(next.id);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card/60 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">#{step.index}</span>
              <h2 className="text-sm font-bold text-foreground truncate">{step.name}</h2>
              <StatusBadge status={step.status} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{step.description}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {step.versions && step.versions.length > 0 && (
              <VersionSwitcher task={task} step={step} />
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3 max-w-5xl mx-auto">
          {/* Thinking process */}
          {step.thinking && step.thinking.length > 0 && (
            <ThinkingProcess step={step} />
          )}

          {/* Result summary */}
          {step.resultSummary && step.status !== "pending" && step.status !== "waiting" && (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">任务结果摘要</span>
                {step.duration && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                    <Clock className="w-2.5 h-2.5" />耗时 {step.duration}s
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">{step.resultSummary}</p>
            </div>
          )}

          {/* Param adjustment when paused */}
          {step.status === "paused" && (
            <ParamAdjustPanel task={task} step={step} />
          )}

          {/* Visualization */}
          {step.resultType && (step.status === "completed" || step.status === "executing" || step.status === "paused") && (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">在线可视化成果</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{RESULT_LABEL[step.resultType]}</Badge>
                </div>
                {step.status === "executing" && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                    <Loader2 className="w-3 h-3 animate-spin" />实时渲染中...
                  </span>
                )}
              </div>
              <ResultViewer type={step.resultType} className="" />
            </div>
          )}

          {/* Professional software */}
          {step.resultType && step.status === "completed" && (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">调用专业软件打开</span>
                <span className="text-[10px] text-muted-foreground">（在线成果可同步至专业软件深度查看/调整）</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <SoftwareButton
                  name="OpenWorks"
                  desc="地震体数据 · 剖面"
                  color="from-orange-500 to-red-500"
                  onClick={() => toast.success("正在启动 OpenWorks", { description: "已推送地震体数据，请在新窗口查看剖面" })}
                />
                <SoftwareButton
                  name="双狐软件"
                  desc="构造图 · 矢量编辑"
                  color="from-cyan-500 to-blue-500"
                  onClick={() => toast.success("正在启动双狐软件", { description: "已加载构造图数据，可编辑调整" })}
                />
                <SoftwareButton
                  name="GeoEast"
                  desc="解释成果 · 地震"
                  color="from-emerald-500 to-teal-500"
                  onClick={() => toast.success("正在启动 GeoEast", { description: "已同步解释成果" })}
                />
                <SoftwareButton
                  name="Forward"
                  desc="测井解释 · 综合"
                  color="from-violet-500 to-purple-500"
                  onClick={() => toast.success("正在启动 Forward", { description: "已加载综合柱状图" })}
                />
              </div>
            </div>
          )}

          {/* Result actions */}
          {step.status === "completed" && (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <FolderCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">成果归档与下载</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setArchiveOpenState(true)} size="sm" className="h-7 gap-1.5 text-xs bg-primary hover:bg-primary/90">
                  <FolderCheck className="w-3.5 h-3.5" />归档到项目
                </Button>
                <Button onClick={() => setArchiveOpenState(true)} variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />下载文件
                </Button>
                {task.archived && (
                  <Badge variant="secondary" className="h-7 gap-1 text-[10px] px-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />已归档 · {task.archiveInfo?.project}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Empty state for waiting/pending */}
          {(step.status === "pending" || step.status === "waiting") && (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-muted grid place-items-center mb-3">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">任务等待执行</p>
              <p className="text-xs text-muted-foreground mt-1">该任务将在前置任务完成后自动开始</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between gap-2">
        <Button
          variant="outline" size="sm" className="h-7 gap-1 text-xs"
          onClick={() => goToStep(-1)}
          disabled={task.steps[0].id === step.id}
        >
          <ChevronLeft className="w-3.5 h-3.5" />上一任务
        </Button>
        <div className="flex items-center gap-1.5">
          {step.status === "paused" ? (
            <>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Save className="w-3.5 h-3.5" />保存参数
              </Button>
              <Button
                size="sm" className="h-7 gap-1 text-xs bg-primary"
                onClick={() => { setActiveStepId(step.id); }}
              >
                <RotateCw className="w-3.5 h-3.5" />重新计算
              </Button>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              任务 {step.index} / {task.steps.length} · {agent.shortName}智能体
            </span>
          )}
        </div>
        <Button
          variant="outline" size="sm" className="h-7 gap-1 text-xs"
          onClick={() => goToStep(1)}
          disabled={task.steps[task.steps.length - 1].id === step.id}
        >
          下一任务<ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ArchiveDialog task={task} open={archiveOpenState} onOpenChange={setArchiveOpenState} />
    </div>
  );
}

const RESULT_LABEL: Record<string, string> = {
  "structure-map": "构造图",
  "seismic-section": "地震剖面",
  "composite-log": "综合柱状图",
  "data-table": "参数表",
  "report": "报告",
};

function StatusBadge({ status }: { status: TaskStatus }) {
  const map = {
    completed: { label: "已完成", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    executing: { label: "执行中", cls: "bg-primary/10 text-primary border-primary/20", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    waiting: { label: "等待中", cls: "bg-muted text-muted-foreground border-border", icon: <Clock className="w-3 h-3" /> },
    paused: { label: "待确认", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertCircle className="w-3 h-3" /> },
    failed: { label: "失败", cls: "bg-red-50 text-red-700 border-red-200", icon: <AlertCircle className="w-3 h-3" /> },
    pending: { label: "未开始", cls: "bg-slate-50 text-slate-600 border-slate-200", icon: <Clock className="w-3 h-3" /> },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border", map.cls)}>
      {map.icon}{map.label}
    </span>
  );
}

function ThinkingProcess({ step }: { step: TaskStep }) {
  const [open, setOpen] = React.useState(step.status === "executing");
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-gradient-to-br from-violet-50/40 to-transparent overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 transition-colors">
            <Brain className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-semibold text-foreground">思考过程</span>
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{step.thinking!.length} 步</Badge>
            {step.status === "executing" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-violet-600 ml-1">
                <Loader2 className="w-3 h-3 animate-spin" />推理中
              </span>
            )}
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground ml-auto transition-transform", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-border/60">
            {step.thinking!.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-violet-100 text-violet-600 grid place-items-center text-[9px] font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-[11px] text-foreground/80 leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function VersionSwitcher({ task, step }: { task: Task; step: TaskStep }) {
  const { setStepVersions } = useOilGasStore();
  const versions = step.versions ?? [];
  const active = step.activeVersion ?? 0;
  if (versions.length <= 1) return null;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            <GitBranch className="w-3 h-3 text-violet-600 mx-1" />
            {versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setStepVersions(task.id, step.id, versions, i)}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                  i === active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>多版本成果切换 · 当前 {versions[active]?.label}</p>
          <p className="text-muted-foreground">{versions[active]?.note ?? "初始计算"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SoftwareButton({ name, desc, color, onClick }: { name: string; desc: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left"
    >
      <span className={cn("w-8 h-8 rounded-md bg-gradient-to-br grid place-items-center shrink-0", color)}>
        <ExternalLink className="w-4 h-4 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-foreground">{name}</div>
        <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
      </div>
      <Eye className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
