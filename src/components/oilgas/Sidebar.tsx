"use client";

import * as React from "react";
import { Plus, Search, MoreHorizontal, Trash2, Pencil, MessageSquare, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useOilGasStore } from "@/lib/oilgas/store";
import { AGENTS } from "@/lib/oilgas/data";
import type { ChatConversation, Task, TaskStatus } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TaskStatus, { label: string; cls: string }> = {
  completed: { label: "已完成", cls: "text-emerald-600 bg-emerald-50" },
  executing: { label: "执行中", cls: "text-primary bg-primary/10" },
  waiting: { label: "等待中", cls: "text-muted-foreground bg-muted" },
  paused: { label: "待确认", cls: "text-amber-600 bg-amber-50" },
  failed: { label: "失败", cls: "text-red-600 bg-red-50" },
  pending: { label: "未开始", cls: "text-slate-500 bg-slate-50" },
};

function groupByDate(items: { createdAt: string }[]) {
  const today: typeof items = [], yesterday: typeof items = [], week: typeof items = [], older: typeof items = [];
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86400000;
  const startWeek = startToday - 7 * 86400000;
  for (const it of items) {
    const ts = new Date(it.createdAt.replace(/-/g, "/")).getTime();
    if (ts >= startToday) today.push(it);
    else if (ts >= startYesterday) yesterday.push(it);
    else if (ts >= startWeek) week.push(it);
    else older.push(it);
  }
  return [
    { label: "今天", items: today },
    { label: "昨天", items: yesterday },
    { label: "近7天", items: week },
    { label: "更早", items: older },
  ].filter((g) => g.items.length > 0);
}

export function Sidebar() {
  const {
    mode, tasks, activeTaskId, setActiveTask, deleteTask,
    conversations, activeConversationId, setActiveConversation,
    createConversation, deleteConversation,
    currentAgentId,
  } = useOilGasStore();
  const [query, setQuery] = React.useState("");

  const isChat = mode === "chat";

  // Filter tasks by current agent (agent mode)
  const agentTasks = React.useMemo(
    () => tasks
      .filter((t) => t.agentId === currentAgentId)
      .filter((t) => query ? t.title.toLowerCase().includes(query.toLowerCase()) : true)
      .sort((a, b) => new Date(b.createdAt.replace(/-/g, "/")).getTime() - new Date(a.createdAt.replace(/-/g, "/")).getTime()),
    [tasks, currentAgentId, query]
  );

  const convs = React.useMemo(
    () => conversations
      .filter((c) => query ? c.title.toLowerCase().includes(query.toLowerCase()) : true)
      .sort((a, b) => new Date(b.updatedAt.replace(/-/g, "/")).getTime() - new Date(a.updatedAt.replace(/-/g, "/")).getTime()),
    [conversations, query]
  );

  const taskGroups = groupByDate(agentTasks);
  const convGroups = groupByDate(convs);

  const handleNew = () => {
    if (isChat) {
      // Directly create a new empty conversation, no dialog
      createConversation();
    }
    // agent mode: handled by parent via onNewTask
  };

  const agent = AGENTS.find((a) => a.id === currentAgentId)!;

  return (
    <aside className="w-72 shrink-0 h-full border-r border-border bg-sidebar flex flex-col">
      {/* New button — label depends on mode */}
      <div className="p-3">
        <Button
          onClick={handleNew}
          data-agent-new={isChat ? undefined : "1"}
          className="w-full h-9 gap-2 bg-primary hover:bg-primary/90 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {isChat ? "新建对话" : "新建任务"}
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isChat ? "搜索对话..." : "搜索任务..."}
            className="h-8 pl-8 pr-3 text-xs bg-background"
          />
        </div>
      </div>

      {/* Current agent indicator (agent mode only) */}
      {!isChat && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: agent.accent }} />
            当前智能体：<span className="text-foreground font-medium">{agent.shortName}智能体</span>
            <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5">{agentTasks.length}</Badge>
          </div>
        </div>
      )}

      {/* List */}
      <ScrollArea className="flex-1 px-2">
        {isChat ? (
          convGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">暂无对话</p>
              <p className="text-[10px] mt-1">点击「新建对话」开始</p>
            </div>
          ) : (
            <div className="space-y-3 pb-3">
              {convGroups.map((g) => (
                <div key={g.label}>
                  <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">{g.label}</div>
                  <div className="space-y-0.5">
                    {g.items.map((c) => (
                      <ConvItem
                        key={c.id}
                        conv={c}
                        active={c.id === activeConversationId}
                        onSelect={() => setActiveConversation(c.id)}
                        onDelete={() => deleteConversation(c.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          taskGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">暂无任务</p>
              <p className="text-[10px] mt-1">点击「新建任务」开始</p>
            </div>
          ) : (
            <div className="space-y-3 pb-3">
              {taskGroups.map((g) => (
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
          )
        )}
      </ScrollArea>
    </aside>
  );
}

function ConvItem({ conv, active, onSelect, onDelete }: { conv: ChatConversation; active: boolean; onSelect: () => void; onDelete: () => void }) {
  const lastMsg = conv.messages[conv.messages.length - 1];
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative px-2.5 py-2 rounded-lg cursor-pointer transition-colors",
        active ? "bg-accent/70 ring-1 ring-primary/30" : "hover:bg-muted/60"
      )}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground line-clamp-1 leading-snug">{conv.title}</div>
          {lastMsg && (
            <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
              {lastMsg.role === "user" ? "我：" : ""}{lastMsg.content}
            </div>
          )}
          <div className="text-[10px] text-muted-foreground mt-0.5">{conv.updatedAt}</div>
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
              <Trash2 className="w-3 h-3" /> 删除对话
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TaskItem({ task, active, onSelect, onDelete }: { task: Task; active: boolean; onSelect: () => void; onDelete: () => void }) {
  const agent = AGENTS.find((a) => a.id === task.agentId)!;
  const meta = STATUS_LABEL[task.status];
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
            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium", meta.cls)}>
              {meta.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{doneSteps}/{task.steps.length} 步</span>
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
