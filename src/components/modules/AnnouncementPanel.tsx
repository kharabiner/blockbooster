"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { ModulePanelProps } from "./ModulePanel";

type Announcement = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null } | null;
};

export function AnnouncementPanel({ eventId, isOrganizer }: ModulePanelProps) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) return;
    const res = await fetch(`/api/events/${eventId}/announcements`);
    if (res.ok) setItems(await res.json());
  }, [eventId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function handlePost() {
    if (!input.trim() || !eventId) return;
    setPosting(true);
    const res = await fetch(`/api/events/${eventId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });
    setPosting(false);
    if (res.ok) {
      setInput("");
      toast.success("공지가 등록되었습니다.");
      load();
    } else {
      toast.error("공지 등록에 실패했습니다.");
    }
  }

  async function handleDelete(id: string) {
    if (!eventId) return;
    await fetch(`/api/events/${eventId}/announcements?announcementId=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((a) => a.id !== id));
    toast.success("공지가 삭제되었습니다.");
  }

  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-amber-50 space-y-3 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3">
        <Megaphone className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-black text-amber-700">공지사항</span>
      </div>

      {/* 주최자 입력창 */}
      {isOrganizer && (
        <div className="px-4 pb-1 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
            placeholder="공지 내용을 입력하세요…"
            className="flex-1 border-2 border-foreground/20 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handlePost}
            disabled={posting || !input.trim()}
            className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 공지 목록 */}
      <div className="max-h-56 overflow-y-auto divide-y divide-foreground/5">
        {items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">아직 공지가 없습니다.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex items-start gap-2 px-4 py-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm whitespace-pre-wrap break-words">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ko })}
                </p>
              </div>
              {isOrganizer && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
