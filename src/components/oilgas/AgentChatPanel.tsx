"use client";

import * as React from "react";
import { ArrowUp, MapPin, SlidersHorizontal, Check, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { useOilGasStore } from "@/lib/oilgas/store";
import { getAgent } from "@/lib/oilgas/data";
import { AgentAvatar } from "@/lib/oilgas/icons";
import type { Task } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

export function AgentChatPanel({ task }: { task: Task }) {
  const agent = getAgent(task.agentId);
  const { addTaskMessage } = useOilGasStore();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [task.messages.length]);

  const send = () => {
    if (!input.trim()) return;
    addTaskMessage(task.id, { role: "user", content: input.trim() });
    setInput("");
    // simulate agent ack
    setTimeout(() => {
      addTaskMessage(task.id, {
        role: "assistant",
        agentId: agent.id,
        content: "已收到您的指令。当前任务序列执行中，您可在右侧查看进度，或在任务暂停时调整参数。",
      });
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Agent header */}
      <div className="p-3 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start gap-2.5">
          <AgentAvatar agentId={agent.id} icon={agent.icon} accent={agent.accent} size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-foreground truncate">{agent.name}</h3>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">{agent.intelligence}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">{agent.domain}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {agent.capabilities.slice(0, 5).map((c) => (
            <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/8 text-primary/80 font-medium">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto scroll-thin" ref={scrollRef}>
        <div className="p-3 space-y-3">
          {task.messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "user" ? (
                <div className="max-w-[88%] rounded-xl rounded-tr-sm bg-primary text-primary-foreground px-2.5 py-1.5 text-xs shadow-sm">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[88%] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: agent.accent }} />
                    <span className="text-[9px] text-muted-foreground">{agent.shortName} · {m.createdAt}</span>
                    {m.kind === "task-plan" && <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0">任务计划</Badge>}
                    {m.kind === "task-pause" && <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-amber-400 text-amber-600">待确认</Badge>}
                    {m.kind === "task-done" && <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-emerald-400 text-emerald-600">已完成</Badge>}
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-muted/70 border border-border px-2.5 py-1.5 text-xs text-foreground">
                    {m.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Analysis scope + params */}
      <div className="border-t border-border p-2.5 space-y-2 bg-sidebar/50">
        <ScopeCard task={task} />
        <ParamsCard task={task} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-2.5">
        <div className="relative rounded-lg border border-border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={2}
            placeholder="与智能体对话，可补充需求或调整任务..."
            className="w-full resize-none bg-transparent px-2.5 pt-2 pb-8 text-xs outline-none placeholder:text-muted-foreground/70 scroll-thin"
          />
          <Button
            onClick={send}
            disabled={!input.trim()}
            size="icon"
            className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-md bg-primary hover:bg-primary/90"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScopeCard({ task }: { task: Task }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
          <MapPin className="w-3 h-3 text-primary" />
          分析范围
        </div>
        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-primary hover:text-primary">
          查看范围 <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
      <div className="text-[11px] text-muted-foreground space-y-0.5">
        <div>区域：<span className="text-foreground font-medium">{task.params.region}</span></div>
        <div>面积：<span className="text-foreground font-medium">{task.params.area}</span></div>
        <div>评价井：<span className="text-foreground font-medium">{task.params.wells.join("、")}</span></div>
      </div>
    </div>
  );
}

function ParamsCard({ task }: { task: Task }) {
  const { updateTaskParams } = useOilGasStore();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(task.params);

  React.useEffect(() => { setForm(task.params); }, [task.params]);

  const save = () => {
    updateTaskParams(task.id, form);
    setOpen(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
          <SlidersHorizontal className="w-3 h-3 text-primary" />
          参数设置
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-primary hover:text-primary">
              修改参数
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">修改分析参数</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Field label="目标层系">
                <Input value={form.targetLayer} onChange={(e) => setForm({ ...form, targetLayer: e.target.value })} className="h-8 text-xs" />
              </Field>
              <Field label="评价目的">
                <Input value={form.evalPurpose} onChange={(e) => setForm({ ...form, evalPurpose: e.target.value })} className="h-8 text-xs" />
              </Field>
              <Field label="评价方法">
                <Input value={form.evalMethod} onChange={(e) => setForm({ ...form, evalMethod: e.target.value })} className="h-8 text-xs" />
              </Field>
              <Field label="评价井（逗号分隔）">
                <Input
                  value={form.wells.join("、")}
                  onChange={(e) => setForm({ ...form, wells: e.target.value.split(/[、,，]/).map((s) => s.trim()).filter(Boolean) })}
                  className="h-8 text-xs"
                />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}><X className="w-3.5 h-3.5 mr-1" />取消</Button>
              <Button size="sm" onClick={save}><Check className="w-3.5 h-3.5 mr-1" />保存参数</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="text-[11px] text-muted-foreground space-y-0.5">
        <div>目标层系：<span className="text-foreground font-medium">{task.params.targetLayer}</span></div>
        <div>评价目的：<span className="text-foreground font-medium">{task.params.evalPurpose}</span></div>
        <div>评价方法：<span className="text-foreground font-medium">{task.params.evalMethod}</span></div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-4 items-center gap-2">
      <Label className="text-xs text-right text-muted-foreground col-span-1">{label}</Label>
      <div className="col-span-3">{children}</div>
    </div>
  );
}
