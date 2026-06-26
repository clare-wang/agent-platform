"use client";

import * as React from "react";
import { Check, FolderCheck, Download, FileText, Map, Waves, BarChart3, ListOrdered, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOilGasStore } from "@/lib/oilgas/store";
import { PROJECTS, ARCHIVE_RESULT_TYPES, ARCHIVE_TASK_TYPES } from "@/lib/oilgas/data";
import type { Task } from "@/lib/oilgas/types";
import { toast } from "sonner";

export function ArchiveDialog({ task, open, onOpenChange }: { task: Task; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { archiveTask } = useOilGasStore();
  const [project, setProject] = React.useState(PROJECTS[0]);
  const [taskType, setTaskType] = React.useState(ARCHIVE_TASK_TYPES[0]);
  const [resultType, setResultType] = React.useState(ARCHIVE_RESULT_TYPES[0]);
  const [mode, setMode] = React.useState<"archive" | "download">("archive");

  const handleConfirm = () => {
    if (mode === "archive") {
      archiveTask(task.id, project, taskType, resultType);
      toast.success("已归档到项目成果", {
        description: `${project} · ${taskType} · ${resultType}`,
      });
    } else {
      // simulate download
      const blob = new Blob([`任务：${task.title}\n智能体：${task.agentId}\n参数：${JSON.stringify(task.params, null, 2)}\n`], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${task.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("已下载为本地文件", { description: `${task.title}.txt` });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <FolderCheck className="w-4 h-4 text-primary" />
            成果归档 / 下载
          </DialogTitle>
          <DialogDescription className="text-xs">
            选择归档到项目成果库，或下载为本地文件。归档后可在侧边栏「归档成果」中查看。
          </DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("archive")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${mode === "archive" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
          >
            <FolderCheck className={`w-5 h-5 ${mode === "archive" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs font-medium">归档到项目</span>
            <span className="text-[10px] text-muted-foreground">入库管理，可复用</span>
          </button>
          <button
            onClick={() => setMode("download")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${mode === "download" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
          >
            <Download className={`w-5 h-5 ${mode === "download" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs font-medium">下载本地文件</span>
            <span className="text-[10px] text-muted-foreground">导出原始数据</span>
          </button>
        </div>

        {mode === "archive" ? (
          <div className="space-y-3 py-1">
            <FieldRow label="目标项目">
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECTS.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="任务类型">
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ARCHIVE_TASK_TYPES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="成果类型">
              <Select value={resultType} onValueChange={setResultType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ARCHIVE_RESULT_TYPES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <div className="rounded-md bg-primary/5 border border-primary/15 p-2.5">
              <div className="text-[10px] text-muted-foreground mb-1">归档信息预览</div>
              <div className="text-xs text-foreground">
                <Badge variant="secondary" className="mr-1 text-[10px]">{project}</Badge>
                <Badge variant="secondary" className="mr-1 text-[10px]">{taskType}</Badge>
                <Badge variant="secondary" className="text-[10px]">{resultType}</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5">来源任务：{task.title}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-1">
            <div className="text-[11px] text-muted-foreground mb-2">选择导出格式：</div>
            {[
              { icon: <FileText className="w-4 h-4" />, label: "评价报告 (PDF)", ext: ".pdf" },
              { icon: <Map className="w-4 h-4" />, label: "构造图数据 (Shapefile)", ext: ".shp" },
              { icon: <Waves className="w-4 h-4" />, label: "地震数据 (SEG-Y)", ext: ".sgy" },
              { icon: <BarChart3 className="w-4 h-4" />, label: "测井曲线 (LAS)", ext: ".las" },
              { icon: <ListOrdered className="w-4 h-4" />, label: "参数表 (Excel)", ext: ".xlsx" },
            ].map((f) => (
              <button key={f.label} className="w-full flex items-center gap-2.5 p-2 rounded-md border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-left">
                <span className="text-primary">{f.icon}</span>
                <span className="text-xs flex-1">{f.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{f.ext}</span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={handleConfirm} className="gap-1.5">
            {mode === "archive" ? <><Check className="w-3.5 h-3.5" />确认归档</> : <><HardDrive className="w-3.5 h-3.5" />下载文件</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-5 items-center gap-2">
      <Label className="text-xs text-right text-muted-foreground col-span-2">{label}</Label>
      <div className="col-span-3">{children}</div>
    </div>
  );
}
