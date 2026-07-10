"use client";

import * as React from "react";
import { useOilGasStore } from "@/lib/oilgas/store";
import { Header } from "@/components/oilgas/Header";
import { Sidebar } from "@/components/oilgas/Sidebar";
import { ChatMode } from "@/components/oilgas/ChatMode";
import { AgentMode } from "@/components/oilgas/AgentMode";
import { NewTaskDialog } from "@/components/oilgas/NewTaskDialog";

export default function Page() {
  const { mode, sidebarOpen } = useOilGasStore();
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);

  // In agent mode, the sidebar "新建任务" button (data-agent-new) and the empty-state button
  // (dispatches 'open-new-task' event) both open the NewTaskDialog.
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("[data-agent-new]") as HTMLElement | null;
      if (btn) {
        e.preventDefault();
        setNewTaskOpen(true);
      }
    };
    const onEvent = () => setNewTaskOpen(true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("open-new-task", onEvent);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("open-new-task", onEvent);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`shrink-0 transition-all duration-200 overflow-hidden ${sidebarOpen ? "w-72" : "w-0"}`}
        >
          <Sidebar />
        </div>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {mode === "chat" ? <ChatMode /> : <AgentMode />}
        </main>
      </div>

      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
    </div>
  );
}
