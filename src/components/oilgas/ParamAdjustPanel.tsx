"use client";

import * as React from "react";
import { Brain, Check, RotateCw, GitBranch, Plus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useOilGasStore } from "@/lib/oilgas/store";
import type { StepVersion, Task, TaskStep } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

interface Indicator {
  name: string;
  weight: number;
  checked: boolean;
  children?: Indicator[];
}

const INDICATOR_TREE: Indicator[] = [
  {
    name: "储层参数", weight: 0.35, checked: true,
    children: [
      { name: "孔隙度", weight: 0.20, checked: true },
      { name: "渗透率", weight: 0.15, checked: true },
    ],
  },
  {
    name: "含气性", weight: 0.30, checked: true,
    children: [
      { name: "含气饱和度", weight: 0.20, checked: true },
      { name: "电阻率", weight: 0.10, checked: true },
    ],
  },
  {
    name: "裂缝孔洞", weight: 0.20, checked: true,
    children: [
      { name: "裂缝密度", weight: 0.12, checked: true },
      { name: "孔洞发育度", weight: 0.08, checked: true },
    ],
  },
  {
    name: "岩相", weight: 0.15, checked: true,
    children: [
      { name: "白云岩占比", weight: 0.10, checked: true },
      { name: "砂屑岩占比", weight: 0.05, checked: false },
    ],
  },
];

const HEATMAP_DATA = [
  { factor: "孔隙度", values: [0.92, 0.78, 0.65, 0.45] },
  { factor: "渗透率", values: [0.85, 0.72, 0.58, 0.40] },
  { factor: "含气饱和度", values: [0.88, 0.81, 0.52, 0.30] },
  { factor: "电阻率", values: [0.71, 0.65, 0.48, 0.25] },
  { factor: "裂缝密度", values: [0.68, 0.55, 0.42, 0.60] },
  { factor: "孔洞发育度", values: [0.62, 0.48, 0.38, 0.55] },
];
const HEATMAP_COLS = ["气层", "差气层", "干层", "水层"];

