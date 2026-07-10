"use client";

import * as React from "react";
import { ArrowUp, Sparkles, AtSign, CornerDownLeft, Bot, Workflow, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOilGasStore } from "@/lib/oilgas/store";
import { AGENTS } from "@/lib/oilgas/data";
import { AgentAvatar } from "@/lib/oilgas/icons";
import { AttachmentBar, toAttachment, fileIcon, formatSize } from "./AttachmentBar";
import type { AgentId, ChatMessage, FileAttachment } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { agentId: "logging" as AgentId, text: "评价 MX12 井及邻井灯影组四段储层质量，重点识别裂缝孔洞与含气性", icon: "activity" },
  { agentId: "logging" as AgentId, text: "对 MX18 井开展测井相分析，识别岩性并划分沉积相", icon: "activity" },
  { agentId: "multi" as const, text: "调用测井与地震智能体，联合分析 MX12 井储层与地震响应关系", icon: "workflow" },
  { agentId: "optimization" as AgentId, text: "基于现有认识评价 MX 区块井位，输出井位推荐与风险评价", icon: "target" },
];

export function ChatMode() {
  const {
    conversations, activeConversationId, setActiveConversation,
    createConversation, addConversationMessage, createTask, setMode, setActiveTask,
  } = useOilGasStore();
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<FileAttachment[]>([]);
  const [showMention, setShowMention] = React.useState(false);
  const [mentionIdx, setMentionIdx] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId) ?? null;
  const messages = activeConv?.messages ?? [];

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeConversationId]);

  const handleInput = (v: string) => {
    setInput(v);
    if (v.endsWith("@")) {
      setShowMention(true);
      setMentionIdx(0);
    } else {
      setShowMention(false);
    }
  };

  const insertMention = (name: string) => {
    setInput((p) => p.replace(/@$/, `@${name} `));
    setShowMention(false);
    taRef.current?.focus();
  };

  const detectMentions = (text: string): AgentId[] => {
    const found: AgentId[] = [];
    for (const a of AGENTS) {
      if (text.includes(`@${a.shortName}`)) found.push(a.id);
    }
    return found;
  };

  const send = () => {
    if (!input.trim() && attachments.length === 0) return;
    // ensure there is an active conversation
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }
    const mentions = detectMentions(input);
    const isMulti = mentions.length > 1;
    const userMsg: Omit<ChatMessage, "id" | "createdAt"> = {
      role: "user",
      content: input.trim(),
      agentId: isMulti ? "multi" : mentions[0],
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    addConversationMessage(convId, userMsg);

    const userText = input.trim();
    const hadAttachments = attachments.length > 0;
    setInput("");
    setAttachments([]);

    // Simulate agent response
    setTimeout(() => {
      if (mentions.length === 0) {
        addConversationMessage(convId!, {
          role: "assistant",
          agentId: "multi",
          content: hadAttachments
            ? "已收到您上传的附件。我可以为您调用测井评价、地震分析、地质认识、井位优选四个智能体。请在指令中使用 @测井评价 / @地震分析 / @地质认识 / @井位优选 指定智能体，或同时 @多个智能体协同工作。"
            : "我可以为您调用测井评价、地震分析、地质认识、井位优选四个智能体。请在指令中使用 @测井评价 / @地震分析 / @地质认识 / @井位优选 指定智能体，或同时 @多个智能体协同工作。",
        });
      } else if (isMulti) {
        addConversationMessage(convId!, {
          role: "assistant",
          agentId: "multi",
          kind: "agent-collab",
          content: `已识别到多智能体协同需求，将依次调用 ${mentions.map((m) => AGENTS.find((a) => a.id === m)!.shortName).join("、")} 协同完成。各智能体将独立生成任务序列并共享中间成果。${hadAttachments ? `已加载 ${attachments.length} 个附件作为分析输入。` : ""}`,
          meta: { agents: mentions },
        });
        const first = mentions[0];
        const id = createTask(first, `协同：${userText.slice(0, 24) || "多智能体协同"}`, userText);
        setTimeout(() => {
          addConversationMessage(convId!, {
            role: "assistant",
            agentId: first,
            kind: "task-plan",
            content: `${AGENTS.find((a) => a.id === first)!.name} 已生成任务序列并开始执行。点击下方进入智能体模式查看进度。`,
            meta: { taskId: id },
          });
        }, 600);
      } else {
        const a = mentions[0];
        const id = createTask(a, userText.slice(0, 30) || `${AGENTS.find((x) => x.id === a)!.shortName}任务`, userText);
        addConversationMessage(convId!, {
          role: "assistant",
          agentId: a,
          kind: "task-plan",
          content: `${AGENTS.find((x) => x.id === a)!.name} 已生成任务序列。${hadAttachments ? `已加载 ${attachments.length} 个附件。` : ""}点击下方进入智能体模式查看任务进度与成果。`,
          meta: { taskId: id },
        });
      }
    }, 700);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMention) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIdx((i) => (i + 1) % AGENTS.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIdx((i) => (i - 1 + AGENTS.length) % AGENTS.length); return; }
      if (e.key === "Enter") { e.preventDefault(); insertMention(AGENTS[mentionIdx].shortName); return; }
      if (e.key === "Escape") { setShowMention(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const openTask = (taskId?: string) => {
    if (taskId) setActiveTask(taskId);
    setMode("agent");
  };

  const addFiles = (files: File[]) => {
    const newAtts = files.map(toAttachment);
    setAttachments((prev) => [...prev, ...newAtts]);
  };
  const removeAtt = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  // Welcome screen when no active conversation OR active conversation has no messages yet
  const showWelcome = !activeConv || activeConv.messages.length === 0;
  if (showWelcome) {
    return (
      <div className="flex-1 h-full flex flex-col bg-background bg-grid">
        <div className="flex-1 overflow-y-auto scroll-thin">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg mb-3">
                <Sparkles className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">勘探开发智能体 · 对话模式</h2>
              <p className="text-sm text-muted-foreground mt-1">描述您的需求，使用 @ 调用一个或多个智能体协同工作</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {SUGGESTIONS.map((s, i) => {
                const a = AGENTS.find((x) => x.id === s.agentId);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      let id = activeConversationId;
                      if (!id) id = createConversation();
                      setInput(`@${a?.shortName ?? "测井评价"} ${s.text}`);
                      setTimeout(() => taRef.current?.focus(), 50);
                    }}
                    className="group text-left p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {s.agentId === "multi" ? (
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-cyan-500 grid place-items-center">
                          <Workflow className="w-3.5 h-3.5 text-white" />
                        </span>
                      ) : a ? (
                        <AgentAvatar agentId={a.id} icon={a.icon} accent={a.accent} size={24} />
                      ) : null}
                      <span className="text-xs font-semibold text-foreground">
                        {s.agentId === "multi" ? "多智能体协同" : a?.shortName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{s.text}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Input */}
        <ChatInput
          input={input}
          setInput={handleInput}
          onKeyDown={onKeyDown}
          onSend={send}
          taRef={taRef}
          attachments={attachments}
          onAddFiles={addFiles}
          onRemoveAtt={removeAtt}
          showMention={showMention}
          mentionIdx={mentionIdx}
          setMentionIdx={setMentionIdx}
          insertMention={insertMention}
          setShowMention={setShowMention}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-background bg-grid">
      {/* Conversation header */}
      <div className="shrink-0 border-b border-border bg-card/60 backdrop-blur-sm px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground truncate">{activeConv.title}</span>
          <span className="text-[10px] text-muted-foreground">· {messages.length} 条消息</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-thin" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {messages.map((m) => (
            <ChatBubble key={m.id} msg={m} onOpenTask={openTask} />
          ))}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        input={input}
        setInput={handleInput}
        onKeyDown={onKeyDown}
        onSend={send}
        taRef={taRef}
        attachments={attachments}
        onAddFiles={addFiles}
        onRemoveAtt={removeAtt}
        showMention={showMention}
        mentionIdx={mentionIdx}
        setMentionIdx={setMentionIdx}
        insertMention={insertMention}
        setShowMention={setShowMention}
      />
    </div>
  );
}

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  taRef: React.RefObject<HTMLTextAreaElement | null>;
  attachments: FileAttachment[];
  onAddFiles: (files: File[]) => void;
  onRemoveAtt: (id: string) => void;
  showMention: boolean;
  mentionIdx: number;
  setMentionIdx: (updater: (i: number) => number) => void;
  insertMention: (name: string) => void;
  setShowMention: (v: boolean) => void;
}

