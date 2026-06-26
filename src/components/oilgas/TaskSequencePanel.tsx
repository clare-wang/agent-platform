"use client";

import * as React from "react";
import {
  CheckCircle2, Loader2, Clock, AlertCircle, CircleDot, Play, Square,
  ChevronRight, Brain, FileText, Map, BarChart3, Waves, ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOilGasStore } from "@/lib/oilgas/store";
import type { ResultType, Task, TaskStatus, TaskStep } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

const STATUS: Record<TaskStatus, { label: string; cls: string; icon: React.ReactNode; dot: string }> = {
  completed: { label: "已完成", cls: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-emerald-500" },
  executing: { label: "执行中", cls: "text-primary bg-primary/10 border-primary/20", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, dot: "bg-primary" },
  waiting: { label: "等待中", cls: "text-muted-foreground bg-muted border-border", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-slate-300" },
  paused: { label: "待确认", cls: "text-amber-600 bg-amber-50 border-amber-200", icon: <AlertCircle className="w-3.5 h-3.5" />, dot: "bg-amber-500" },
  failed: { label: "失败", cls: "text-red-600 bg-red-50 border-red-200", icon: <AlertCircle className="w-3.5 h-3.5" />, dot: "bg-red-500" },
  pending: { label: "未开始", cls: "text-slate-500 bg-slate-50 border-slate-200", icon: <CircleDot className="w-3.5 h-3.5" />, dot: "bg-slate-300" },
};

const RESULT_ICON: Record<ResultType, React.ReactNode> = {
  "structure-map": <Map className="w-3 h-3" />,
  "seismic-section": <Waves className="w-3 h-3" />,
  "composite-log": <BarChart3 className="w-3 h-3" />,
  "data-table": <ListOrdered className="w-3 h-3" />,
  "report": <FileText className="w-3 h-3" />,
};

export function TaskSequencePanel({ task }: { task: Task }) {
  const { setActiveStepId, activeStepId, advanceStep, setStepStatus } = useOilGasStore();
  const completed = task.steps.filter((s) => s.status === "completed").length;
  const total = task.steps.length;
  const pct = Math.round((completed / total) * 100);
  const isRunning = task.steps.some((s) => s.status === "executing");

  // auto-advance simulation
  React.useEffect(() => {
    const executing = task.steps.find((s) => s.status === "executing");
    if (!executing) return;
    const timer = setTimeout(() => {
      advanceStep(task.id);
    }, 6000);
    return () => clearTimeout(timer);
  }, [task.steps, task.id, advanceStep]);

  const startAll = () => {
    const firstPending = task.steps.find((s) => s.status === "pending" || s.status === "waiting");
    if (firstPending) setStepStatus(task.id, firstPending.id, "executing");
  };

  const stopAll = () => {
    task.steps.forEach((s) => {
      if (s.status === "executing") setStepStatus(task.id, s.id, "paused");
    });
  };

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-border">
      {/* header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-primary" />
              任务序列
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{total}</Badge>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{task.title}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border", isRunning ? STATUS.executing.cls : task.status === "completed" ? STATUS.completed.cls : STATUS.waiting.cls)}>
            {isRunning ? STATUS.executing.icon : task.status === "completed" ? STATUS.completed.icon : STATUS.waiting.icon}
            {isRunning ? "执行中" : task.status === "completed" ? "全部完成" : "已暂停"}
          </span>
        </div>
        {/* progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">{completed}/{total}</span>
        </div>
      </div>

      {/* steps */}
      <ScrollArea className="flex-1">
        <div className="p-2.5 space-y-1.5">
          {task.steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              isLast={i === task.steps.length - 1}
              active={activeStepId === step.id}
              onSelect={() => setActiveStepId(step.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* controls */}
      <div className="border-t border-border p-2.5 flex items-center gap-2">
        {!isRunning ? (
          <Button onClick={startAll} size="sm" className="flex-1 h-7 gap-1.5 text-xs bg-primary hover:bg-primary/90">
            <Play className="w-3 h-3" /> 继续执行
          </Button>
        ) : (
          <Button onClick={stopAll} variant="outline" size="sm" className="flex-1 h-7 gap-1.5 text-xs">
            <Square className="w-3 h-3" /> 停止执行
          </Button>
        )}
      </div>
    </div>
  );
}

function StepCard({ step, isLast, active, onSelect }: { step: TaskStep; isLast: boolean; active: boolean; onSelect: () => void }) {
  const st = STATUS[step.status];
  const canView = step.status === "completed" || step.status === "executing" || step.status === "paused";
  return (
    <div
      onClick={canView ? onSelect : undefined}
      className={cn(
        "relative rounded-lg border bg-card p-2.5 transition-all",
        active ? "border-primary ring-1 ring-primary/25 shadow-sm" : canView ? "border-border hover:border-primary/40 cursor-pointer" : "border-border opacity-70",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center shrink-0 pt-0.5">
          <div className={cn(
            "w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold border-2 shrink-0",
            step.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
            step.status === "executing" ? "bg-primary border-primary text-white" :
            step.status === "paused" ? "bg-amber-500 border-amber-500 text-white" :
            "bg-card border-slate-300 text-muted-foreground"
          )}>
            {step.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> :
             step.status === "executing" ? <Loader2 className="w-3 h-3 animate-spin" /> :
             step.status === "paused" ? <AlertCircle className="w-3 h-3" /> :
             step.index}
          </div>
          {!isLast && (
            <div className={cn("w-0.5 flex-1 mt-1 min-h-[14px]", step.status === "completed" ? "bg-emerald-300" : "bg-border")} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">#{step.index}</span>
            <span className="text-xs font-semibold text-foreground truncate flex-1">{step.name}</span>
            {step.resultType && canView && (
              <span className="text-muted-foreground">{RESULT_ICON[step.resultType]}</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{step.description}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded border", st.cls)}>
              {st.icon}{st.label}
            </span>
            {step.duration && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />{step.duration}s
              </span>
            )}
            {step.versions && step.versions.length > 1 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-violet-600 font-medium">
                {step.versions.length}版
              </span>
            )}
            {active && canView && <ChevronRight className="w-3 h-3 text-primary ml-auto" />}
          </div>
          {step.status === "paused" && step.confirmationNote && (
            <div className="mt-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-700 leading-snug">
              <Brain className="w-2.5 h-2.5 inline mr-1" />
              {step.confirmationNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
