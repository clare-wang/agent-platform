"use client";

import * as React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useOilGasStore } from "@/lib/oilgas/store";
import { AGENTS } from "@/lib/oilgas/data";
import { AgentAvatar } from "@/lib/oilgas/icons";
import type { AgentId } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

const EXAMPLES: Record<AgentId, string[]> = {
  logging: [
    "评价 MX12 井及邻井灯影组四段储层质量，重点识别裂缝孔洞与含气性",
    "对 MX18 井开展测井相分析，识别岩性并划分沉积相",
    "精细计算 MX9 井孔渗饱参数，输出综合柱状图",
  ],
  seismic: [
    "全工区灯影组构造分析与裂缝分析",
    "MX 区块叠前储层预测，输出甜点体",
  ],
  geology: [
    "川中灯影组沉积相与成藏匹配分析",
    "融合地震测井成果划分有利区带",
  ],
  optimization: [
    "基于现有认识评价 MX 区块井位，输出推荐与风险评价",
    "蓬莱气区须家河组井位部署有利区分析",
  ],
};

export function NewTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { currentAgentId, createTask, setMode } = useOilGasStore();
  const [agentId, setAgentId] = React.useState<AgentId>(currentAgentId);
  const [instruction, setInstruction] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setAgentId(currentAgentId);
      setInstruction("");
    }
  }, [open, currentAgentId]);

  const submit = () => {
    if (!instruction.trim()) return;
    const title = instruction.trim().slice(0, 30);
    createTask(agentId, title, instruction.trim());
    setMode("agent");
    onOpenChange(false);
  };

  const agent = AGENTS.find((a) => a.id === agentId)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />新建任务
          </DialogTitle>
          <DialogDescription className="text-xs">
            选择智能体并描述需求，智能体将自动拆解为任务序列并开始执行
          </DialogDescription>
        </DialogHeader>

        {/* Agent selection */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">选择智能体</Label>
          <div className="grid grid-cols-2 gap-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAgentId(a.id)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left",
                  a.id === agentId ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <AgentAvatar agentId={a.id} icon={a.icon} accent={a.accent} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-foreground truncate">{a.shortName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{a.intelligence}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Instruction */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">需求描述</Label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder={`请输入您的需求，例如：${EXAMPLES[agentId][0]}`}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 scroll-thin"
          />
        </div>

        {/* Examples */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">参考示例（{agent.shortName}）</Label>
          <div className="space-y-1.5">
            {EXAMPLES[agentId].map((ex, i) => (
              <button
                key={i}
                onClick={() => setInstruction(ex)}
                className="w-full flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-colors text-left group"
              >
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="text-xs text-foreground/80">{ex}</span>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={!instruction.trim()} className="gap-1.5 bg-primary hover:bg-primary/90">
            <Sparkles className="w-3.5 h-3.5" />
            生成任务序列
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
