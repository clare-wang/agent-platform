"use client";

import {
  Activity, Waves, Layers, Target, type LucideIcon,
} from "lucide-react";
import type { AgentId } from "./types";

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  waves: Waves,
  layers: Layers,
  target: Target,
};

export function AgentIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Activity;
  return <Cmp className={className} />;
}

export function AgentAvatar({
  agentId,
  icon,
  accent,
  size = 36,
}: {
  agentId: AgentId;
  icon: string;
  accent: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl shrink-0 shadow-sm ring-1 ring-white/40"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
    >
      <AgentIcon name={icon} className="text-white" />
    </span>
  );
}