function ChatInput(props: ChatInputProps) {
  const { input, setInput, onKeyDown, onSend, taRef, attachments, onAddFiles, onRemoveAtt, showMention, mentionIdx, setMentionIdx, insertMention, setShowMention } = props;
  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-md p-3">
      <div className="max-w-3xl mx-auto relative">
        {showMention && (
          <div className="absolute bottom-full mb-2 left-0 right-0 max-w-sm bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-20">
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-medium border-b border-border bg-muted/50">
              选择智能体 (↑↓ 选择 · Enter 确认)
            </div>
            {AGENTS.map((a, i) => (
              <button
                key={a.id}
                onMouseEnter={() => setMentionIdx(() => i)}
                onClick={() => insertMention(a.shortName)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  i === mentionIdx ? "bg-accent" : "hover:bg-muted/60"
                )}
              >
                <AgentAvatar agentId={a.id} icon={a.icon} accent={a.accent} size={28} />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground">@{a.shortName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{a.domain}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="relative rounded-2xl border border-border bg-background shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
          {/* attachment preview row */}
          {attachments.length > 0 && (
            <div className="px-3 pt-2.5 pb-1 flex flex-wrap gap-1.5 border-b border-border/50">
              {attachments.map((f) => (
                <div
                  key={f.id}
                  className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/70 border border-border text-[10px] max-w-[220px]"
                >
                  <span className="text-primary shrink-0">{fileIcon(f.category)}</span>
                  <span className="truncate text-foreground">{f.name}</span>
                  <span className="text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                  <button
                    onClick={() => onRemoveAtt(f.id)}
                    className="shrink-0 rounded-full hover:bg-background p-0.5 text-muted-foreground hover:text-red-600"
                    aria-label="移除附件"
                  >
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="输入需求，使用 @ 调用智能体，例如 @测井评价 评价MX12井储层..."
            className="w-full resize-none bg-transparent px-4 pt-3 pb-10 text-sm outline-none placeholder:text-muted-foreground/70 scroll-thin"
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <AttachmentBar
              attachments={attachments}
              onAdd={onAddFiles}
              onRemove={onRemoveAtt}
              compact
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-muted-foreground hover:text-foreground"
              type="button"
              onClick={() => { setInput((p) => p + "@"); setShowMention(true); }}
            >
              <AtSign className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">提及智能体</span>
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> 发送 · Shift+Enter 换行
            </span>
            <Button
              onClick={onSend}
              disabled={!input.trim() && attachments.length === 0}
              size="icon"
              className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70 text-center mt-2">
          支持上传图片、文档、数据文件（最多 50 个，单个 ≤ 100MB）· 智能体将自动拆解指令为任务序列
        </p>
      </div>
    </div>
  );
}

function ChatBubble({ msg, onOpenTask }: { msg: ChatMessage; onOpenTask: (taskId?: string) => void }) {
  const isUser = msg.role === "user";
  const agent = msg.agentId && msg.agentId !== "multi" ? AGENTS.find((a) => a.id === msg.agentId) : null;
  const taskId = (msg.meta?.taskId as string) || undefined;

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] space-y-1.5">
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {msg.attachments.map((f) => (
                <div key={f.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/15 border border-primary/30 text-[10px] max-w-[200px]">
                  <span className="text-primary shrink-0">{fileIcon(f.category)}</span>
                  <span className="truncate text-foreground">{f.name}</span>
                  <span className="text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                </div>
              ))}
            </div>
          )}
          {msg.content && (
            <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm shadow-sm">
              {msg.content}
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary grid place-items-center text-primary-foreground text-xs font-bold shrink-0">
          王
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {agent ? (
        <AgentAvatar agentId={agent.id} icon={agent.icon} accent={agent.accent} size={32} />
      ) : (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-500 grid place-items-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="max-w-[80%] space-y-2">
        <div className="text-[10px] text-muted-foreground">
          {agent ? agent.name : "智能体协同"} · {msg.createdAt}
        </div>
        {msg.kind === "agent-collab" && msg.meta?.agents && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {(msg.meta.agents as AgentId[]).map((id) => {
              const a = AGENTS.find((x) => x.id === id)!;
              return (
                <Badge key={id} variant="secondary" className="gap-1 text-[10px] py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.accent }} />
                  {a.shortName}
                </Badge>
              );
            })}
          </div>
        )}
        <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-2.5 text-sm text-foreground shadow-sm">
          {msg.content}
        </div>
        {msg.kind === "task-plan" && taskId && (
          <Button
            onClick={() => onOpenTask(taskId)}
            size="sm"
            className="h-7 gap-1.5 text-[11px] bg-primary hover:bg-primary/90"
          >
            <Workflow className="w-3.5 h-3.5" />
            进入智能体模式查看任务
          </Button>
        )}
      </div>
    </div>
  );
}
