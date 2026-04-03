"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { ModulePanelProps } from "./ModulePanel";
import { cn } from "@/lib/utils";

type ChatMsg = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string | null;
  authorName: string | null;
  author: { name: string | null; image: string | null } | null;
};

const POLL_INTERVAL = 3000;

export function LiveChatPanel({ slotId, config }: ModulePanelProps) {
  const { data: session } = useSession();
  const allowAnonymous = config.allowAnonymous !== false;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [guestName, setGuestName] = useState("");
  const [sending, setSending] = useState(false);
  const [showGuestName, setShowGuestName] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // 초기 로드
  useEffect(() => {
    fetch(`/api/slots/${slotId}/chat`)
      .then((r) => r.json())
      .then((data: ChatMsg[]) => {
        setMessages(data);
        if (data.length > 0) {
          lastTimestampRef.current = data[data.length - 1].createdAt;
        }
        scrollToBottom();
      });
  }, [slotId, scrollToBottom]);

  // 폴링으로 새 메시지 가져오기
  useEffect(() => {
    const timer = setInterval(async () => {
      const url = lastTimestampRef.current
        ? `/api/slots/${slotId}/chat?after=${encodeURIComponent(lastTimestampRef.current)}`
        : `/api/slots/${slotId}/chat`;

      const res = await fetch(url);
      if (!res.ok) return;
      const newMsgs: ChatMsg[] = await res.json();
      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
          return [...prev, ...fresh];
        });
        lastTimestampRef.current = newMsgs[newMsgs.length - 1].createdAt;
        scrollToBottom();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(timer);
  }, [slotId, scrollToBottom]);

  async function send() {
    const content = input.trim();
    if (!content) return;

    if (!session && !allowAnonymous) {
      toast.error("로그인 후 채팅할 수 있습니다.");
      return;
    }

    if (!session && !guestName.trim()) {
      setShowGuestName(true);
      return;
    }

    setSending(true);
    const res = await fetch(`/api/slots/${slotId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, guestName: guestName || undefined }),
    });
    setSending(false);

    if (res.ok) {
      const msg: ChatMsg = await res.json();
      setMessages((prev) => [...prev, msg]);
      lastTimestampRef.current = msg.createdAt;
      setInput("");
      scrollToBottom();
    } else {
      toast.error("메시지 전송에 실패했습니다.");
    }
  }

  async function deleteMsg(messageId: string) {
    const res = await fetch(`/api/slots/${slotId}/chat`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  }

  const displayName = (msg: ChatMsg) =>
    msg.author?.name ?? msg.authorName ?? "익명";

  const isMe = (msg: ChatMsg) =>
    session?.user?.id ? msg.authorId === session.user.id : false;

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col" style={{ height: 400 }}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <MessageCircle className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-medium">실시간 채팅</span>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length}개</span>
      </div>

      {/* 메시지 목록 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            첫 메시지를 남겨보세요!
          </p>
        ) : (
          messages.map((msg) => {
            const mine = isMe(msg);
            return (
              <div key={msg.id} className={cn("flex gap-2 group", mine && "flex-row-reverse")}>
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarImage src={msg.author?.image ?? ""} />
                  <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                    {displayName(msg)[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex flex-col gap-0.5 max-w-[75%]", mine && "items-end")}>
                  <span className="text-xs text-muted-foreground">{displayName(msg)}</span>
                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-sm break-words",
                    mine
                      ? "bg-indigo-500 text-white rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ko })}
                  </span>
                </div>
                {/* 삭제 버튼 (본인 메시지 hover 시) */}
                {mine && (
                  <button
                    onClick={() => deleteMsg(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 비로그인 닉네임 입력 */}
      {showGuestName && !session && (
        <div className="px-4 py-2 border-t bg-yellow-50 flex gap-2">
          <User className="h-4 w-4 text-muted-foreground self-center flex-shrink-0" />
          <Input
            placeholder="닉네임 입력 후 Enter"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setShowGuestName(false); send(); }}}
            className="h-8 text-sm flex-1"
            autoFocus
          />
        </div>
      )}

      {/* 입력창 */}
      {(session || allowAnonymous) && (
        <div className="px-3 py-3 border-t flex gap-2">
          <Input
            placeholder={session ? "메시지 입력..." : "메시지 입력 (Enter로 닉네임 설정)..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
            disabled={sending}
            className="flex-1 h-9 text-sm"
          />
          <Button size="sm" onClick={send} disabled={sending || !input.trim()} className="h-9 px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!session && !allowAnonymous && (
        <div className="px-4 py-3 border-t text-center text-xs text-muted-foreground">
          채팅은 로그인 후 이용할 수 있습니다.
        </div>
      )}
    </div>
  );
}
