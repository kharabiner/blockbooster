"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Plus, Trash2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type Announcement = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string | null };
};

interface Props {
  eventId: string;
  isOrganizer: boolean;
}

export function AnnouncementSection({ eventId, isOrganizer }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/announcements`);
    if (res.ok) setAnnouncements(await res.json());
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  async function post() {
    if (!content.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/events/${eventId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setPosting(false);
    if (res.ok) {
      toast.success("공지가 등록되었습니다.");
      setContent("");
      setShowForm(false);
      load();
    } else {
      toast.error("공지 등록에 실패했습니다.");
    }
  }

  async function remove(announcementId: string) {
    const res = await fetch(`/api/events/${eventId}/announcements`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId }),
    });
    if (res.ok) {
      toast.success("공지가 삭제되었습니다.");
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-amber-500" />
          공지사항
        </h2>
        {isOrganizer && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            공지 작성
          </Button>
        )}
      </div>

      {showForm && isOrganizer && (
        <div className="border rounded-xl p-4 bg-amber-50 space-y-3">
          <Textarea
            placeholder="이벤트 참가자에게 전달할 공지 내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="bg-white"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setContent(""); }}>
              취소
            </Button>
            <Button size="sm" onClick={post} disabled={posting || !content.trim()}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              등록
            </Button>
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {isOrganizer ? "아직 공지가 없습니다. 위 버튼으로 공지를 작성하세요." : "아직 공지사항이 없습니다."}
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="border-l-4 border-amber-400 bg-amber-50 rounded-r-xl px-4 py-3 relative group">
              <p className="text-sm whitespace-pre-wrap">{a.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {a.author.name} ·{" "}
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ko })}
              </p>
              {isOrganizer && (
                <button
                  onClick={() => remove(a.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
