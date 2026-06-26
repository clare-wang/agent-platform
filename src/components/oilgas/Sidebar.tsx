"use client";

import * as React from "react";
import { Plus, Search, MoreHorizontal, Trash2, Pencil, Archive, CheckCircle2, Loader2, Clock, CircleDot, AlertCircle, FolderCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useOilGasStore } from "@/lib/oilgas/store";
import { AGENTS } from "@/lib/oilgas/data";
import { AgentAvatar } from "@/lib/oilgas/icons";
import type { AgentId, Task, TaskStatus } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: "已完成", color: "text-emerald-600 bg-emerald-50", icon: <CheckCircle2 className="w-3 h-3" /> },
  executing: { label: "执行中", color: "text-primary bg-primary/10", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  waiting: { label: "等待中", color: "text-muted-foreground bg-muted", icon: <Clock className="w-3 h-3" /> },
  paused: { label: "待确认", color: "text-amber-600 bg-amber-50", icon: <AlertCircle className="w-3 h-3" /> },
  failed: { label: "失败", color: "text-red-600 bg-red-50", icon: <AlertCircle className="w-3 h-3" /> },
  pending: { label: "未开始", color: "text-slate-500 bg-slate-50", icon: <CircleDot className="w-3 h-3" /> },
};

function groupTasksByDate(tasks: Task[]) {
  const today: Task[] = [], yesterday: Task[] = [], week: Task[] = [], older: Task[] = [];
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86400000;
  const startWeek = startToday - 7 * 86400000;
  for (const t of tasks) {
    const ts = new Date(t.createdAt.replace(/-/g, "/")).getTime();
    if (ts >= startToday) today.push(t);
    else if (ts >= startYesterday) yesterday.push(t);
    else if (ts >= startWeek) week.push(t);
    else older.push(t);
  }
  return [
    { label: "今天", items: today },
    { label: "昨天", items: yesterday },
    { label: "近7天", items: week },
    { label: "更早", items: older },
  ].filter((g) => g.items.length > 0);
}

export function Sidebar({ onNewTask }: { onNewTask: () => void }) {
  const { tasks, activeTaskId, setActiveTask, deleteTask, currentAgentId, archivedView, setArchivedView } = useOilGasStore();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | AgentId>("all");

  const filtered = React.useMemo(() => {
    return tasks
      .filter((t) => (archivedView ? t.archived : !t.archived))
      .filter((t) => (filter === "all" ? true : t.agentId === filter))
      .filter((t) => (query ? t.title.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => new Date(b.createdAt.replace(/-/g, "/")).getTime() - new Date(a.createdAt.replace(/-/g, "/")).getTime());
  }, [tasks, filter, query, archivedView]);

  const groups = groupTasksByDate(filtered);

  return (
    <aside className="w-72 shrink-0 h-full border-r border-border bg-sidebar flex flex-col">
      {/* New task */}
      <div className="p-3">
        <Button onClick={onNewTask} className="w-full h-9 gap-2 bg-primary hover:bg-primary/90 shadow-sm">
          <Plus className="w-4 h-4" />
          新建任务
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索任务..."
            className="h-8 pl-8 pr-3 text-xs bg-background"
          />
        </div>
      </div>

      {/* Agent filter chips */}
      <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scroll-thin">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>全部</FilterChip>
        {AGENTS.map((a) => (
          <FilterChip key={a.id} active={filter === a.id} onClick={() => setFilter(a.id)} dot={a.accent}>
            {a.shortName}
          </FilterChip>
        ))}
      </div>

      {/* Archive toggle */}
      <div className="px-3 pb-2 flex items-center gap-1">
        <button
          onClick={() => setArchivedView(false)}
          className={cn("flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors", !archivedView ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          任务列表
        </button>
        <button
          onClick={() => setArchivedView(true)}
          className={cn("flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1", archivedView ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <FolderCheck className="w-3 h-3" />
          归档成果
        </button>
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1 px-2">
        {groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">{archivedView ? "暂无归档成果" : "暂无任务"}</p>
          </div>
        ) : (
          <div className="space-y-3 pb-3">
            {groups.map((g) => (
              <div key={g.label}>
                <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">{g.label}</div>
                <div className="space-y-0.5">
                  {g.items.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      active={t.id === activeTaskId}
                      onSelect={() => setActiveTask(t.id)}
                      onDelete={() => deleteTask(t.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer: agent dependency hint */}
      <div className="border-t border-border p-3 bg-card/50">
        <div className="text-[10px] text-muted-foreground mb-1.5 font-medium">智能体协作链</div>
        <div className="flex items-center gap-1 text-[10px]">
          <AgentMini id="logging" active={currentAgentId === "logging"} />
          <Arrow />
          <AgentMini id="geology" active={currentAgentId === "geology"} />
          <Arrow />
          <AgentMini id="optimization" active={currentAgentId === "optimization"} />
        </div>
        <div className="flex items-center gap-1 text-[10px] mt-1">
          <AgentMini id="seismic" active={currentAgentId === "seismic"} />
          <Arrow />
          <AgentMini id="geology" active={false} />
        </div>
      </div>
    </aside>
  );
}

function AgentMini({ id, active }: { id: AgentId; active: boolean }) {
  const a = AGENTS.find((x) => x.id === id)!;
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", active ? "text-white" : "bg-muted text-muted-foreground")}
      style={active ? { background: a.accent } : undefined}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#fff" : a.accent }} />
      {a.shortName}
    </span>
  );
}

function Arrow() {
  return <span className="text-muted-foreground/60">→</span>;
}

function FilterChip({ active, onClick, children, dot }: { active: boolean; onClick: () => void; children: React.ReactNode; dot?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#fff" : dot }} />}
      {children}
    </button>
  );
}

function TaskItem({ task, active, onSelect, onDelete }: { task: Task; active: boolean; onSelect: () => void; onDelete: () => void }) {
  const agent = AGENTS.find((a) => a.id === task.agentId)!;
  const meta = STATUS_META[task.status];
  const doneSteps = task.steps.filter((s) => s.status === "completed").length;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative px-2.5 py-2 rounded-lg cursor-pointer transition-colors",
        active ? "bg-accent/70 ring-1 ring-primary/30" : "hover:bg-muted/60"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: agent.accent }} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{task.title}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium", meta.color)}>
              {meta.icon}
              {meta.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{doneSteps}/{task.steps.length} 步</span>
            {task.archived && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 font-medium">
                <Archive className="w-2.5 h-2.5" />已归档
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{task.createdAt}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background text-muted-foreground"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem className="text-xs gap-2" onSelect={(e) => e.preventDefault()}>
              <Pencil className="w-3 h-3" /> 重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onSelect={onDelete}>
              <Trash2 className="w-3 h-3" /> 删除任务
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
