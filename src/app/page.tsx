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
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`shrink-0 transition-all duration-200 overflow-hidden ${sidebarOpen ? "w-72" : "w-0"}`}
        >
          <Sidebar onNewTask={() => setNewOpen(true)} />
        </div>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {mode === "chat" ? <ChatMode /> : <AgentMode />}
        </main>
      </div>

      <NewTaskDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
