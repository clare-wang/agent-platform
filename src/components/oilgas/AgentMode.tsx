"use client";

import * as React from "react";
import {
  ResizableHandle, ResizablePanel, ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useOilGasStore } from "@/lib/oilgas/store";
import { AGENTS } from "@/lib/oilgas/data";
import { AgentAvatar } from "@/lib/oilgas/icons";
import { AgentChatPanel } from "./AgentChatPanel";
import { TaskSequencePanel } from "./TaskSequencePanel";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { Plus, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function AgentMode() {
  const { tasks, activeTaskId } = useOilGasStore();
  const isMobile = useIsMobile();

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  // trigger NewTaskDialog via global event (page.tsx listens)
  const triggerNew = () => {
    window.dispatchEvent(new CustomEvent("open-new-task"));
  };

  if (!activeTask) {
    return (
      <div className="flex-1 h-full grid place-items-center bg-grid">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">开始您的第一个智能体任务</h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            选择左侧智能体，描述您的勘探需求，智能体将自动拆解为任务序列并执行
          </p>
          <button
            onClick={triggerNew}
            className="mt-4 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />新建任务
          </button>

          <div className="grid grid-cols-2 gap-2 mt-6">
            {AGENTS.map((a) => (
              <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-left">
                <AgentAvatar agentId={a.id} icon={a.icon} accent={a.accent} size={32} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">{a.shortName}智能体</div>
                  <div className="text-[10px] text-muted-foreground truncate">{a.domain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex-1 h-full overflow-hidden">
        <TaskDetailPanel task={activeTask} />
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
      <ResizablePanel defaultSize={22} minSize={17} maxSize={30}>
        <AgentChatPanel task={activeTask} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={24} minSize={18} maxSize={32}>
        <TaskSequencePanel task={activeTask} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={54} minSize={38}>
        <TaskDetailPanel task={activeTask} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
