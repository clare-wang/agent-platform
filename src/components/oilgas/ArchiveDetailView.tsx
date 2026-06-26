"use client";

import * as React from "react";
import { FolderCheck, FileText, Map, Waves, BarChart3, ListOrdered, Download, Calendar, CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOilGasStore } from "@/lib/oilgas/store";
import { AGENTS, getAgent } from "@/lib/oilgas/data";
import { AgentAvatar } from "@/lib/oilgas/icons";
import { ResultViewer } from "@/lib/oilgas/visualizations";
import type { ResultType, Task } from "@/lib/oilgas/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RESULT_ICON: Record<ResultType, React.ReactNode> = {
  "structure-map": <Map className="w-4 h-4" />,
  "seismic-section": <Waves className="w-4 h-4" />,
  "composite-log": <BarChart3 className="w-4 h-4" />,
  "data-table": <ListOrdered className="w-4 h-4" />,
  "report": <FileText className="w-4 h-4" />,
};

export function ArchiveDetailView() {
  const { tasks, archivedView, setArchivedView, setActiveTask, setMode } = useOilGasStore();
  const archived = tasks.filter((t) => t.archived);
  const [selected, setSelected] = React.useState<Task | null>(archived[0] ?? null);

  React.useEffect(() => {
    if (!selected && archived.length > 0) setSelected(archived[0]);
  }, [archived, selected]);

  const download = (task: Task) => {
    const blob = new Blob([`归档任务：${task.title}\n项目：${task.archiveInfo?.project}\n类型：${task.archiveInfo?.taskType}\n成果：${task.archiveInfo?.resultType}\n归档时间：${task.archiveInfo?.archivedAt}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${task.title}-归档.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已下载归档文件");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="shrink-0 border-b border-border bg-card px-4 py-2.5 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => setArchivedView(false)}>
          <ChevronLeft className="w-4 h-4" />返回任务列表
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <FolderCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-foreground">项目成果归档库</h2>
          <Badge variant="secondary" className="text-[10px]">{archived.length} 项</Badge>
        </div>
      </div>

      {archived.length === 0 ? (
        <div className="flex-1 grid place-items-center">
          <div className="text-center text-muted-foreground">
            <FolderCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">暂无归档成果</p>
            <p className="text-xs mt-1">完成任务后可将成果归档到此处统一管理</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* List */}
          <div className="w-72 shrink-0 border-r border-border bg-sidebar overflow-y-auto scroll-thin">
            <div className="p-2 space-y-1">
              {archived.map((t) => {
                const agent = getAgent(t.agentId);
                const active = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border transition-all",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <AgentAvatar agentId={agent.id} icon={agent.icon} accent={agent.accent} size={24} />
                      <span className="text-xs font-semibold text-foreground flex-1 truncate">{t.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {t.archiveInfo && (
                        <>
                          <Badge variant="secondary" className="text-[9px] h-4 px-1">{t.archiveInfo.project}</Badge>
                          <Badge variant="secondary" className="text-[9px] h-4 px-1">{t.archiveInfo.resultType}</Badge>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                      <Calendar className="w-2.5 h-2.5" />
                      {t.archiveInfo?.archivedAt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <ScrollArea className="flex-1">
            {selected ? (
              <div className="p-4 max-w-5xl mx-auto space-y-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-lg bg-emerald-50 grid place-items-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{selected.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selected.archiveInfo && (
                          <>
                            <Badge variant="outline" className="text-[10px] gap-1"><FolderCheck className="w-2.5 h-2.5" />{selected.archiveInfo.project}</Badge>
                            <Badge variant="outline" className="text-[10px]">{selected.archiveInfo.taskType}</Badge>
                            <Badge variant="outline" className="text-[10px]">{selected.archiveInfo.resultType}</Badge>
                            <Badge variant="outline" className="text-[10px] gap-1"><Calendar className="w-2.5 h-2.5" />{selected.archiveInfo.archivedAt}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => download(selected)}>
                        <Download className="w-3.5 h-3.5" />下载
                      </Button>
                      <Button
                        size="sm" className="h-7 gap-1 text-xs"
                        onClick={() => { setActiveTask(selected.id); setArchivedView(false); setMode("agent"); }}
                      >
                        打开任务
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Show first result visualization from completed steps */}
                {(() => {
                  const stepWithResult = selected.steps.find((s) => s.resultType);
                  if (!stepWithResult?.resultType) return null;
                  return (
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {RESULT_ICON[stepWithResult.resultType]}
                        <span className="text-xs font-semibold text-foreground">{stepWithResult.name} · 成果可视化</span>
                      </div>
                      <ResultViewer type={stepWithResult.resultType} />
                    </div>
                  );
                })()}

                {/* All completed steps summary */}
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-xs font-semibold text-foreground mb-2">任务执行记录</div>
                  <div className="space-y-1.5">
                    {selected.steps.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center text-[10px] font-bold shrink-0">
                          {s.index}
                        </span>
                        <span className="text-foreground font-medium">{s.name}</span>
                        {s.resultSummary && <span className="text-muted-foreground truncate flex-1">— {s.resultSummary}</span>}
                        {s.duration && <span className="text-[10px] text-muted-foreground shrink-0">{s.duration}s</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
