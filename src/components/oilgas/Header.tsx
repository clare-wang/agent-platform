"use client";

import * as React from "react";
import { PanelLeft, Plus, ChevronDown, Check, Bell, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOilGasStore } from "@/lib/oilgas/store";
import { AGENTS } from "@/lib/oilgas/data";
import { AgentAvatar, AgentIcon } from "@/lib/oilgas/icons";
import type { AgentId, AppMode } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

export function Header() {
  const { mode, setMode, currentAgentId, setAgent, sidebarOpen, setSidebarOpen } = useOilGasStore();
  const current = AGENTS.find((a) => a.id === currentAgentId)!;

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-3 gap-3 z-30">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="切换侧边栏"
      >
        <PanelLeft className="h-4.5 w-4.5" />
      </Button>

      {/* Logo + title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h3l2-7 4 14 2-7h3" />
            <circle cx="20" cy="12" r="1.5" />
          </svg>
        </div>
        <div className="hidden md:block leading-tight">
          <div className="text-sm font-bold text-foreground">井位部署智能决策平台</div>
          <div className="text-[10px] text-muted-foreground">Intelligent Well Location Deployment</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="ml-2 flex items-center bg-muted rounded-lg p-0.5">
        <ModeButton active={mode === "chat"} onClick={() => setMode("chat")}>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          对话模式
        </ModeButton>
        <ModeButton active={mode === "agent"} onClick={() => setMode("agent")}>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>
          智能体模式
        </ModeButton>
      </div>

      <div className="flex-1" />

      {/* Current agent indicator + switcher (always visible, prominent in agent mode) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "gap-2 h-9 px-2.5 rounded-lg border-border bg-card hover:bg-muted/60",
              mode === "agent" && "ring-2 ring-primary/20 border-primary/40"
            )}
          >
            <AgentAvatar agentId={current.id} icon={current.icon} accent={current.accent} size={26} />
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-semibold text-foreground">{current.shortName}智能体</div>
              <div className="text-[10px] text-muted-foreground">{current.intelligence}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-1.5">
          <DropdownMenuLabel className="text-[11px] text-muted-foreground font-medium px-2 py-1.5">切换智能体</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {AGENTS.map((a) => (
            <DropdownMenuItem
              key={a.id}
              onSelect={() => setAgent(a.id as AgentId)}
              className={cn(
                "gap-2.5 p-2 rounded-md cursor-pointer focus:bg-accent",
                a.id === currentAgentId && "bg-accent/60"
              )}
            >
              <AgentAvatar agentId={a.id} icon={a.icon} accent={a.accent} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  {a.name}
                  {a.id === currentAgentId && <Check className="w-3 h-3 text-primary" />}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{a.domain}</div>
              </div>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">{a.intelligence}</Badge>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-[10px] text-muted-foreground leading-relaxed">
            四个智能体形成数据闭环：测井评价 ⇄ 地质认识，地震分析 → 地质认识 → 井位优选
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" className="text-muted-foreground relative" aria-label="通知">
        <Bell className="w-4.5 h-4.5" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
      </Button>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary grid place-items-center text-primary-foreground text-xs font-bold shadow-sm">
        王
      </div>
    </header>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-all",
        active
          ? "bg-card text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