export function ParamAdjustPanel({ task, step }: { task: Task; step: TaskStep }) {
  const { setStepStatus, setStepVersions, addTaskMessage } = useOilGasStore();
  const [tree, setTree] = React.useState<Indicator[]>(INDICATOR_TREE);
  const [threshold, setThreshold] = React.useState(85);
  const [showHistory, setShowHistory] = React.useState(false);
  const [customRule, setCustomRule] = React.useState("");

  const versions = step.versions ?? [];
  const activeVer = step.activeVersion ?? 0;

  const toggleChild = (pi: number, ci: number) => {
    setTree((prev) => prev.map((n, i) => i === pi ? { ...n, children: n.children?.map((c, j) => j === ci ? { ...c, checked: !c.checked } : c) } : n));
  };

  const totalWeight = tree.filter((n) => n.checked).reduce((s, n) => s + n.weight, 0);

  const recompute = () => {
    // create new version
    const newVer: StepVersion = {
      id: versions.length + 1,
      label: `v${versions.length + 1}`,
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-"),
      params: { 阈值: threshold, 权重: totalWeight.toFixed(2) },
      note: customRule || `阈值=${threshold}%`,
    };
    const newVersions = [...versions, newVer];
    setStepVersions(task.id, step.id, newVersions, newVersions.length - 1);
    addTaskMessage(task.id, {
      role: "assistant",
      agentId: task.agentId,
      kind: "task-pause",
      content: `已按新规则重新计算（${newVer.label}）：含气性评价阈值=${threshold}%，权重合计=${totalWeight.toFixed(2)}。请查看右侧成果，如仍不满意可继续调整。`,
    });
    setCustomRule("");
  };

  const confirm = () => {
    setStepStatus(task.id, step.id, "executing");
    setTimeout(() => {
      useOilGasStore.getState().advanceStep(task.id);
    }, 1500);
    addTaskMessage(task.id, {
      role: "assistant",
      agentId: task.agentId,
      kind: "text",
      content: `已确认参数，任务「${step.name}」继续执行下一任务。`,
    });
  };

  return (
    <div className="space-y-3">
      {/* Pause alert */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-amber-800">需要您确认 — 任务已自动暂停</div>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{step.confirmationNote}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="indicator">
        <TabsList className="w-full h-8 bg-muted/60">
          <TabsTrigger value="indicator" className="text-[11px] flex-1">评价指标体系</TabsTrigger>
          <TabsTrigger value="relation" className="text-[11px] flex-1">相关性分析</TabsTrigger>
          <TabsTrigger value="rule" className="text-[11px] flex-1">自定义规则</TabsTrigger>
        </TabsList>

        {/* Indicator tree + weights */}
        <TabsContent value="indicator" className="mt-2 space-y-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">主控因素与权重</span>
              <Badge variant="secondary" className="text-[10px]">权重合计 {totalWeight.toFixed(2)}</Badge>
            </div>
            <div className="space-y-1">
              {tree.map((n, pi) => (
                <div key={n.name} className="rounded-md border border-border/70">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/40">
                    <Checkbox checked={n.checked} />
                    <span className="text-xs font-semibold text-foreground flex-1">{n.name}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">权重</span>
                    <Input
                      type="number" step="0.05" min="0" max="1"
                      value={n.weight}
                      onChange={(e) => setTree((prev) => prev.map((x, i) => i === pi ? { ...x, weight: parseFloat(e.target.value) || 0 } : x))}
                      className="h-6 w-14 text-[11px] text-right tabular-nums"
                    />
                  </div>
                  {n.children && (
                    <div className="pl-6 py-1 space-y-1">
                      {n.children.map((c, ci) => (
                        <div key={c.name} className="flex items-center gap-2">
                          <Checkbox checked={c.checked} onCheckedChange={() => toggleChild(pi, ci)} />
                          <span className={cn("text-[11px] flex-1", !c.checked && "text-muted-foreground line-through")}>{c.name}</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{c.weight.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Weight bar chart */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-xs font-semibold text-foreground mb-2">权重分配</div>
            <div className="space-y-1.5">
              {tree.filter((n) => n.checked).flatMap((n) => [n, ...(n.children?.filter((c) => c.checked) ?? [])]).map((ind, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-16 truncate text-right">{ind.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                      style={{ width: `${Math.min(100, ind.weight * 200)}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-foreground font-medium w-8">{ind.weight.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Heatmap */}
        <TabsContent value="relation" className="mt-2">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-xs font-semibold text-foreground mb-2">指标-解释结果相关性热力图</div>
            <div className="overflow-x-auto scroll-thin">
              <div className="min-w-[280px]">
                <div className="grid grid-cols-[80px_repeat(4,1fr)] gap-1 text-[10px]">
                  <div />
                  {HEATMAP_COLS.map((c) => (
                    <div key={c} className="text-center font-medium text-muted-foreground py-1">{c}</div>
                  ))}
                  {HEATMAP_DATA.map((row) => (
                    <React.Fragment key={row.factor}>
                      <div className="text-right pr-2 text-muted-foreground py-1 flex items-center justify-end">{row.factor}</div>
                      {row.values.map((v, i) => (
                        <div
                          key={i}
                          className="h-7 rounded grid place-items-center text-[9px] font-medium text-white"
                          style={{ background: heatColor(v) }}
                          title={`${row.factor} vs ${HEATMAP_COLS[i]}: ${v.toFixed(2)}`}
                        >
                          {v.toFixed(2)}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-muted-foreground">
                  <span>低</span>
                  <div className="flex h-2.5 w-24 rounded overflow-hidden">
                    {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                      <div key={v} className="flex-1" style={{ background: heatColor(v) }} />
                    ))}
                  </div>
                  <span>高</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Custom rule */}
        <TabsContent value="rule" className="mt-2 space-y-3">
          <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">含气性评价阈值</div>
              <div className="flex items-center gap-3">
                <Slider value={[threshold]} onValueChange={([v]) => setThreshold(v)} min={50} max={95} step={1} className="flex-1" />
                <span className="text-sm font-bold text-primary tabular-nums w-12 text-right">{threshold}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">含气饱和度 ≥ 该阈值判为气层，低于阈值 5% 内为差气层</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">自定义修正规则</div>
              <textarea
                value={customRule}
                onChange={(e) => setCustomRule(e.target.value)}
                rows={3}
                placeholder="例如：MX12井 4280-4295m 提升至气层；裂缝发育段含气饱和度门槛下调5%..."
                className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary/50 scroll-thin"
              />
            </div>
            <Button onClick={recompute} size="sm" className="w-full h-8 gap-1.5 bg-primary hover:bg-primary/90">
              <RotateCw className="w-3.5 h-3.5" />
              按新规则重新计算（生成 v{versions.length + 1}）
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Version history */}
      {versions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <GitBranch className="w-3.5 h-3.5 text-violet-600" />
              历史版本
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{versions.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={() => setShowHistory(true)}>
              <History className="w-3 h-3" />对比
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setStepVersions(task.id, step.id, versions, i)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-all",
                  i === activeVer ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {v.label}
                <span className="opacity-70 ml-1">·{v.note?.slice(0, 10) ?? "默认"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm actions */}
      <div className="flex items-center gap-2">
        <Button onClick={confirm} size="sm" className="flex-1 h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Check className="w-3.5 h-3.5" />确认参数，继续执行
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Plus className="w-3.5 h-3.5" />保存为模板
        </Button>
      </div>

      <VersionCompareDialog open={showHistory} onOpenChange={setShowHistory} versions={versions} active={activeVer} onSelect={(i) => setStepVersions(task.id, step.id, versions, i)} />
    </div>
  );
}

function heatColor(v: number): string {
  // green(low) -> yellow -> red(high)
  if (v < 0.5) {
    const t = v / 0.5;
    return `oklch(${0.78 - t * 0.1} ${0.13} ${140 - t * 60})`;
  }
  const t = (v - 0.5) / 0.5;
  return `oklch(${0.68 - t * 0.1} ${0.16 + t * 0.05} ${80 - t * 60})`;
}

function VersionCompareDialog({ open, onOpenChange, versions, active, onSelect }: {
  open: boolean; onOpenChange: (v: boolean) => void; versions: StepVersion[]; active: number; onSelect: (i: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2"><GitBranch className="w-4 h-4 text-violet-600" />多版本成果对比</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">版本</th>
                <th className="px-3 py-2 text-left font-semibold">生成时间</th>
                <th className="px-3 py-2 text-left font-semibold">参数</th>
                <th className="px-3 py-2 text-left font-semibold">备注</th>
                <th className="px-3 py-2 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v, i) => (
                <tr key={v.id} className={cn("border-t border-border", i === active && "bg-primary/5")}>
                  <td className="px-3 py-2">
                    <Badge variant={i === active ? "default" : "secondary"} className="text-[10px]">{v.label}</Badge>
                    {i === active && <span className="ml-1.5 text-[10px] text-primary">当前</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{v.createdAt}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(v.params).map(([k, val]) => (
                        <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{k}:{String(val)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{v.note ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {i !== active && (
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-primary" onClick={() => { onSelect(i); onOpenChange(false); }}>
                        切换查看
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
